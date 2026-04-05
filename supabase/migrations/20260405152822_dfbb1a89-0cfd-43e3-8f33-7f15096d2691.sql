
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'controller', 'verifier');

-- Create partner application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'email_verified', 'under_review', 'verified', 'contract_sent', 'contract_signed', 'active', 'rejected');

-- Create contract status enum
CREATE TYPE public.contract_status AS ENUM ('draft', 'sent', 'signed', 'expired');

-- Create transport type enum
CREATE TYPE public.transport_type AS ENUM ('bicycle', 'moped', 'car');

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'partner' CHECK (user_type IN ('partner', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- USER ROLES TABLE (for internal staff)
-- ============================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- PARTNER APPLICATIONS TABLE
-- ============================================================
CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  street_address TEXT NOT NULL,
  apartment TEXT,
  city TEXT NOT NULL,
  post_code TEXT NOT NULL,
  personal_number TEXT NOT NULL,
  transport transport_type NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Staff can view all applications
CREATE POLICY "Staff can view all applications"
  ON public.partner_applications FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'verifier')
    OR public.has_role(auth.uid(), 'controller')
  );

-- Staff can update applications
CREATE POLICY "Staff can update applications"
  ON public.partner_applications FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'verifier')
  );

-- Partners can view own application
CREATE POLICY "Partners view own application"
  ON public.partner_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can insert (registration is public before auth)
CREATE POLICY "Anyone can register"
  ON public.partner_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- PARTNER CONTRACTS TABLE
-- ============================================================
CREATE TABLE public.partner_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contract_content TEXT,
  signing_link TEXT,
  status contract_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage contracts"
  ON public.partner_contracts FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'verifier')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Partners view own contracts"
  ON public.partner_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = partner_user_id);

-- ============================================================
-- ONBOARDING EVENTS TABLE (audit trail)
-- ============================================================
CREATE TABLE public.onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.partner_applications(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  notes TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view onboarding events"
  ON public.onboarding_events FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'verifier')
    OR public.has_role(auth.uid(), 'controller')
  );

CREATE POLICY "Staff can insert onboarding events"
  ON public.onboarding_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'verifier')
    OR public.has_role(auth.uid(), 'controller')
  );

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.partner_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'partner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX idx_partner_applications_email ON public.partner_applications(email);
CREATE INDEX idx_partner_applications_user_id ON public.partner_applications(user_id);
CREATE INDEX idx_partner_contracts_application_id ON public.partner_contracts(application_id);
CREATE INDEX idx_onboarding_events_application_id ON public.onboarding_events(application_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
