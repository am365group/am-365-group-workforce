const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const validateBody = (body: any) => {
  if (!body) return 'Request body is required.';
  if (!body.appId) return 'Application ID is required.';
  if (!body.verificationCode) return 'Verification code is required.';
  return null;
};

const buildResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const parsed = rawBody ? JSON.parse(rawBody) : null;
    const validationError = validateBody(parsed);

    if (validationError) {
      return buildResponse({ success: false, message: validationError }, 400);
    }

    const { appId, verificationCode } = parsed;

    const { data: application, error } = await supabaseAdmin
      .from('partner_applications')
      .select('id, email, verification_code, verification_expires_at, status')
      .eq('id', appId)
      .eq('verification_code', verificationCode)
      .single();

    if (error || !application) {
      console.error('Verification lookup failed:', error);
      return buildResponse({ success: false, message: 'Application not found. Please check your verification link or register again.' }, 404);
    }

    if (new Date(application.verification_expires_at) < new Date()) {
      return buildResponse({ success: false, message: 'Verification code has expired. Please register again.' }, 400);
    }

    return buildResponse({ success: true, data: application });
  } catch (error: any) {
    console.error('Verification function error:', error);
    return buildResponse({ success: false, message: error.message || 'Internal server error.' }, 500);
  }
});