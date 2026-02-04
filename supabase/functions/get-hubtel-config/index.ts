import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Returns Hubtel checkout configuration for authenticated users
// This keeps credentials secure on the server while allowing frontend SDK usage

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

    // Get Hubtel credentials from environment
    const merchantAccount = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER");
    const clientId = Deno.env.get("HUBTEL_CLIENT_ID");
    const clientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET");

    if (!merchantAccount || !clientId || !clientSecret) {
      console.error("Hubtel credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Base64 encoded basic auth string with "Basic " prefix
    const basicAuth = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

    // Return the config needed for Hubtel Checkout SDK
    return new Response(
      JSON.stringify({
        merchantAccount: parseInt(merchantAccount),
        basicAuth: basicAuth,
        callbackUrl: `${supabaseUrl}/functions/v1/hubtel-callback`,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: unknown) {
    console.error("Error getting Hubtel config:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
