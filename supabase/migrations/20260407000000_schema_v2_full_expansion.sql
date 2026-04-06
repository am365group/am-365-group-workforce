-- ============================================================
-- AM:365 Workforce Platform — Schema v2 Full Expansion
-- Date: 2026-04-07
-- Purpose: Add all missing tables, columns, enums, RLS policies,
--          encryption, storage, and audit infrastructure per SOW
-- ============================================================

-- ============================================================
-- 1. NEW ENUMS
-- ============================================================
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE public.schedule_assignment_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
CREATE TYPE public.data_source_type AS ENUM ('wolt_api', 'csv_upload', 'manual');
CREATE TYPE public.payroll_status AS ENUM ('draft', 'locked', 'approved', 'paid');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');
CREATE TYPE public.gdpr_request_type AS ENUM ('access', 'erasure');
CREATE TYPE public.gdpr_request_status AS ENUM ('pending', 'processing', 'completed', 'denied');
CREATE TYPE public.registration_path AS ENUM ('bankid', 'manual');
CREATE TYPE public.audit_action AS ENUM (
  'create', 'update', 'delete', 'login', 'logout',
  'approve', 'reject', 'export', 'upload', 'download', 'send'
);

-- ============================================================
-- 2. ALTER partner_applications — add missing columns
-- ============================================================
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Swedish',
  ADD COLUMN IF NOT EXISTS reg_path public.registration_path DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS bankid_session_id TEXT,
  ADD COLUMN IF NOT EXISTS bank_clearing_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS skatt_id_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS delivery_bonus DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS wolt_partner_id TEXT,
  ADD COLUMN IF NOT EXISTS wolt_partner_email TEXT,
  ADD COLUMN IF NOT EXISTS activation_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'SE',
  ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verify_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verify_locked_until TIMESTAMPTZ;

-- Add columns to partner_documents for richer document management
ALTER TABLE public.partner_documents
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS side TEXT CHECK (side IN ('front', 'back', 'full')),
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS verifier_notes TEXT;

-- Add viewed_at to partner_contracts for tracking when partner opened contract
ALTER TABLE public.partner_contracts
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- ============================================================
-- 3. PERSONNUMMER ENCRYPTION (pgcrypto + Vault)
-- ============================================================
-- Store the encryption secret in Supabase Vault
-- This INSERT is idempotent: if the secret already exists it will error,
-- so we use a DO block with exception handling
DO $$
BEGIN
  INSERT INTO vault.secrets (name, secret)
  VALUES ('pii_encryption_key', encode(gen_random_bytes(32), 'hex'));
EXCEPTION
  WHEN unique_violation THEN
    NULL; -- key already exists
END;
$$;

-- Add encrypted column alongside the existing plain one
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS personal_number_encrypted TEXT;

-- Encryption helper (SECURITY DEFINER — runs as DB owner, not caller)
CREATE OR REPLACE FUNCTION public.encrypt_pii(plain_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;
  RETURN encode(pgp_sym_encrypt(plain_text, enc_key), 'base64');
END;
$$;

-- Decryption helper — ONLY callable by admins via RLS on the table
CREATE OR REPLACE FUNCTION public.decrypt_pii(cipher_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  enc_key TEXT;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'pii_encryption_key'
  LIMIT 1;
  RETURN pgp_sym_decrypt(decode(cipher_text, 'base64'), enc_key);
END;
$$;

-- Migrate existing plain-text personnummer values to encrypted form
UPDATE public.partner_applications
SET personal_number_encrypted = public.encrypt_pii(personal_number)
WHERE personal_number IS NOT NULL
  AND personal_number != ''
  AND personal_number_encrypted IS NULL;

-- Auto-encrypt trigger: encrypt personal_number on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.auto_encrypt_personnummer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.personal_number IS NOT NULL AND NEW.personal_number != '' THEN
    NEW.personal_number_encrypted = public.encrypt_pii(NEW.personal_number);
    -- Clear the plain-text field after encrypting
    NEW.personal_number = '********';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_encrypt_personnummer
  BEFORE INSERT OR UPDATE OF personal_number ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_encrypt_personnummer();

-- View for admins to see decrypted personnummer (protected by RLS on base table)
CREATE OR REPLACE VIEW public.partner_applications_admin AS
SELECT
  pa.*,
  CASE
    WHEN pa.personal_number_encrypted IS NOT NULL
    THEN public.decrypt_pii(pa.personal_number_encrypted)
    ELSE pa.personal_number
  END AS personal_number_decrypted
FROM public.partner_applications pa;

-- ============================================================
-- 4. AUDIT LOG TABLE (append-only, system-wide)
-- ============================================================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action public.audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_values JSONB,
  after_values JSONB,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit log; nobody can update or delete
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated staff can INSERT (so the app can log events)
CREATE POLICY "Staff can insert audit entries"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
    OR public.has_role(auth.uid(), 'verifier')
  );

-- Service role can always insert (for Edge Functions / triggers)
CREATE POLICY "Service role can insert audit entries"
  ON public.audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON public.audit_log(action);

-- ============================================================
-- 5. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role manages notifications"
  ON public.notifications FOR ALL
  TO service_role
  USING (true);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;

-- ============================================================
-- 6. CUSTOMERS TABLE (Wolt and future clients)
-- ============================================================
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  org_number TEXT,
  contact_email TEXT,
  finance_email TEXT,
  phone TEXT,
  address TEXT,
  api_type TEXT CHECK (api_type IN ('wolt', 'manual', 'other')),
  api_credentials_vault_id UUID, -- reference to vault.secrets if needed
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. SCHEDULES TABLE (work shifts)
-- ============================================================
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_partners INT DEFAULT 1,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_schedule_range CHECK (end_datetime > start_datetime)
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage schedules"
  ON public.schedules FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

-- Partners can see schedules assigned to them (via schedule_assignments)
CREATE POLICY "Partners see assigned schedules"
  ON public.schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schedule_assignments sa
      JOIN public.partner_applications pa ON pa.id = sa.partner_application_id
      WHERE sa.schedule_id = schedules.id
        AND pa.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_schedules_date ON public.schedules(start_datetime);
CREATE INDEX idx_schedules_customer ON public.schedules(customer_id);

-- ============================================================
-- 8. SCHEDULE ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE public.schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE NOT NULL,
  partner_application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
  status public.schedule_assignment_status NOT NULL DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (schedule_id, partner_application_id)
);

ALTER TABLE public.schedule_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage assignments"
  ON public.schedule_assignments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Partners see own assignments"
  ON public.schedule_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = partner_application_id AND pa.user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can respond to assignments"
  ON public.schedule_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = partner_application_id AND pa.user_id = auth.uid()
    )
  );

CREATE INDEX idx_schedule_assignments_schedule ON public.schedule_assignments(schedule_id);
CREATE INDEX idx_schedule_assignments_partner ON public.schedule_assignments(partner_application_id);

-- ============================================================
-- 9. WOLT DELIVERY DATA TABLE
-- ============================================================
CREATE TABLE public.wolt_delivery_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
  work_date DATE NOT NULL,
  hours_worked DECIMAL(6,2) NOT NULL DEFAULT 0,
  deliveries_completed INT NOT NULL DEFAULT 0,
  data_source public.data_source_type NOT NULL DEFAULT 'manual',
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  correction_notes TEXT,
  corrected_by UUID REFERENCES auth.users(id),
  payroll_run_id UUID, -- FK added after payroll_runs table
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wolt_delivery_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage delivery data"
  ON public.wolt_delivery_data FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Partners see own delivery data"
  ON public.wolt_delivery_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = partner_application_id AND pa.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_wolt_delivery_data_updated_at
  BEFORE UPDATE ON public.wolt_delivery_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_wolt_data_partner ON public.wolt_delivery_data(partner_application_id);
CREATE INDEX idx_wolt_data_date ON public.wolt_delivery_data(work_date);
CREATE INDEX idx_wolt_data_flagged ON public.wolt_delivery_data(is_flagged) WHERE is_flagged = TRUE;

-- ============================================================
-- 10. PAYROLL RUNS TABLE
-- ============================================================
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year INT NOT NULL,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  locked_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  bgmax_file_url TEXT,
  status public.payroll_status NOT NULL DEFAULT 'draft',
  total_gross DECIMAL(12,2),
  total_tax DECIMAL(12,2),
  total_employer_fee DECIMAL(12,2),
  total_net DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period_year, period_month)
);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can manage payroll"
  ON public.payroll_runs FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE TRIGGER update_payroll_runs_updated_at
  BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Now add the FK from wolt_delivery_data to payroll_runs
ALTER TABLE public.wolt_delivery_data
  ADD CONSTRAINT fk_wolt_data_payroll_run
  FOREIGN KEY (payroll_run_id) REFERENCES public.payroll_runs(id) ON DELETE SET NULL;

-- ============================================================
-- 11. PAYROLL ENTRIES TABLE (per-partner salary)
-- ============================================================
CREATE TABLE public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE NOT NULL,
  partner_application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
  hours_worked DECIMAL(8,2) NOT NULL DEFAULT 0,
  deliveries INT NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10,2) NOT NULL,
  delivery_bonus DECIMAL(10,2) NOT NULL DEFAULT 0,
  gross_salary DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  employer_fee DECIMAL(12,2) NOT NULL,
  net_salary DECIMAL(12,2) NOT NULL,
  tax_table_used TEXT,
  employer_fee_rate DECIMAL(5,2) DEFAULT 31.42,
  adjustment_amount DECIMAL(12,2) DEFAULT 0,
  adjustment_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, partner_application_id)
);

ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can manage payroll entries"
  ON public.payroll_entries FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Partners see own payroll entries"
  ON public.payroll_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = partner_application_id AND pa.user_id = auth.uid()
    )
  );

CREATE INDEX idx_payroll_entries_run ON public.payroll_entries(payroll_run_id);
CREATE INDEX idx_payroll_entries_partner ON public.payroll_entries(partner_application_id);

-- ============================================================
-- 12. PAYSLIPS TABLE
-- ============================================================
CREATE TABLE public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_entry_id UUID REFERENCES public.payroll_entries(id) ON DELETE CASCADE NOT NULL,
  partner_application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  pdf_storage_path TEXT,
  emailed_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can manage payslips"
  ON public.payslips FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Partners see own payslips"
  ON public.payslips FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = partner_application_id AND pa.user_id = auth.uid()
    )
  );

CREATE INDEX idx_payslips_partner ON public.payslips(partner_application_id);
CREATE INDEX idx_payslips_period ON public.payslips(period_year, period_month);

-- ============================================================
-- 13. INVOICES TABLE (to Wolt / customers)
-- ============================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  period_year INT NOT NULL,
  period_month INT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  total_hours DECIMAL(10,2) DEFAULT 0,
  total_deliveries INT DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  platform_margin DECIMAL(12,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 25.00,
  vat_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  pdf_storage_path TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  due_date DATE,
  fortnox_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can manage invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_period ON public.invoices(period_year, period_month);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- ============================================================
-- 14. INVOICE LINE ITEMS
-- ============================================================
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  partner_application_id UUID REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  hours DECIMAL(8,2) DEFAULT 0,
  deliveries INT DEFAULT 0,
  unit_rate DECIMAL(10,2) NOT NULL,
  delivery_rate DECIMAL(10,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance staff can manage invoice lines"
  ON public.invoice_line_items FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE INDEX idx_invoice_lines_invoice ON public.invoice_line_items(invoice_id);

-- ============================================================
-- 15. SYSTEM SETTINGS TABLE (admin-configurable key-value)
-- ============================================================
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins can manage settings"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- All staff can read settings (needed for contract templates, email configs, etc.)
CREATE POLICY "Staff can view settings"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'controller')
    OR public.has_role(auth.uid(), 'verifier')
  );

-- Seed essential settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
  ('company_name', 'AM:365 Group AB', 'Legal company name', 'company'),
  ('company_org_number', '559292-4798', 'Swedish org number', 'company'),
  ('company_vat_number', 'SE559292479801', 'VAT registration number', 'company'),
  ('company_address', 'Sweden', 'Company address', 'company'),
  ('company_bank_name', '', 'Bank name for payments', 'finance'),
  ('company_bankgiro', '', 'Bankgiro number for payout', 'finance'),
  ('payday_date', '25', 'Day of month payroll locks', 'finance'),
  ('employer_fee_rate', '31.42', 'Swedish employer fee percentage', 'finance'),
  ('vat_rate', '25.00', 'Standard Swedish VAT rate', 'finance'),
  ('wolt_finance_email', '', 'Wolt finance contact email for partner activation', 'integration'),
  ('contract_template', '', 'Default employment contract template (rich text)', 'contracts'),
  ('document_retention_months', '24', 'ID document retention period in months', 'gdpr'),
  ('payslip_retention_years', '7', 'Payslip retention per Swedish accounting law', 'gdpr'),
  ('platform_email_from', 'AM:365 <noreply@extra2share.net>', 'Default sender for emails', 'email');

-- ============================================================
-- 16. GDPR REQUESTS TABLE
-- ============================================================
CREATE TABLE public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_application_id UUID REFERENCES public.partner_applications(id) ON DELETE SET NULL,
  request_type public.gdpr_request_type NOT NULL,
  status public.gdpr_request_status NOT NULL DEFAULT 'pending',
  requested_by UUID REFERENCES auth.users(id),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  export_file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage GDPR requests"
  ON public.gdpr_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_gdpr_requests_updated_at
  BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gdpr_requests_status ON public.gdpr_requests(status);

-- ============================================================
-- 17. DOCUMENT EXPIRY TRACKING FUNCTION
-- ============================================================
-- Returns partner documents expiring within the next N days
CREATE OR REPLACE FUNCTION public.get_expiring_documents(days_ahead INT DEFAULT 30)
RETURNS TABLE (
  document_id UUID,
  application_id UUID,
  partner_name TEXT,
  partner_email TEXT,
  document_type TEXT,
  expiry_date DATE,
  days_until_expiry INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pd.id AS document_id,
    pd.application_id,
    pa.first_name || ' ' || pa.last_name AS partner_name,
    pa.email AS partner_email,
    pd.document_type,
    pd.expiry_date,
    (pd.expiry_date - CURRENT_DATE) AS days_until_expiry
  FROM public.partner_documents pd
  JOIN public.partner_applications pa ON pa.id = pd.application_id
  WHERE pd.expiry_date IS NOT NULL
    AND pd.expiry_date <= (CURRENT_DATE + days_ahead)
    AND pd.status != 'rejected'
  ORDER BY pd.expiry_date ASC;
$$;

-- ============================================================
-- 18. AUDIT LOG HELPER FUNCTION
-- ============================================================
-- Convenience function for inserting audit entries from Edge Functions / app code
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action public.audit_action,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_before JSONB DEFAULT NULL,
  p_after JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_ip TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_role TEXT;
  v_id UUID;
BEGIN
  -- Look up user email and role for denormalization
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_user_id;
  SELECT ur.role::TEXT INTO v_role FROM public.user_roles ur WHERE ur.user_id = p_user_id LIMIT 1;

  INSERT INTO public.audit_log (
    user_id, user_email, user_role, action, entity_type, entity_id,
    before_values, after_values, notes, ip_address
  ) VALUES (
    p_user_id, v_email, COALESCE(v_role, 'partner'), p_action, p_entity_type, p_entity_id,
    p_before, p_after, p_notes, p_ip::INET
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 19. RATE LIMITING ON OTP VERIFICATION
-- ============================================================
-- Override existing verify_partner_application to add rate limiting
CREATE OR REPLACE FUNCTION public.verify_partner_application(app_id UUID, code TEXT)
RETURNS SETOF public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app public.partner_applications;
BEGIN
  SELECT * INTO v_app FROM public.partner_applications WHERE id = app_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  -- Rate limit: max 5 attempts, then lock for 15 minutes
  IF v_app.verify_attempts >= 5 AND v_app.verify_locked_until > now() THEN
    RAISE EXCEPTION 'Too many attempts. Please try again after %', to_char(v_app.verify_locked_until, 'HH24:MI');
  END IF;

  -- Check code match and expiry
  IF v_app.verification_code = code AND v_app.verification_expires_at > now() THEN
    -- Success: reset attempts, update status
    UPDATE public.partner_applications
    SET verified_at = now(),
        status = 'email_verified',
        verify_attempts = 0,
        verify_locked_until = NULL
    WHERE id = app_id;

    RETURN QUERY SELECT * FROM public.partner_applications WHERE id = app_id;
  ELSE
    -- Failure: increment attempts
    UPDATE public.partner_applications
    SET verify_attempts = COALESCE(verify_attempts, 0) + 1,
        verify_locked_until = CASE
          WHEN COALESCE(verify_attempts, 0) + 1 >= 5
          THEN now() + INTERVAL '15 minutes'
          ELSE verify_locked_until
        END
    WHERE id = app_id;

    RAISE EXCEPTION 'Invalid or expired verification code (% attempts remaining)',
      GREATEST(0, 5 - COALESCE(v_app.verify_attempts, 0) - 1);
  END IF;
END;
$$;

-- ============================================================
-- 20. AUTOMATIC AUDIT TRIGGER FOR STATUS CHANGES
-- ============================================================
CREATE OR REPLACE FUNCTION public.audit_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (
      user_id, action, entity_type, entity_id,
      before_values, after_values, notes
    ) VALUES (
      COALESCE(NEW.reviewed_by, auth.uid()),
      'update',
      'partner_application',
      NEW.id::TEXT,
      jsonb_build_object('status', OLD.status::TEXT),
      jsonb_build_object('status', NEW.status::TEXT),
      'Application status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_application_status
  AFTER UPDATE OF status ON public.partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_application_status_change();

-- ============================================================
-- 21. UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================
CREATE TRIGGER update_partner_documents_updated_at
  BEFORE UPDATE ON public.partner_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 22. ADDITIONAL INDEXES ON EXISTING TABLES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_partner_applications_reg_path ON public.partner_applications(reg_path);
CREATE INDEX IF NOT EXISTS idx_partner_documents_application ON public.partner_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_status ON public.partner_documents(status);
CREATE INDEX IF NOT EXISTS idx_partner_contracts_status ON public.partner_contracts(status);
CREATE INDEX IF NOT EXISTS idx_partner_contracts_partner ON public.partner_contracts(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- ============================================================
-- 23. RLS POLICIES FOR partner_documents (update for signed URL model)
-- ============================================================
-- Partners can insert documents for their own application
DROP POLICY IF EXISTS "Partners can upload documents" ON public.partner_documents;
CREATE POLICY "Partners can upload documents"
  ON public.partner_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = application_id AND pa.user_id = auth.uid()
    )
  );

-- Partners can view their own documents
DROP POLICY IF EXISTS "Partners view own documents" ON public.partner_documents;
CREATE POLICY "Partners view own documents"
  ON public.partner_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_applications pa
      WHERE pa.id = application_id AND pa.user_id = auth.uid()
    )
  );

-- Staff (verifiers) can view and update all documents
DROP POLICY IF EXISTS "Staff can manage documents" ON public.partner_documents;
CREATE POLICY "Staff can manage documents"
  ON public.partner_documents FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'verifier')
  );
