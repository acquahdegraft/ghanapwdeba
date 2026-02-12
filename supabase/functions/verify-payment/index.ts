import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders, type RateLimitConfig } from "../_shared/rate-limit.ts";

// Rate limit: 30 verification attempts per minute per user (for polling)
const VERIFY_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
};

// Validate reference format (alphanumeric with hyphens, reasonable length)
function validateReference(reference: unknown): reference is string {
  return (
    typeof reference === "string" &&
    reference.length >= 10 &&
    reference.length <= 100 &&
    /^[a-zA-Z0-9_-]+$/.test(reference)
  );
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
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
    
    // Hubtel credentials for status check
    const hubtelClientId = Deno.env.get("HUBTEL_CLIENT_ID");
    const hubtelClientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET");
    const hubtelMerchantAccountNumber = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER");

    if (!hubtelClientId || !hubtelClientSecret || !hubtelMerchantAccountNumber) {
      console.error("Hubtel credentials not configured");
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

    const authenticatedUserId = claimsData.user.id;

    // Apply rate limiting per user
    const rateLimitResult = checkRateLimit(`verify:${authenticatedUserId}`, VERIFY_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${authenticatedUserId}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
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

    // SECURITY: First verify the authenticated user owns this payment
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .select("user_id, status, amount")
      .eq("transaction_reference", reference)
      .single();

    if (paymentError || !paymentRecord) {
      console.error("Payment not found:", paymentError?.message);
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify ownership - authenticated user must own the payment
    if (paymentRecord.user_id !== authenticatedUserId) {
      console.error(`Unauthorized: User ${authenticatedUserId} attempted to verify payment owned by ${paymentRecord.user_id}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized: You can only verify your own payments" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed or failed, just return the current status
    if (paymentRecord.status === "completed" || paymentRecord.status === "failed") {
      return new Response(
        JSON.stringify({
          verified: true,
          status: paymentRecord.status,
          amount: paymentRecord.amount,
          reference: reference,
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(rateLimitResult),
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Check transaction status with Hubtel
    const hubtelAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);
    
    const verifyResponse = await fetch(
      `https://rmsc.hubtel.com/v1/merchantaccount/merchants/${hubtelMerchantAccountNumber}/transactions/status?clientReference=${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Basic ${hubtelAuth}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();
    console.log("Hubtel verification response:", JSON.stringify(verifyData));

    // Check if we got a valid response (handle both PascalCase and camelCase from Hubtel)
    const responseCode = verifyData.ResponseCode || verifyData.responseCode;
    if (responseCode !== "0000") {
      console.error("Hubtel verification failed:", JSON.stringify(verifyData));
      return new Response(
        JSON.stringify({ 
          error: "Unable to verify payment status. Please try again.",
          verified: false,
          status: "pending"
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(rateLimitResult),
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // Map Hubtel status to our status (handle both PascalCase and camelCase)
    // Hubtel statuses: "Paid"/"Success", "Unpaid"/"Failed", "Pending"
    const hubtelStatusData = verifyData.Data || verifyData.data;
    const rawStatus = (hubtelStatusData?.Status || hubtelStatusData?.status || "pending").toLowerCase();
    const hubtelStatus = rawStatus === "paid" ? "success" : rawStatus;
    const paymentStatus = hubtelStatus === "success" ? "completed" : 
                          hubtelStatus === "failed" ? "failed" : "pending";

    // Update payment record using admin client if status changed
    if (paymentStatus !== paymentRecord.status) {
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: paymentStatus,
          payment_date: paymentStatus === "completed" ? new Date().toISOString() : null,
          notes: `Payment ${paymentStatus}. Hubtel Ref: ${hubtelStatusData?.TransactionId || hubtelStatusData?.transactionId || reference}`,
        })
        .eq("transaction_reference", reference);

      if (updateError) {
        console.error("Error updating payment:", updateError);
      }

      // If payment successful, update membership status and send receipt
      if (paymentStatus === "completed") {
        // SECURITY: Use the verified user_id from our database, not from external source
        const verifiedUserId = paymentRecord.user_id;
        
        // Calculate new expiry date (1 year from now)
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({
            membership_status: "active",
            membership_start_date: new Date().toISOString().split("T")[0],
            membership_expiry_date: newExpiryDate.toISOString().split("T")[0],
          })
          .eq("user_id", verifiedUserId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        } else {
          console.log(`Membership activated for user ${verifiedUserId} until ${newExpiryDate.toISOString().split("T")[0]}`);
        }

        // Get payment ID for sending receipt
        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id")
          .eq("transaction_reference", reference)
          .single();

        // Send payment receipt email (fire and forget)
        if (payment?.id) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify({ paymentId: payment.id }),
            });
            console.log("Receipt email request sent");
          } catch (emailError) {
            console.error("Failed to send receipt email:", emailError);
            // Don't fail the request if email fails
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        verified: true,
        status: paymentStatus,
        amount: paymentRecord.amount,
        reference: reference,
        hubtel_transaction_id: hubtelStatusData?.TransactionId || hubtelStatusData?.transactionId,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          ...getRateLimitHeaders(rateLimitResult),
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error: unknown) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed. Please try again or contact support." }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
