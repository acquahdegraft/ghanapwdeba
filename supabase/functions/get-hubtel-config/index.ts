import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Returns Hubtel checkout configuration for authenticated users
// The frontend uses these values to construct a direct redirect to unified-pay.hubtel.com
// This approach bypasses the payproxyapi server-to-server call entirely

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
    const merchantAccount = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER")?.trim();
    const clientId = Deno.env.get("HUBTEL_CLIENT_ID")?.trim();
    const clientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET")?.trim();

    if (!merchantAccount || !clientId || !clientSecret) {
      console.error("Hubtel credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Base64 encoded basic auth string (without "Basic " prefix - SDK adds it)
    const basicAuth = btoa(`${clientId}:${clientSecret}`);

    const merchantAccountInt = parseInt(merchantAccount, 10);
    if (isNaN(merchantAccountInt)) {
      console.error("Invalid HUBTEL_MERCHANT_ACCOUNT_NUMBER");
      return new Response(
        JSON.stringify({ error: "Payment service misconfigured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the config needed for Unified Pay redirect
    return new Response(
      JSON.stringify({
        merchantAccount: merchantAccountInt,
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
