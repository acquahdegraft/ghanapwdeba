import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { to, memberName, notificationType, oldStatus, newStatus, additionalInfo }: NotificationRequest = await req.json();

    let subject: string;
    let htmlContent: string;

    if (notificationType === "membership_status") {
      subject = `Your Membership Status Has Been Updated - Ghana PWDs EBA`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a5f7a;">Ghana PWDs Entrepreneurs and Business Association</h1>
          <h2 style="color: #333;">Membership Status Update</h2>
          <p>Dear ${memberName},</p>
          <p>Your membership status has been updated by an administrator.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Previous Status:</strong> <span style="color: #888;">${oldStatus}</span></p>
            <p><strong>New Status:</strong> <span style="color: #1a5f7a; font-weight: bold;">${newStatus}</span></p>
            ${additionalInfo ? `<p><strong>Note:</strong> ${additionalInfo}</p>` : ''}
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
          <p>Dear ${memberName},</p>
          <p>Your payment status has been updated by an administrator.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Previous Status:</strong> <span style="color: #888;">${oldStatus}</span></p>
            <p><strong>New Status:</strong> <span style="color: #1a5f7a; font-weight: bold;">${newStatus}</span></p>
            ${additionalInfo ? `<p><strong>Details:</strong> ${additionalInfo}</p>` : ''}
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
      },
    });
  } catch (error: unknown) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
