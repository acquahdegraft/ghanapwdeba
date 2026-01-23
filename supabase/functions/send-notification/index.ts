import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, createRateLimitResponse, getRateLimitHeaders, type RateLimitConfig } from "../_shared/rate-limit.ts";

// Rate limit: 20 notifications per minute per admin
const NOTIFICATION_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
};

interface NotificationRequest {
  to: string;
  memberName: string;
  notificationType: "membership_status" | "payment_status";
  oldStatus: string;
  newStatus: string;
  additionalInfo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Security: Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT token and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.error("JWT verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Security: Verify the authenticated user has admin privileges
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    
    if (adminError || !isAdmin) {
      console.error("Admin check failed:", adminError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Apply rate limiting per admin user
    const rateLimitResult = checkRateLimit(`notification:${userData.user.id}`, NOTIFICATION_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for admin ${userData.user.id}`);
      return createRateLimitResponse(rateLimitResult, corsHeaders);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, memberName, notificationType, oldStatus, newStatus, additionalInfo }: NotificationRequest = await req.json();

    // Input validation
    if (!to || !memberName || !notificationType || !oldStatus || !newStatus) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate notification type
    if (!["membership_status", "payment_status"].includes(notificationType)) {
      return new Response(
        JSON.stringify({ error: "Invalid notification type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs for HTML content (prevent XSS)
    const sanitize = (str: string): string => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeMemberName = sanitize(memberName.substring(0, 100));
    const safeOldStatus = sanitize(oldStatus.substring(0, 50));
    const safeNewStatus = sanitize(newStatus.substring(0, 50));
    const safeAdditionalInfo = additionalInfo ? sanitize(additionalInfo.substring(0, 500)) : undefined;

    let subject: string;
    let htmlContent: string;

    if (notificationType === "membership_status") {
      subject = `Your Membership Status Has Been Updated - Ghana PWDs EBA`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a5f7a;">Ghana PWDs Entrepreneurs and Business Association</h1>
          <h2 style="color: #333;">Membership Status Update</h2>
          <p>Dear ${safeMemberName},</p>
          <p>Your membership status has been updated by an administrator.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Previous Status:</strong> <span style="color: #888;">${safeOldStatus}</span></p>
            <p><strong>New Status:</strong> <span style="color: #1a5f7a; font-weight: bold;">${safeNewStatus}</span></p>
            ${safeAdditionalInfo ? `<p><strong>Note:</strong> ${safeAdditionalInfo}</p>` : ''}
          </div>
          <p>If you have any questions about this change, please contact us.</p>
          <p>Best regards,<br>Ghana PWDs EBA Team</p>
        </div>
      `;
    } else {
      subject = `Your Payment Status Has Been Updated - Ghana PWDs EBA`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a5f7a;">Ghana PWDs Entrepreneurs and Business Association</h1>
          <h2 style="color: #333;">Payment Status Update</h2>
          <p>Dear ${safeMemberName},</p>
          <p>Your payment status has been updated by an administrator.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Previous Status:</strong> <span style="color: #888;">${safeOldStatus}</span></p>
            <p><strong>New Status:</strong> <span style="color: #1a5f7a; font-weight: bold;">${safeNewStatus}</span></p>
            ${safeAdditionalInfo ? `<p><strong>Details:</strong> ${safeAdditionalInfo}</p>` : ''}
          </div>
          <p>If you have any questions about this update, please contact us.</p>
          <p>Best regards,<br>Ghana PWDs EBA Team</p>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Ghana PWDs EBA <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
