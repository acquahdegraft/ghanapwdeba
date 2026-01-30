import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders, type RateLimitConfig } from "../_shared/rate-limit.ts";

// Rate limit: 5 payment initiations per hour per user
const PAYMENT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// Hubtel channel mappings for Ghana mobile money
const HUBTEL_CHANNELS: Record<string, string> = {
  mtn: "mtn-gh",
  vodafone: "vodafone-gh",
  airteltigo: "tigo-gh",
};

const VALID_PROVIDERS = ["mtn", "vodafone", "airteltigo"] as const;
type Provider = typeof VALID_PROVIDERS[number];

const GHANA_PHONE_REGEX = /^(\+233|0)?[0-9]{9}$/;

function validatePaymentRequest(data: unknown): { 
  valid: true; 
  data: { amount: number; email: string; phone: string; provider: Provider; payment_type: string; customer_name: string } 
} | { 
  valid: false; 
  error: string 
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const { amount, email, phone, provider, payment_type, customer_name } = data as Record<string, unknown>;

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
    return { valid: false, error: "Amount must be between 1 and 100,000 GHS" };
  }

  // Validate email
  if (typeof email !== 'string' || !email.includes('@') || email.length > 255) {
    return { valid: false, error: "Invalid email address" };
  }

  // Validate phone
  if (typeof phone !== 'string' || !GHANA_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
    return { valid: false, error: "Invalid Ghana phone number format" };
  }

  // Validate provider
  if (!VALID_PROVIDERS.includes(provider as Provider)) {
    return { valid: false, error: "Invalid provider. Must be mtn, vodafone, or airteltigo" };
  }

  // Validate payment_type
  const validPaymentType = typeof payment_type === 'string' && payment_type.length > 0 && payment_type.length <= 100
    ? payment_type
    : "membership_dues";

  // Validate customer_name
  const validCustomerName = typeof customer_name === 'string' && customer_name.length > 0 && customer_name.length <= 100
    ? customer_name
    : "Member";

  return {
    valid: true,
    data: {
      amount: amount as number,
      email: email as string,
      phone: phone as string,
      provider: provider as Provider,
      payment_type: validPaymentType,
      customer_name: validCustomerName,
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

    const { amount, email, phone, provider, payment_type, customer_name } = validation.data;

    // Format phone for Ghana (remove leading 0, add country code)
    let formattedPhone = phone.replace(/\s/g, "").replace(/^\+233/, "").replace(/^0/, "");
    formattedPhone = `233${formattedPhone}`;

    // Generate unique client reference
    const clientReference = generateClientReference();

    console.log(`Processing Hubtel ${provider} payment for user ${userId}: GHS ${amount}`);

    // Build Hubtel Basic Auth header
    const hubtelAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);
    
    // Get callback URL (use the Supabase function URL)
    const callbackUrl = `${supabaseUrl}/functions/v1/hubtel-callback`;

    // Initialize Hubtel receive money request
    const hubtelResponse = await fetch(
      `https://api.hubtel.com/v1/merchantaccount/merchants/${hubtelMerchantAccountNumber}/receive/mobilemoney`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${hubtelAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          CustomerName: customer_name,
          CustomerMsisdn: formattedPhone,
          CustomerEmail: email,
          Channel: HUBTEL_CHANNELS[provider],
          Amount: amount,
          PrimaryCallbackUrl: callbackUrl,
          Description: `Membership dues payment - ${payment_type}`,
          ClientReference: clientReference,
        }),
      }
    );

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
          error: "Payment provider returned an invalid response. Please verify your Hubtel credentials and merchant account.",
          debug: `Status: ${hubtelResponse.status}, Response preview: ${hubtelResponseText.substring(0, 200)}`
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Hubtel parsed response:", JSON.stringify(hubtelData));

    // Check if Hubtel returned success
    // Hubtel uses ResponseCode "0000" for success
    if (hubtelData.ResponseCode !== "0000") {
      console.error("Hubtel error:", JSON.stringify(hubtelData));
      const errorMessage = hubtelData.Data?.Description || hubtelData.Message || "Unable to process payment";
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pending payment record using service role (users can't insert directly)
    const { data: paymentRecord, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        amount,
        payment_type,
        payment_method: `${provider}_mobile_money`,
        transaction_reference: clientReference,
        status: "pending",
        notes: `Hubtel Mobile Money payment via ${provider.toUpperCase()}`,
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
        hubtel_transaction_id: hubtelData.Data?.TransactionId,
        status: "pending",
        display_text: hubtelData.Data?.Description || "Please authorize the payment on your phone",
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
