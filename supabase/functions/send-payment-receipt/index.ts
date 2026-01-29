import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders, type RateLimitConfig } from "../_shared/rate-limit.ts";

// Rate limit: 10 receipt requests per minute per user
const RECEIPT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
};

// Input validation
function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface PaymentReceiptRequest {
  paymentId: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user with anon key first
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Apply rate limiting per user
    const rateLimitResult = checkRateLimit(`receipt:${userId}`, RECEIPT_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse and validate input
    let body: PaymentReceiptRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { paymentId } = body;
    if (!paymentId || typeof paymentId !== "string" || paymentId.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid payment ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to fetch payment and profile
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch payment with user verification
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", userId)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: "Payment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, notify_payment_receipts")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has payment receipts enabled
    if (!profile.notify_payment_receipts) {
      return new Response(
        JSON.stringify({ success: true, message: "Payment receipts disabled by user preference" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const paymentDate = payment.payment_date 
      ? new Date(payment.payment_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

    const safeName = sanitizeHtml(profile.full_name || "Member");
    const safeReference = sanitizeHtml(payment.transaction_reference || payment.id);
    const safePaymentType = sanitizeHtml(payment.payment_type || "Membership Dues");
    const safePaymentMethod = sanitizeHtml(payment.payment_method || "Mobile Money");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1f5c3a 0%, #2d7a4e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Ghana PWDs Entrepreneurs & Business Association</h1>
          <p style="color: #d4af37; margin: 10px 0 0 0; font-size: 16px;">Payment Receipt</p>
        </div>
        
        <div style="background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${safeName}</strong>,</p>
          
          <p>Thank you for your payment. This email confirms that we have received your payment successfully.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1f5c3a; margin: 0 0 15px 0; font-size: 18px;">Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Transaction Reference:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safeReference}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Payment Type:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safePaymentType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Payment Method:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${safePaymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Date:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${paymentDate}</td>
              </tr>
              <tr style="border-top: 2px solid #d4af37;">
                <td style="padding: 15px 0 8px 0; color: #1f5c3a; font-weight: 700; font-size: 18px;">Amount Paid:</td>
                <td style="padding: 15px 0 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: #1f5c3a;">GHS ${Number(payment.amount).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #1f5c3a; margin: 20px 0;">
            <p style="margin: 0; color: #1f5c3a;"><strong>Payment Status:</strong> Completed ✓</p>
          </div>
          
          <p>If you have any questions about this payment, please don't hesitate to contact our support team.</p>
          
          <p style="margin-top: 25px;">Best regards,<br><strong>GPWDEBA Team</strong></p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            This is an automated receipt. Please keep this email for your records.
          </p>
          <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">
            © ${new Date().getFullYear()} Ghana PWDs Entrepreneurs & Business Association
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "GPWDEBA <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Payment Receipt - GHS ${Number(payment.amount).toFixed(2)}`,
      html: emailHtml,
    });

    console.log("Receipt email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: (emailResponse as any).id || "sent" }),
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
    console.error("Error sending receipt:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send receipt" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
