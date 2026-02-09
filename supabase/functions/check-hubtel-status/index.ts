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
 * Official API Endpoint: https://rmsc.hubtel.com/v1/merchantaccount/merchants/{POS_Sales_ID}/transactions/status
 * 
 * Note: Only requests from whitelisted IPs can reach the Hubtel endpoint.
 * Contact your Retail Systems Engineer to whitelist your server IPs.
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
  responseCode: string;
  message?: string;
  data?: {
    date?: string;
    status: string; // "Paid", "Unpaid", "Refunded"
    transactionId?: string;
    externalTransactionId?: string;
    paymentMethod?: string;
    clientReference?: string;
    currencyCode?: string | null;
    amount?: number;
    charges?: number;
    amountAfterCharges?: number;
    isFulfilled?: boolean | null;
  };
}

interface StatusCheckResult {
  success: boolean;
  clientReference: string;
  status: "pending" | "completed" | "failed" | "unknown";
  hubtelStatus?: string;
  transactionId?: string;
  externalTransactionId?: string;
  amount?: number;
  charges?: number;
  amountAfterCharges?: number;
  paymentMethod?: string;
  currencyCode?: string | null;
  transactionDate?: string;
  isFulfilled?: boolean | null;
  timestamp?: string;
  message?: string;
  databaseUpdated?: boolean; // Indicates if database was synced
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
      .select("id, user_id, status, amount")
      .eq("transaction_reference", clientReference)
      .single();

    if (paymentError || !paymentRecord) {
      console.error("Payment not found:", paymentError?.message);
      return new Response(
        JSON.stringify({ error: "Payment not found", details: "No payment found with this reference" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentId = paymentRecord.id;
    const currentPaymentStatus = paymentRecord.status;

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
    const hubtelPosSalesId = Deno.env.get("HUBTEL_MERCHANT_ACCOUNT_NUMBER")?.trim(); // POS Sales ID

    if (!hubtelClientId || !hubtelClientSecret || !hubtelPosSalesId) {
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
    
    // Call Hubtel's RMSC Transaction Status Check API (no IP whitelisting required)
    // Endpoint: https://rmsc.hubtel.com/v1/merchantaccount/merchants/{POS_Sales_ID}/transactions/status
    const hubtelUrl = `https://rmsc.hubtel.com/v1/merchantaccount/merchants/${hubtelPosSalesId}/transactions/status?clientReference=${encodeURIComponent(clientReference)}`;
    
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
      success: hubtelData.responseCode === "0000",
      clientReference: clientReference,
      status: "unknown",
      message: hubtelData.message,
    };

    if (hubtelData.responseCode === "0000" && hubtelData.data) {
      const data = hubtelData.data;
      
      // Map Hubtel status to our internal status
      // Hubtel returns: "Paid", "Unpaid", "Refunded"
      const hubtelStatus = data.status?.toLowerCase() || "";
      result.hubtelStatus = data.status;
      
      if (hubtelStatus === "paid") {
        result.status = "completed";
      } else if (hubtelStatus === "unpaid") {
        result.status = "pending";
      } else if (hubtelStatus === "refunded") {
        result.status = "failed"; // Treat refunded as failed for our purposes
      } else {
        result.status = "unknown";
      }

      // Add transaction details from official API response
      result.transactionId = data.transactionId;
      result.externalTransactionId = data.externalTransactionId;
      result.amount = data.amount;
      result.charges = data.charges;
      result.amountAfterCharges = data.amountAfterCharges;
      result.paymentMethod = data.paymentMethod;
      result.currencyCode = data.currencyCode;
      result.transactionDate = data.date;
      result.isFulfilled = data.isFulfilled;
      result.timestamp = new Date().toISOString();

      // Sync database if payment is confirmed as Paid and not already completed
      if (result.status === "completed" && currentPaymentStatus !== "completed") {
        console.log(`Syncing payment ${paymentId} to completed status`);
        
        // Use service role client for database update
        const supabaseServiceRole = createClient(
          supabaseUrl,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const updateData: Record<string, unknown> = {
          status: "completed",
          payment_date: data.date || new Date().toISOString(),
          webhook_token: null, // Clear webhook token after successful payment
          updated_at: new Date().toISOString(),
        };

        // Add payment method if available
        if (data.paymentMethod) {
          updateData.payment_method = data.paymentMethod;
        }

        // Add transaction ID to notes if available
        if (data.transactionId || data.externalTransactionId) {
          updateData.notes = `Hubtel TxnID: ${data.transactionId || "N/A"}, External TxnID: ${data.externalTransactionId || "N/A"}`;
        }

        const { error: updateError } = await supabaseServiceRole
          .from("payments")
          .update(updateData)
          .eq("id", paymentId);

        if (updateError) {
          console.error("Failed to update payment record:", updateError);
          result.databaseUpdated = false;
          result.message = "Payment confirmed but database sync failed. Please contact support.";
        } else {
          console.log(`Payment ${paymentId} successfully updated to completed`);
          result.databaseUpdated = true;

          // Also update user profile membership status
          const { error: profileError } = await supabaseServiceRole
            .from("profiles")
            .update({
              membership_status: "active",
              membership_start_date: new Date().toISOString().split("T")[0],
              membership_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", authenticatedUserId);

          if (profileError) {
            console.error("Failed to update profile membership status:", profileError);
          } else {
            console.log(`Profile for user ${authenticatedUserId} updated to active membership`);
          }
        }
      } else if (result.status === "completed" && currentPaymentStatus === "completed") {
        // Already completed, no update needed
        result.databaseUpdated = false;
        result.message = "Payment already marked as completed";
      }
    } else {
      // Hubtel returned an error or no data
      result.status = "pending"; // Default to pending if we can't determine
      result.message = hubtelData.message || "Unable to retrieve transaction status";
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
