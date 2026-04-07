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
    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get calling user via their JWT
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    // Check caller is admin
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (roleRow?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden — admin role required" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    // ── CREATE ────────────────────────────────────────────────────────────────
    if (action === "create") {
      const { email, password, displayName, role } = body;
      if (!email || !password || !role) {
        return new Response(JSON.stringify({ error: "email, password, and role are required" }), { status: 400, headers: corsHeaders });
      }

      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: displayName ?? email.split("@")[0], user_type: "staff" },
      });

      if (createError) {
        if (createError.message.includes("already been registered")) {
          return new Response(JSON.stringify({ error: "An account with this email already exists." }), { status: 409, headers: corsHeaders });
        }
        throw createError;
      }

      const userId = userData.user?.id;
      if (!userId) throw new Error("User created but no ID returned");

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (roleError) throw roleError;

      // Create profile
      await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        display_name: displayName ?? email.split("@")[0],
        user_type: "staff",
      });

      return new Response(JSON.stringify({ userId, email }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── DELETE ────────────────────────────────────────────────────────────────
    if (action === "delete") {
      const { userId } = body;
      if (!userId) return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: corsHeaders });
      if (userId === caller.id) return new Response(JSON.stringify({ error: "Cannot delete your own account" }), { status: 400, headers: corsHeaders });

      // Delete auth user (cascades to profiles, user_roles via FK or handled separately)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      // Clean up roles and profiles just in case
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

  } catch (err: any) {
    console.error("manage-staff-user error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
