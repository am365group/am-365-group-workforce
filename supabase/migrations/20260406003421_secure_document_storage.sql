-- Secure Document Storage Policies
-- Implements structured folder system with secure/non-secure document classification

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SECURE DOCUMENTS POLICIES (restricted access)
-- ===========================================

-- Users can upload to their own secure folder
CREATE POLICY "Users can upload to secure folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'secure'
  AND (storage.foldername(name))[2] = 'partner-documents'
  AND (storage.foldername(name))[3] = (
    SELECT id::text FROM partner_applications
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ORDER BY created_at DESC LIMIT 1
  )
);

-- Users can view their own secure documents
CREATE POLICY "Users can view own secure documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'secure'
  AND (storage.foldername(name))[2] = 'partner-documents'
  AND (storage.foldername(name))[3] = (
    SELECT id::text FROM partner_applications
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ORDER BY created_at DESC LIMIT 1
  )
);

-- Admins can view all secure documents
CREATE POLICY "Admins can view all secure documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'secure'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'verifier')
  )
);

-- ===========================================
-- NON-SECURE DOCUMENTS POLICIES (standard access)
-- ===========================================

-- Users can upload to their own non-secure folder
CREATE POLICY "Users can upload to non-secure folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'non-secure'
  AND (storage.foldername(name))[2] = 'partner-documents'
  AND (storage.foldername(name))[3] = (
    SELECT id::text FROM partner_applications
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ORDER BY created_at DESC LIMIT 1
  )
);

-- Users can view their own non-secure documents
CREATE POLICY "Users can view own non-secure documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'non-secure'
  AND (storage.foldername(name))[2] = 'partner-documents'
  AND (storage.foldername(name))[3] = (
    SELECT id::text FROM partner_applications
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ORDER BY created_at DESC LIMIT 1
  )
);

-- Admins can view all non-secure documents
CREATE POLICY "Admins can view all non-secure documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'non-secure'
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' IN ('admin', 'verifier')
  )
);

-- ===========================================
-- ADDITIONAL SECURITY MEASURES
-- ===========================================

-- Prevent users from accessing other users' folders
CREATE POLICY "Prevent cross-user access"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- Allow access to own folders
    (storage.foldername(name))[3] = (
      SELECT id::text FROM partner_applications
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      ORDER BY created_at DESC LIMIT 1
    )
    OR
    -- Allow admin access to all folders
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'verifier')
    )
  )
);