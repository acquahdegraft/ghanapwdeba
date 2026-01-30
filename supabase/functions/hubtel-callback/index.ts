import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Hubtel callback handler for async payment notifications
// This endpoint receives webhooks from Hubtel when payment status changes

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
    // Hubtel sends: Status, ClientReference, Amount, TransactionId, etc.
    const {
      Status,
      ClientReference,
      Amount,
      TransactionId,
    } = callbackData as {
      Status?: string;
      ClientReference?: string;
      Amount?: number;
      TransactionId?: string;
    };

    if (!ClientReference) {
      console.error("Missing ClientReference in callback");
      return new Response(JSON.stringify({ success: false, error: "Missing ClientReference" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Validate ClientReference format
    if (!/^[a-zA-Z0-9_-]+$/.test(ClientReference)) {
      console.error("Invalid ClientReference format");
      return new Response(JSON.stringify({ success: false, error: "Invalid reference format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Find the payment record
    const { data: paymentRecord, error: findError } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, status, amount")
      .eq("transaction_reference", ClientReference)
      .single();

    if (findError || !paymentRecord) {
      console.error("Payment not found for reference:", ClientReference);
      return new Response(JSON.stringify({ success: false, error: "Payment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Map Hubtel status to our status
    const hubtelStatus = String(Status || "").toLowerCase();
    const paymentStatus = hubtelStatus === "success" ? "completed" : 
                          hubtelStatus === "failed" ? "failed" : "pending";

    console.log(`Updating payment ${ClientReference} from ${paymentRecord.status} to ${paymentStatus}`);

    // Update payment record if status changed
    if (paymentStatus !== paymentRecord.status) {
      const { error: updateError } = await supabaseAdmin
        .from("payments")
        .update({
          status: paymentStatus,
          payment_date: paymentStatus === "completed" ? new Date().toISOString() : null,
          notes: `Payment ${paymentStatus} via Hubtel callback. Transaction ID: ${TransactionId || "N/A"}`,
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
