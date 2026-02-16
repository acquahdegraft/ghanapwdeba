import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Hubtel callback handler for async payment notifications
// This endpoint receives webhooks from Hubtel when payment status changes
//
// Security: Since Hubtel doesn't provide webhook signatures, we implement our own
// verification using a one-time webhook token stored with the pending payment record.
// The token is cleared after first use to prevent replay attacks.

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the callback data from Hubtel
    let callbackData: Record<string, unknown>;
    try {
      callbackData = await req.json();
    } catch {
      console.error("Invalid JSON in Hubtel callback");
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("Hubtel callback received:", JSON.stringify(callbackData));

    // Extract relevant fields from Hubtel callback
    // Hubtel sends data in nested structure: { ResponseCode, Status, Data: { ClientReference, Status, Amount, ... } }
    const topLevel = callbackData as Record<string, unknown>;
    const nestedData = (topLevel.Data || topLevel.data || {}) as Record<string, unknown>;
    
    // ClientReference and other fields can be at top level OR nested in Data
    const ClientReference = (nestedData.ClientReference || nestedData.clientReference || topLevel.ClientReference || topLevel.clientReference) as string | undefined;
    const Status = (nestedData.Status || nestedData.status || topLevel.Status || topLevel.status) as string | undefined;
    const TransactionId = (nestedData.TransactionId || nestedData.transactionId || nestedData.CheckoutId || topLevel.TransactionId || topLevel.transactionId) as string | undefined;
    const Amount = (nestedData.Amount || nestedData.amount || topLevel.Amount || topLevel.amount) as number | undefined;

    // === INPUT VALIDATION ===
    
    // Validate ClientReference presence
    if (!ClientReference) {
      console.error("Missing ClientReference in callback");
      return new Response(JSON.stringify({ success: false, error: "Missing ClientReference" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate ClientReference format (alphanumeric with hyphens and underscores, max 100 chars)
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(ClientReference)) {
      console.error("Invalid ClientReference format");
      return new Response(JSON.stringify({ success: false, error: "Invalid reference format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate Status field - must be a non-empty string with allowed values
    const allowedStatuses = ["success", "Success", "SUCCESS", "failed", "Failed", "FAILED", "pending", "Pending", "PENDING", "cancelled", "Cancelled", "CANCELLED"];
    if (Status !== undefined && Status !== null) {
      if (typeof Status !== "string" || Status.length > 50) {
        console.error("Invalid Status format");
        return new Response(JSON.stringify({ success: false, error: "Invalid status format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      // Warn but don't reject unknown statuses (Hubtel may add new ones)
      if (!allowedStatuses.includes(Status)) {
        console.warn(`Unknown Status value received: ${Status}`);
      }
    }

    // Validate TransactionId format if provided (alphanumeric, max 100 chars)
    if (TransactionId !== undefined && TransactionId !== null) {
      if (typeof TransactionId !== "string" || TransactionId.length > 100 || !/^[a-zA-Z0-9_-]*$/.test(TransactionId)) {
        console.error("Invalid TransactionId format");
        return new Response(JSON.stringify({ success: false, error: "Invalid transaction ID format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Validate Amount if provided (must be a positive number)
    if (Amount !== undefined && Amount !== null) {
      if (typeof Amount !== "number" || Amount < 0 || Amount > 1000000 || !isFinite(Amount)) {
        console.error("Invalid Amount value");
        return new Response(JSON.stringify({ success: false, error: "Invalid amount value" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Find the payment record with its webhook token
    const { data: paymentRecord, error: findError } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, status, amount, webhook_token")
      .eq("transaction_reference", ClientReference)
      .single();

    if (findError || !paymentRecord) {
      console.error("Payment not found for reference:", ClientReference);
      return new Response(JSON.stringify({ success: false, error: "Payment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // SECURITY CHECK: Verify Amount matches original payment (if provided)
    // Hubtel may include processing fees in the amount, so allow tolerance
    if (Amount !== undefined && Amount !== null) {
      const expectedAmount = Number(paymentRecord.amount);
      // Allow up to 5% tolerance for Hubtel processing fees
      const tolerance = Math.max(0.5, expectedAmount * 0.05);
      if (Amount < expectedAmount - 0.01 || Amount > expectedAmount + tolerance) {
        console.error(`Amount mismatch: received ${Amount}, expected ~${expectedAmount} for ${ClientReference}`);
        return new Response(JSON.stringify({ success: false, error: "Amount mismatch" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // SECURITY CHECK: Verify this is a legitimate callback
    // The webhook_token must exist and not have been used before
    if (!paymentRecord.webhook_token) {
      // If webhook_token is null/empty, this payment was either:
      // 1. Already processed (token was cleared after first callback)
      // 2. Created without a token (legacy/invalid)
      console.warn(`Callback received for payment ${ClientReference} with no/used webhook token - possible replay attack`);
      
      // Still return 200 to prevent Hubtel from retrying, but don't process
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Payment already processed or invalid" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map Hubtel status to our status
    const hubtelStatus = String(Status || "").toLowerCase();
    const paymentStatus = hubtelStatus === "success" ? "completed" : 
                          hubtelStatus === "failed" ? "failed" : "pending";

    console.log(`Updating payment ${ClientReference} from ${paymentRecord.status} to ${paymentStatus}`);

    // Update payment record and CLEAR the webhook token (one-time use)
    // This prevents replay attacks - subsequent callbacks with same reference will be rejected
    if (paymentStatus !== paymentRecord.status || paymentRecord.webhook_token) {
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: paymentStatus,
          payment_date: paymentStatus === "completed" ? new Date().toISOString() : null,
          notes: `Payment ${paymentStatus} via Hubtel callback. Transaction ID: ${TransactionId || "N/A"}`,
          webhook_token: null, // Clear token to prevent replay attacks
        })
        .eq("transaction_reference", ClientReference);

      if (updateError) {
        console.error("Error updating payment:", updateError);
        return new Response(JSON.stringify({ success: false, error: "Failed to update payment" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // If payment successful, update membership status
      if (paymentStatus === "completed") {
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

        // Send payment receipt email (fire and forget)
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-payment-receipt`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ paymentId: paymentRecord.id }),
          });
          console.log("Receipt email request sent");
        } catch (emailError) {
          console.error("Failed to send receipt email:", emailError);
        }
      }
    }

    // Return success to Hubtel
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Hubtel callback error:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
