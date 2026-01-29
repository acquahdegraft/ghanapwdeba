import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegistrationConfirmationRequest {
  eventId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
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
      throw new Error("Unauthorized");
    }

    const { eventId, userId }: RegistrationConfirmationRequest = await req.json();

    // Verify the user is registering for themselves
    if (user.id !== userId) {
      throw new Error("Cannot send confirmation for another user");
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    const eventDate = new Date(event.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const locationInfo = event.location_type === "virtual" 
      ? `<p><strong>Join Link:</strong> <a href="${event.virtual_link}">${event.virtual_link}</a></p>`
      : event.location_type === "hybrid"
      ? `<p><strong>Location:</strong> ${event.location || "TBA"}</p><p><strong>Virtual Link:</strong> <a href="${event.virtual_link}">${event.virtual_link}</a></p>`
      : `<p><strong>Location:</strong> ${event.location || "TBA"}</p>`;

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
              <p>Dear ${profile.full_name},</p>
              <p>Great news! Your registration for the following event has been confirmed:</p>
              
              <div class="event-details">
                <h2 style="margin-top: 0; color: #1e40af;">${event.title}</h2>
                <p><strong>Date & Time:</strong> ${eventDate}</p>
                <p><strong>Type:</strong> ${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} (${event.location_type})</p>
                ${locationInfo}
                ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ""}
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
  } catch (error: any) {
    console.error("Error sending registration confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
