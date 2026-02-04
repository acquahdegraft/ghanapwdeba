import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Initiates Hubtel Redirect Checkout and returns the checkout URL
// This is the web-appropriate flow (not the Android SDK)

interface CheckoutRequest {
  amount: number;
  paymentType: string;
  clientReference: string;
  description?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("Auth verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { amount, paymentType, clientReference, description } = body;

    if (!amount || !clientReference) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", details: "amount and clientReference are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Hubtel credentials from environment
    const merchantAccountNumber = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER");
    const clientId = Deno.env.get("HUBTEL_CLIENT_ID");
    const clientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET");

    if (!merchantAccountNumber || !clientId || !clientSecret) {
      console.error("Hubtel credentials not configured:", {
        hasMerchant: !!merchantAccountNumber,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      return new Response(
        JSON.stringify({ 
          error: "Payment service not configured",
          details: "Hubtel credentials are missing. Please contact support."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Basic auth header
    const basicAuth = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    // Construct return and cancellation URLs
    // These should point to the frontend callback page
    const frontendUrl = req.headers.get("origin") || "https://ghanapwdeba.lovable.app";
    const returnUrl = `${frontendUrl}/dashboard/payment-callback?reference=${clientReference}&status=success`;
    const cancellationUrl = `${frontendUrl}/dashboard/payment-callback?reference=${clientReference}&status=cancelled`;

    // Hubtel callback URL for server-to-server notifications
    const callbackUrl = `${supabaseUrl}/functions/v1/hubtel-callback`;

    // Prepare the Hubtel API request
    const hubtelPayload = {
      totalAmount: amount,
      description: description || `GPWDEBA Membership Dues - ${paymentType}`,
      callbackUrl: callbackUrl,
      returnUrl: returnUrl,
      cancellationUrl: cancellationUrl,
      merchantAccountNumber: merchantAccountNumber,
      clientReference: clientReference,
    };

    console.log("Initiating Hubtel checkout:", {
      amount,
      clientReference,
      merchantAccountNumber,
      callbackUrl,
      returnUrl
    });

    // Call Hubtel's initiate API
    const hubtelResponse = await fetch("https://payproxyapi.hubtel.com/items/initiate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": basicAuth,
      },
      body: JSON.stringify(hubtelPayload),
    });

    const hubtelData = await hubtelResponse.json();

    console.log("Hubtel API response:", {
      status: hubtelResponse.status,
      ok: hubtelResponse.ok,
      data: hubtelData
    });

    if (!hubtelResponse.ok) {
      console.error("Hubtel API error:", hubtelData);
      return new Response(
        JSON.stringify({ 
          error: "Payment initiation failed",
          details: hubtelData.message || hubtelData.error || `Hubtel returned status ${hubtelResponse.status}`,
          hubtelResponse: hubtelData
        }),
        { status: hubtelResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Hubtel returns the checkout URL in the response
    // The response structure is: { status: "Success", data: { checkoutUrl: "..." } }
    const checkoutUrl = hubtelData?.data?.checkoutUrl || hubtelData?.checkoutUrl;

    if (!checkoutUrl) {
      console.error("No checkout URL in Hubtel response:", hubtelData);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from payment service",
          details: "No checkout URL returned",
          hubtelResponse: hubtelData
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the checkout URL for the frontend to redirect to
    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: checkoutUrl,
        clientReference: clientReference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error initiating Hubtel checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred",
        details: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
