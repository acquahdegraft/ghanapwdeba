import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface EventNotificationRequest {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  eventDescription?: string;
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
    const supabaseServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole) {
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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { eventId, eventTitle, eventDate, eventLocation, eventDescription }: EventNotificationRequest =
      await req.json();

    // Input validation
    if (!eventId || !eventTitle || !eventDate) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role to fetch all active members who have announcements enabled
    const serviceClient = createClient(supabaseUrl, supabaseServiceRole);
    const { data: activeMembers, error: membersError } = await serviceClient
      .from("profiles")
      .select("email, full_name, notify_announcements")
      .eq("membership_status", "active")
      .eq("notify_announcements", true);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      throw new Error("Failed to fetch active members");
    }

    if (!activeMembers || activeMembers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active members with announcements enabled to notify", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize inputs for HTML content
    const sanitize = (str: string): string => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeTitle = sanitize(eventTitle.substring(0, 200));
    const safeDate = sanitize(eventDate.substring(0, 100));
    const safeLocation = eventLocation ? sanitize(eventLocation.substring(0, 200)) : null;
    const safeDescription = eventDescription ? sanitize(eventDescription.substring(0, 1000)) : null;

    // Build email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a5f7a;">Ghana PWDs Entrepreneurs and Business Association</h1>
        <h2 style="color: #333;">New Event: ${safeTitle}</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>📅 Date:</strong> ${safeDate}</p>
          ${safeLocation ? `<p><strong>📍 Location:</strong> ${safeLocation}</p>` : ""}
          ${safeDescription ? `<p><strong>📝 Description:</strong> ${safeDescription}</p>` : ""}
        </div>
        <p>Log in to your account to register for this event and see more details.</p>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>Ghana PWDs EBA Team</p>
      </div>
    `;

    // Send emails in batches to avoid rate limits
    const BATCH_SIZE = 50;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < activeMembers.length; i += BATCH_SIZE) {
      const batch = activeMembers.slice(i, i + BATCH_SIZE);
      const emails = batch.map((m) => m.email);

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Ghana PWDs EBA <onboarding@resend.dev>",
            to: emails,
            subject: `New Event: ${safeTitle}`,
            html: htmlContent,
          }),
        });

        if (emailResponse.ok) {
          successCount += batch.length;
        } else {
          const errorData = await emailResponse.json();
          console.error("Resend batch error:", errorData);
          failCount += batch.length;
        }
      } catch (batchError) {
        console.error("Batch send error:", batchError);
        failCount += batch.length;
      }

      // Small delay between batches
      if (i + BATCH_SIZE < activeMembers.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(`Event notification sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Event notification sent",
        successCount,
        failCount,
        totalMembers: activeMembers.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in send-event-notification function:", error);
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
