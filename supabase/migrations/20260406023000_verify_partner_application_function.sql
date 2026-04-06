-- Create a secure database function for verification without exposing partner_applications directly

CREATE OR REPLACE FUNCTION public.verify_partner_application(
  app_id uuid,
  code text
)
RETURNS TABLE (
  id uuid,
  email text,
  verification_code text,
  verification_expires_at timestamptz,
  status application_status
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    email,
    verification_code,
    verification_expires_at,
    status
  FROM public.partner_applications
  WHERE id = app_id
    AND verification_code = code
    AND verification_expires_at > now()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.verify_partner_application(uuid, text) IS 'Verify partner registration by application ID and code using a secure definer function.';
