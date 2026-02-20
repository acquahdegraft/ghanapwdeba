import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const sanitize = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const priorityLabel: Record<string, string> = {
  low: "ℹ️ Information",
  normal: "📢 Announcement",
  high: "⚠️ Important",
  urgent: "🚨 Urgent",
};

const priorityColor: Record<string, string> = {
  low: "#6b7280",
  normal: "#1a5f7a",
  high: "#d97706",
  urgent: "#dc2626",
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // Verify the calling user is an admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin");
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { announcementId } = await req.json();
    if (!announcementId) {
      return new Response(JSON.stringify({ error: "announcementId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Use service role to fetch announcement + all opted-in members
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: announcement, error: annError } = await adminClient
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (annError || !announcement) {
      return new Response(JSON.stringify({ error: "Announcement not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!announcement.is_published) {
      return new Response(JSON.stringify({ error: "Announcement is not published" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch all active members who have opted in to announcement notifications
    const { data: members, error: membersError } = await adminClient
      .from("profiles")
      .select("full_name, email")
      .eq("notify_announcements", true)
      .eq("membership_status", "active");

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No opted-in active members found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const safeTitle = sanitize(announcement.title.substring(0, 200));
    const safeContent = sanitize(announcement.content.substring(0, 5000));
    const priority = announcement.priority as string;
    const badge = priorityLabel[priority] ?? "📢 Announcement";
    const color = priorityColor[priority] ?? "#1a5f7a";

    let sent = 0;
    let failed = 0;

    // Send in batches of 10 to avoid overwhelming Resend
    const batchSize = 10;
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (member) => {
          const safeName = sanitize((member.full_name ?? "Member").substring(0, 100));
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
              <div style="background-color: ${color}; padding: 24px 32px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Ghana PWDs Entrepreneurs & Business Association</h1>
              </div>
              <div style="padding: 32px;">
                <div style="display: inline-block; background-color: ${color}20; color: ${color}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">
                  ${badge}
                </div>
                <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px;">${safeTitle}</h2>
                <p style="color: #374151; margin: 0 0 8px;">Dear ${safeName},</p>
                <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 16px 20px; border-radius: 4px; margin: 20px 0; color: #374151; line-height: 1.6;">
                  ${safeContent}
                </div>
                <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
                  You are receiving this because you are a member of Ghana PWDs EBA and have announcement notifications enabled.
                  You can update your notification preferences from your member dashboard.
                </p>
                <p style="color: #374151; margin-top: 24px;">Best regards,<br><strong>Ghana PWDs EBA Team</strong></p>
              </div>
              <div style="background-color: #f3f4f6; padding: 16px 32px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Ghana PWDs Entrepreneurs & Business Association</p>
              </div>
            </div>
          `;

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Ghana PWDs EBA <info@mail.gpwdeba.org>",
              to: [member.email],
              subject: `${badge}: ${announcement.title}`,
              html: htmlContent,
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            const errBody = await res.text();
            console.error(`Failed to send to ${member.email}:`, errBody);
            failed++;
          }
        })
      );
    }

    console.log(`Announcement notification sent: ${sent} success, ${failed} failed`);

    return new Response(
      JSON.stringify({ sent, failed, total: members.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-announcement-notification:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(req) } }
    );
  }
};

serve(handler);
