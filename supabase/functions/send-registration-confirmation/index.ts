import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface RegistrationConfirmationRequest {
  eventId: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight with origin validation
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { eventId, userId }: RegistrationConfirmationRequest = await req.json();

    // Validate input
    if (!eventId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user is registering for themselves
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "Cannot send confirmation for another user" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventDate = new Date(event.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Sanitize user-controlled data to prevent XSS in emails
    const sanitizeHtml = (str: string | null): string => {
      if (!str) return "";
      return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    };

    const sanitizedName = sanitizeHtml(profile.full_name);
    const sanitizedTitle = sanitizeHtml(event.title);
    const sanitizedLocation = sanitizeHtml(event.location);
    const sanitizedVirtualLink = sanitizeHtml(event.virtual_link);
    const sanitizedDescription = sanitizeHtml(event.description);

    const locationInfo = event.location_type === "virtual" 
      ? `<p><strong>Join Link:</strong> <a href="${sanitizedVirtualLink}">${sanitizedVirtualLink}</a></p>`
      : event.location_type === "hybrid"
      ? `<p><strong>Location:</strong> ${sanitizedLocation || "TBA"}</p><p><strong>Virtual Link:</strong> <a href="${sanitizedVirtualLink}">${sanitizedVirtualLink}</a></p>`
      : `<p><strong>Location:</strong> ${sanitizedLocation || "TBA"}</p>`;

    const emailResponse = await resend.emails.send({
      from: "GPWDEBA <noreply@ghanapwdeba.lovable.app>",
      to: [profile.email],
      subject: `Registration Confirmed: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Registration Confirmed!</h1>
              <span class="badge">✓ You're registered</span>
            </div>
            <div class="content">
              <p>Dear ${sanitizedName},</p>
              <p>Great news! Your registration for the following event has been confirmed:</p>
              
              <div class="event-details">
                <h2 style="margin-top: 0; color: #1e40af;">${sanitizedTitle}</h2>
                <p><strong>Date & Time:</strong> ${eventDate}</p>
                <p><strong>Type:</strong> ${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} (${event.location_type})</p>
                ${locationInfo}
                ${sanitizedDescription ? `<p><strong>Description:</strong> ${sanitizedDescription}</p>` : ""}
              </div>
              
              <p>We look forward to seeing you there!</p>
              
              <p style="color: #6b7280; font-size: 14px;">
                If you need to cancel your registration, you can do so from your dashboard.
              </p>
            </div>
            <div class="footer">
              <p>Ghana Persons with Disabilities Entrepreneurs Business Association</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Registration confirmation sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending registration confirmation:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
