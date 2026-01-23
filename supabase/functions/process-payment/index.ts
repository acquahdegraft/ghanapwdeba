import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation helpers
const VALID_PROVIDERS = ["mtn", "vodafone", "airteltigo"] as const;
type Provider = typeof VALID_PROVIDERS[number];

const GHANA_PHONE_REGEX = /^(\+233|0)?[0-9]{9}$/;

function validatePaymentRequest(data: unknown): { 
  valid: true; 
  data: { amount: number; email: string; phone: string; provider: Provider; payment_type: string } 
} | { 
  valid: false; 
  error: string 
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: "Invalid request body" };
  }

  const { amount, email, phone, provider, payment_type } = data as Record<string, unknown>;

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

  return {
    valid: true,
    data: {
      amount: amount as number,
      email: email as string,
      phone: phone as string,
      provider: provider as Provider,
      payment_type: validPaymentType,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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

    const { amount, email, phone, provider, payment_type } = validation.data;

    // Format phone for Ghana (remove leading 0, add country code)
    let formattedPhone = phone.replace(/\s/g, "").replace(/^\+233/, "").replace(/^0/, "");
    formattedPhone = `233${formattedPhone}`;

    console.log(`Processing ${provider} payment for user ${userId}: GHS ${amount}`);

    // Initialize Paystack transaction with Mobile Money
    const paystackResponse = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to pesewas
        currency: "GHS",
        mobile_money: {
          phone: formattedPhone,
          provider: provider === "vodafone" ? "vod" : provider,
        },
        metadata: {
          user_id: userId,
          payment_type,
          provider,
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack response status:", paystackData.status);

    if (!paystackData.status) {
      console.error("Paystack error:", JSON.stringify(paystackData));
      return new Response(
        JSON.stringify({ error: "Unable to process payment. Please try again or contact support." }),
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
        transaction_reference: paystackData.data.reference,
        status: "pending",
        notes: `Mobile Money payment via ${provider.toUpperCase()}`,
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
        reference: paystackData.data.reference,
        status: paystackData.data.status,
        display_text: paystackData.data.display_text || "Please authorize the payment on your phone",
        payment_id: paymentRecord.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again or contact support." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
