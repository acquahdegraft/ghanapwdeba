import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders, type RateLimitConfig } from "../_shared/rate-limit.ts";

// Rate limit: 5 payment initiations per hour per user
const PAYMENT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// Hubtel Online Checkout URL
const HUBTEL_CHECKOUT_URL = "https://payproxyapi.hubtel.com/items/initiate";

function validatePaymentRequest(data: unknown): { 
  valid: true; 
  data: { amount: number; email: string; phone: string; payment_type: string; customer_name: string; return_url: string } 
} | { 
  valid: false; 
  error: string 
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const { amount, email, phone, payment_type, customer_name, return_url } = data as Record<string, unknown>;

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
    return { valid: false, error: "Amount must be between 1 and 100,000 GHS" };
  }

  // Validate email
  if (typeof email !== 'string' || !email.includes('@') || email.length > 255) {
    return { valid: false, error: "Invalid email address" };
  }

  // Validate phone (optional for online checkout)
  const validPhone = typeof phone === 'string' && phone.length >= 9 ? phone : "";

  // Validate payment_type
  const validPaymentType = typeof payment_type === 'string' && payment_type.length > 0 && payment_type.length <= 100
    ? payment_type
    : "membership_dues";

  // Validate customer_name
  const validCustomerName = typeof customer_name === 'string' && customer_name.length > 0 && customer_name.length <= 100
    ? customer_name
    : "Member";

  // Validate return_url
  if (typeof return_url !== 'string' || !return_url.startsWith('http')) {
    return { valid: false, error: "Invalid return URL" };
  }

  return {
    valid: true,
    data: {
      amount: amount as number,
      email: email as string,
      phone: validPhone,
      payment_type: validPaymentType,
      customer_name: validCustomerName,
      return_url: return_url as string,
    },
  };
}

// Generate a unique client reference
function generateClientReference(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `GPAD-${timestamp}-${randomPart}`.toUpperCase();
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
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Hubtel credentials
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

    // Service role client for inserting payments (users can't insert directly)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    
    // Apply rate limiting per user
    const rateLimitResult = checkRateLimit(`payment:${userId}`, PAYMENT_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }
    
    // Parse and validate input
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validation = validatePaymentRequest(requestBody);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, email, phone, payment_type, customer_name, return_url } = validation.data;

    // Generate unique client reference
    const clientReference = generateClientReference();

    // Get callback URL (use the Supabase function URL)
    const callbackUrl = `${supabaseUrl}/functions/v1/hubtel-callback`;

    console.log(`Creating Hubtel Online Checkout for user ${userId}: GHS ${amount}`);

    // Build Hubtel Basic Auth header
    const hubtelAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);

    // Create Hubtel Online Checkout request
    const hubtelPayload = {
      merchantAccountNumber: hubtelMerchantAccountNumber,
      totalAmount: amount,
      title: "GPWDEBA Membership Dues",
      description: `Membership dues payment - ${payment_type}`,
      callbackUrl: callbackUrl,
      returnUrl: return_url,
      cancellationUrl: return_url.replace("success", "cancelled"),
      payeeName: customer_name,
      payeeEmail: email,
      payeeMobileNumber: phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0"),
      clientReference: clientReference,
    };

    console.log("Hubtel payload:", JSON.stringify(hubtelPayload));

    const hubtelResponse = await fetch(HUBTEL_CHECKOUT_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${hubtelAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hubtelPayload),
    });

    // Get raw response text first to debug HTML errors
    const hubtelResponseText = await hubtelResponse.text();
    console.log("Hubtel raw response status:", hubtelResponse.status);
    console.log("Hubtel raw response:", hubtelResponseText.substring(0, 500));

    // Try to parse as JSON
    let hubtelData;
    try {
      hubtelData = JSON.parse(hubtelResponseText);
    } catch (parseError) {
      console.error("Hubtel returned non-JSON response:", hubtelResponseText.substring(0, 1000));
      return new Response(
        JSON.stringify({ 
          error: "Payment provider returned an invalid response. Please try again later.",
          debug: `Status: ${hubtelResponse.status}`
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Hubtel parsed response:", JSON.stringify(hubtelData));

    // Check if Hubtel returned success
    // Hubtel uses responseCode "0000" for success
    if (hubtelData.responseCode !== "0000") {
      console.error("Hubtel error:", JSON.stringify(hubtelData));
      const errorMessage = hubtelData.message || hubtelData.data?.description || "Unable to create checkout";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get checkout URL from response
    const checkoutUrl = hubtelData.data?.checkoutUrl;
    if (!checkoutUrl) {
      console.error("No checkout URL in response:", JSON.stringify(hubtelData));
      return new Response(
        JSON.stringify({ error: "Failed to get checkout URL from payment provider" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pending payment record using service role (users can't insert directly)
    const { data: paymentRecord, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        amount,
        payment_type,
        payment_method: "hubtel_checkout",
        transaction_reference: clientReference,
        status: "pending",
        notes: "Hubtel Online Checkout payment",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating payment record:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to process payment. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reference: clientReference,
        checkout_url: checkoutUrl,
        payment_id: paymentRecord.id,
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
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again or contact support." }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
