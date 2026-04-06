# Storage Bucket Setup

The documents storage bucket needs to be created manually in the Supabase dashboard with a secure folder structure.

## Manual Setup Steps:

1. Go to Supabase Dashboard > Storage
2. Create a new bucket with these settings:
   - **Name**: `documents`
   - **Privacy**: Public (for easy file downloads)
   - **File size limit**: 10 MB
   - **Allowed MIME types**:
     - `application/pdf`
     - `image/jpeg`
     - `image/png`

3. Create folder structure:
   - `secure/` - For sensitive documents (ID, passport, bank details)
   - `non-secure/` - For less sensitive documents (address proof, tax certificates)

## Security Classification

**Secure Documents** (stored in `secure/` folder):
- Swedish ID or Passport
- Bank Account Details

**Non-Secure Documents** (stored in `non-secure/` folder):
- Proof of Address
- Tax Certificate

## RLS Policies

Create these storage policies for secure access control:

### For Secure Documents (restricted access)
```sql
-- Users can only upload to their own secure folder
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

-- Users can only view their own secure documents
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
```

### For Non-Secure Documents (standard access)
```sql
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
```

## Alternative: Create via SQL

If you have direct database access, you can use this SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;
```

## Document Verification Flow

The following edge functions handle document management:

- **send-registration-email**: Sends verification links and codes
- **document-verification**: Updates document status and triggers application verification

## Application Status Flow

```
email_verified 
  ↓ (user uploads all required docs)
under_review 
  ↓ (admin verifies documents)
verified 
  ↓ (contract sent)
contract_sent 
  ↓ (user signs contract)
contract_signed 
  ↓ (contract activated)
active
```
