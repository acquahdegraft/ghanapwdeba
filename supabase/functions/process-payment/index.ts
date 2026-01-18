import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  amount: number;
  email: string;
  phone: string;
  provider: "mtn" | "vodafone" | "airteltigo";
  payment_type: string;
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
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

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
    const { amount, email, phone, provider, payment_type }: PaymentRequest = await req.json();

    // Validate input
    if (!amount || !email || !phone || !provider) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, email, phone, provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map provider to Paystack channel
    const providerChannelMap: Record<string, string> = {
      mtn: "mobile_money",
      vodafone: "mobile_money", 
      airteltigo: "mobile_money",
    };

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
          payment_type: payment_type || "membership_dues",
          provider,
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log("Paystack response:", JSON.stringify(paystackData));

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ 
          error: paystackData.message || "Payment initialization failed",
          details: paystackData 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create pending payment record
    const { data: paymentRecord, error: insertError } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        amount,
        payment_type: payment_type || "membership_dues",
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
        JSON.stringify({ error: "Failed to create payment record" }),
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
    const message = error instanceof Error ? error.message : "An error occurred processing payment";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
