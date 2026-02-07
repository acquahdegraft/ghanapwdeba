import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders, type RateLimitConfig } from "../_shared/rate-limit.ts";

/**
 * Hubtel Transaction Status Check API
 * 
 * Endpoint: GET /check-hubtel-status?clientReference=<reference>
 * 
 * This function queries Hubtel's transaction status API directly and returns
 * the current status of a payment transaction.
 * 
 * Hubtel API Reference: https://docs.hubtel.com/docs/check-transaction-status
 */

// Rate limit: 20 status checks per minute per user
const STATUS_CHECK_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
};

// Validate reference format (alphanumeric with hyphens/underscores, reasonable length)
function validateReference(reference: unknown): reference is string {
  return (
    typeof reference === "string" &&
    reference.length >= 10 &&
    reference.length <= 100 &&
    /^[a-zA-Z0-9_-]+$/.test(reference)
  );
}

interface HubtelStatusResponse {
  ResponseCode: string;
  Message?: string;
  Data?: {
    Status: string;
    TransactionId?: string;
    Amount?: number;
    Charges?: number;
    AmountAfterCharges?: number;
    Description?: string;
    ClientReference?: string;
    ExternalTransactionId?: string;
    MobileNumber?: string;
    PaymentMethod?: string;
    StartDate?: string;
    EndDate?: string;
  };
}

interface StatusCheckResult {
  success: boolean;
  clientReference: string;
  status: "pending" | "completed" | "failed" | "unknown";
  hubtelStatus?: string;
  transactionId?: string;
  amount?: number;
  charges?: number;
  amountAfterCharges?: number;
  paymentMethod?: string;
  mobileNumber?: string;
  description?: string;
  timestamp?: string;
  message?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  // Only allow GET or POST
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    const authenticatedUserId = userData.user.id;

    // Apply rate limiting per user
    const rateLimitResult = checkRateLimit(`status-check:${authenticatedUserId}`, STATUS_CHECK_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${authenticatedUserId}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Get clientReference from query params (GET) or body (POST)
    let clientReference: string | null = null;
    
    if (req.method === "GET") {
      const url = new URL(req.url);
      clientReference = url.searchParams.get("clientReference");
    } else {
      try {
        const body = await req.json();
        clientReference = body.clientReference || body.reference;
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid request body" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!validateReference(clientReference)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid client reference", 
          details: "Client reference must be 10-100 alphanumeric characters" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify the user owns this payment
    const { data: paymentRecord, error: paymentError } = await supabase
      .from("payments")
      .select("user_id, status, amount")
      .eq("transaction_reference", clientReference)
      .single();

    if (paymentError || !paymentRecord) {
      console.error("Payment not found:", paymentError?.message);
      return new Response(
        JSON.stringify({ error: "Payment not found", details: "No payment found with this reference" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Verify ownership
    if (paymentRecord.user_id !== authenticatedUserId) {
      console.error(`Unauthorized: User ${authenticatedUserId} attempted to check payment owned by ${paymentRecord.user_id}`);
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: "You can only check your own payments" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Hubtel credentials
    const hubtelClientId = Deno.env.get("HUBTEL_CLIENT_ID")?.trim();
    const hubtelClientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET")?.trim();
    const hubtelMerchantAccountNumber = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER")?.trim();

    if (!hubtelClientId || !hubtelClientSecret || !hubtelMerchantAccountNumber) {
      console.error("Hubtel credentials not configured");
      return new Response(
        JSON.stringify({ 
          error: "Payment service not configured",
          details: "Hubtel credentials are missing. Please contact support."
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Hubtel Basic Auth header
    const hubtelAuth = btoa(`${hubtelClientId}:${hubtelClientSecret}`);
    
    // Call Hubtel's transaction status API
    const hubtelUrl = `https://api.hubtel.com/v1/merchantaccount/merchants/${hubtelMerchantAccountNumber}/transactions/status?clientReference=${encodeURIComponent(clientReference)}`;
    
    console.log(`Checking Hubtel status for reference: ${clientReference}`);
    
    const hubtelResponse = await fetch(hubtelUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${hubtelAuth}`,
        "Accept": "application/json",
      },
    });

    const responseText = await hubtelResponse.text();
    
    console.log("Hubtel status API raw response:", {
      status: hubtelResponse.status,
      statusText: hubtelResponse.statusText,
      bodyLength: responseText.length,
      bodyPreview: responseText.substring(0, 500)
    });

    // Parse response
    let hubtelData: HubtelStatusResponse;
    try {
      hubtelData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Hubtel response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid response from payment service",
          details: "Could not parse status response",
          rawResponse: responseText.substring(0, 200)
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Hubtel status API parsed response:", JSON.stringify(hubtelData));

    // Build result
    const result: StatusCheckResult = {
      success: hubtelData.ResponseCode === "0000",
      clientReference: clientReference,
      status: "unknown",
      message: hubtelData.Message,
    };

    if (hubtelData.ResponseCode === "0000" && hubtelData.Data) {
      const data = hubtelData.Data;
      
      // Map Hubtel status to our status
      const hubtelStatus = data.Status?.toLowerCase() || "";
      result.hubtelStatus = data.Status;
      
      if (hubtelStatus === "success" || hubtelStatus === "successful") {
        result.status = "completed";
      } else if (hubtelStatus === "failed" || hubtelStatus === "failure") {
        result.status = "failed";
      } else if (hubtelStatus === "pending") {
        result.status = "pending";
      } else {
        result.status = "unknown";
      }

      // Add transaction details
      result.transactionId = data.TransactionId;
      result.amount = data.Amount;
      result.charges = data.Charges;
      result.amountAfterCharges = data.AmountAfterCharges;
      result.paymentMethod = data.PaymentMethod;
      result.mobileNumber = data.MobileNumber;
      result.description = data.Description;
      result.timestamp = new Date().toISOString();
    } else {
      // Hubtel returned an error or no data
      result.status = "pending"; // Default to pending if we can't determine
      result.message = hubtelData.Message || "Unable to retrieve transaction status";
    }

    return new Response(
      JSON.stringify(result),
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
    console.error("Error checking Hubtel status:", error);
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
