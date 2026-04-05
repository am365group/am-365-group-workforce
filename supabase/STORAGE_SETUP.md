# Storage Bucket Setup

The documents storage bucket needs to be created manually in the Supabase dashboard.

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

3. Create RLS policies:
   - Allow users to upload files to their own application folder
   - Allow users to download their own files
   - Allow admins to view all documents

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
