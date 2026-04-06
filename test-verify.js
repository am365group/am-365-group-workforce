import { supabase } from "./integrations/supabase/client";

async function testVerifyFunction() {
  try {
    // Test with a dummy app_id and code to see if function exists
    const { data, error } = await supabase.rpc("verify_partner_application", {
      app_id: "00000000-0000-0000-0000-000000000000",
      code: "test"
    });

    console.log("Function test result:", { data, error });
    if (error) {
      console.log("Function exists but returned error (expected for invalid data):", error.message);
    } else {
      console.log("Function exists and returned data:", data);
    }
  } catch (err) {
    console.error("Function does not exist or other error:", err);
  }
}

testVerifyFunction();