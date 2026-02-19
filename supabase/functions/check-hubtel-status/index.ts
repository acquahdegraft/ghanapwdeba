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
    
    // Service role client for logging
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // Parse response - Hubtel uses PascalCase fields
    let rawHubtelData: Record<string, unknown>;
    try {
      rawHubtelData = JSON.parse(responseText);
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

    console.log("Hubtel status API parsed response:", JSON.stringify(rawHubtelData));

    // Handle PascalCase and camelCase response fields
    const responseCode = (rawHubtelData.ResponseCode || rawHubtelData.responseCode) as string;
    const responseMessage = (rawHubtelData.Message || rawHubtelData.message) as string | undefined;

    // Log the raw status check response
    await supabaseServiceRole.from("payment_logs").insert({
      log_type: "status_check",
      transaction_reference: clientReference,
      payment_id: paymentId,
      raw_payload: rawHubtelData,
      parsed_status: null, // Will be determined below
      hubtel_status: null,
      amount: null,
      source_ip: req.headers.get("x-forwarded-for") || "server",
    }).catch((err: unknown) => {
      console.error("Failed to insert payment log (status_check):", err);
    });
    
    // Build result
    const result: StatusCheckResult = {
      success: responseCode === "0000",
      clientReference: clientReference,
      status: "unknown",
      message: responseMessage,
    };

    // Hubtel RMSC returns Data as an ARRAY of transactions
    const rawData = rawHubtelData.Data || rawHubtelData.data;
    const txnData = Array.isArray(rawData) ? rawData[0] : rawData;

    if (responseCode === "0000" && txnData) {
      const data = txnData as Record<string, unknown>;
      
      // Map Hubtel status to our internal status
      // RMSC returns: "Success"/"Failed"/"Pending" in TransactionStatus or InvoiceStatus
      // Standard API returns: "Paid"/"Unpaid"/"Refunded" in status
      const transactionStatus = ((data.TransactionStatus || data.transactionStatus || data.InvoiceStatus || data.invoiceStatus || data.Status || data.status || "") as string).toLowerCase();
      result.hubtelStatus = (data.TransactionStatus || data.transactionStatus || data.InvoiceStatus || data.invoiceStatus || data.Status || data.status) as string;
      
      if (transactionStatus === "paid" || transactionStatus === "success") {
        result.status = "completed";
      } else if (transactionStatus === "unpaid" || transactionStatus === "pending") {
        result.status = "pending";
      } else if (transactionStatus === "refunded" || transactionStatus === "failed") {
        result.status = "failed";
      } else {
        result.status = "unknown";
      }

      // Add transaction details - handle both PascalCase and camelCase
      result.transactionId = (data.TransactionId || data.transactionId || data.CheckoutId || data.checkoutId) as string | undefined;
      result.externalTransactionId = (data.NetworkTransactionId || data.externalTransactionId) as string | undefined;
      result.amount = (data.TransactionAmount || data.amount) as number | undefined;
      result.charges = (data.Fee || data.charges) as number | undefined;
      result.amountAfterCharges = (data.AmountAfterFees || data.amountAfterCharges) as number | undefined;
      result.paymentMethod = (data.PaymentMethod || data.paymentMethod) as string | undefined;
      result.currencyCode = (data.CurrencyCode || data.currencyCode) as string | null | undefined;
      result.transactionDate = (data.StartDate || data.date) as string | undefined;
      result.isFulfilled = (data.isFulfilled) as boolean | null | undefined;
      result.timestamp = new Date().toISOString();

      // Sync database if payment is confirmed as Paid and not already completed
      if (result.status === "completed" && currentPaymentStatus !== "completed") {
        console.log(`Syncing payment ${paymentId} to completed status`);

        const updateData: Record<string, unknown> = {
          status: "completed",
          payment_date: (data.StartDate || data.date || new Date().toISOString()) as string,
          webhook_token: null,
          updated_at: new Date().toISOString(),
        };

        const paymentMethod = (data.PaymentMethod || data.paymentMethod) as string | undefined;
        if (paymentMethod) {
          updateData.payment_method = paymentMethod;
        }

        const txnId = (data.TransactionId || data.transactionId) as string | undefined;
        const extTxnId = (data.NetworkTransactionId || data.externalTransactionId) as string | undefined;
        if (txnId || extTxnId) {
          updateData.notes = `Hubtel TxnID: ${txnId || "N/A"}, External TxnID: ${extTxnId || "N/A"}`;
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
        result.databaseUpdated = false;
        result.message = "Payment already marked as completed";
      }
    } else {
      // Hubtel returned an error or no data
      result.status = "pending";
      result.message = responseMessage || "Unable to retrieve transaction status";
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
