import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Generate a cryptographically secure webhook verification token
function generateWebhookToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// This edge function handles post-registration payment initiation.
// It does NOT require auth since the user hasn't verified email yet.
// Security: validates that email matches a recently-created profile (within 10 min).

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { email, fullName, phone } = await req.json();

    if (!email || !fullName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Verify this email belongs to a profile created within the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id, email, membership_type_id")
      .eq("email", email)
      .gte("created_at", tenMinutesAgo)
      .single();

    if (profileError || !profile) {
      console.error("Profile lookup failed:", profileError);
      return new Response(
        JSON.stringify({ error: "Registration not found or expired. Please try again." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flat registration fee of GH₵5 for all membership types
    const REGISTRATION_FEE = 5;
    const amount = REGISTRATION_FEE;
    const clientReference = `REG-${profile.user_id.substring(0, 8)}-${Date.now()}`;
    const webhookToken = generateWebhookToken();

    // Create pending payment record
    const { error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: profile.user_id,
        amount,
        payment_type: "registration_fee",
        payment_method: "hubtel_checkout",
        transaction_reference: clientReference,
        status: "pending",
        notes: "Registration fee (flat rate)",
        webhook_token: webhookToken,
      });

    if (paymentError) {
      console.error("Payment record creation failed:", paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Hubtel credentials
    const merchantAccountNumber = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER")?.trim();
    const clientId = Deno.env.get("HUBTEL_CLIENT_ID")?.trim();
    const clientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET")?.trim();

    if (!merchantAccountNumber || !clientId || !clientSecret) {
      console.error("Hubtel credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const basicAuth = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
    const frontendUrl = req.headers.get("origin") || "https://ghanapwdeba.lovable.app";
    const returnUrl = `${frontendUrl}/payment-callback?reference=${clientReference}&payment=success&type=registration`;
    const cancellationUrl = `${frontendUrl}/payment-callback?reference=${clientReference}&payment=cancelled&type=registration`;
    const callbackUrl = `${supabaseUrl}/functions/v1/hubtel-callback`;

    // Format phone
    let formattedPhone = "";
    if (phone) {
      formattedPhone = phone.replace(/\s+/g, "").replace(/^\+/, "").replace(/^0/, "233");
      if (!formattedPhone.startsWith("233")) {
        formattedPhone = "233" + formattedPhone;
      }
    }

    const hubtelPayload: Record<string, unknown> = {
      totalAmount: amount,
      description: `GPWDEBA Registration Fee (GHS ${amount})`,
      callbackUrl,
      returnUrl,
      cancellationUrl,
      merchantAccountNumber,
      clientReference,
      payeeName: fullName,
      payeeEmail: email,
    };

    if (formattedPhone) {
      hubtelPayload.payeeMobileNumber = formattedPhone;
    }

    console.log("Initiating registration payment:", {
      email,
      amount,
      clientReference,
    });

    const hubtelResponse = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: basicAuth,
      },
      body: JSON.stringify(hubtelPayload),
    });

    const responseText = await hubtelResponse.text();

    if (!responseText || responseText.trim() === "") {
      console.error("Hubtel returned empty response");
      return new Response(
        JSON.stringify({ error: "Payment service returned empty response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let hubtelData;
    try {
      hubtelData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Hubtel response:", responseText);
      return new Response(
        JSON.stringify({ error: "Invalid response from payment service" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hubtelResponse.ok) {
      console.error("Hubtel API error:", hubtelData);
      return new Response(
        JSON.stringify({
          error: "Payment initiation failed",
          details: hubtelData.message || hubtelData.error || hubtelData.Message,
        }),
        { status: hubtelResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const checkoutUrl = hubtelData?.data?.checkoutUrl || hubtelData?.checkoutUrl;

    if (!checkoutUrl) {
      console.error("No checkout URL in response:", hubtelData);
      return new Response(
        JSON.stringify({ error: "No checkout URL returned from payment service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl,
        clientReference,
        amount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in registration payment:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
