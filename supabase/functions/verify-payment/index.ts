import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate reference format (alphanumeric, reasonable length)
function validateReference(reference: unknown): reference is string {
  return (
    typeof reference === "string" &&
    reference.length >= 10 &&
    reference.length <= 100 &&
    /^[a-zA-Z0-9_-]+$/.test(reference)
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for updating records
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reference = (requestBody as Record<string, unknown>)?.reference;

    if (!validateReference(reference)) {
      return new Response(
        JSON.stringify({ error: "Invalid payment reference format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying payment: ${reference}`);

    // Verify transaction with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Verification status:", verifyData.status);

    if (!verifyData.status) {
      console.error("Paystack verification failed:", JSON.stringify(verifyData));
      return new Response(
        JSON.stringify({ 
          error: "Unable to verify payment. Please try again.",
          verified: false 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactionStatus = verifyData.data.status;
    const paymentStatus = transactionStatus === "success" ? "completed" : 
                          transactionStatus === "failed" ? "failed" : "pending";

    // Update payment record
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: paymentStatus,
        payment_date: paymentStatus === "completed" ? new Date().toISOString() : null,
        notes: `Payment ${paymentStatus}. Ref: ${reference}`,
      })
      .eq("transaction_reference", reference);

    if (updateError) {
      console.error("Error updating payment:", updateError);
    }

    // If payment successful, update membership status
    if (paymentStatus === "completed" && verifyData.data.metadata?.user_id) {
      const userId = verifyData.data.metadata.user_id;
      
      // Calculate new expiry date (1 year from now or from current expiry)
      const newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          membership_status: "active",
          membership_start_date: new Date().toISOString().split("T")[0],
          membership_expiry_date: newExpiryDate.toISOString().split("T")[0],
        })
        .eq("user_id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      } else {
        console.log(`Membership activated for user until ${newExpiryDate.toISOString().split("T")[0]}`);
      }
    }

    return new Response(
      JSON.stringify({
        verified: true,
        status: paymentStatus,
        amount: verifyData.data.amount / 100,
        reference: verifyData.data.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again or contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
