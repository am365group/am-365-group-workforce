import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, applicationId, displayName } = await req.json();

    if (!email || !password || !applicationId) {
      return new Response(
        JSON.stringify({ error: "email, password, and applicationId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service-role key so we can call admin.createUser with email_confirm: true
    // This bypasses Supabase's own email confirmation flow (partner already verified via OTP)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create user with email already confirmed — no second confirmation email sent
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName ?? email.split("@")[0],
        user_type: "partner",
      },
    });

    if (createError) {
      // If user already exists (e.g. double-submit), return a clear message
      if (createError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please log in." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    const userId = userData.user?.id;

    if (!userId) {
      throw new Error("User creation succeeded but no user ID returned");
    }

    // Link the new auth user to the partner application record
    const { error: updateError } = await supabaseAdmin
      .from("partner_applications")
      .update({
        user_id: userId,
        status: "email_verified",
      })
      .eq("id", applicationId);

    if (updateError) {
      // Non-fatal: user is created, just log the link failure
      console.error("Failed to link user to application:", updateError.message);
    }

    // Log onboarding event
    await supabaseAdmin.from("onboarding_events").insert({
      application_id: applicationId,
      event_type: "account_created",
      notes: "Partner account created and email confirmed via custom OTP flow",
      performed_by: userId,
    });

    return new Response(
      JSON.stringify({ userId, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-partner-account error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
