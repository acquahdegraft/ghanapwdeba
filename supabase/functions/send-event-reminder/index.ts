import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get events happening in the next 24 hours that haven't had reminders sent
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: upcomingEvents, error: eventsError } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("is_published", true)
      .gte("event_date", now.toISOString())
      .lte("event_date", tomorrow.toISOString());

    if (eventsError) {
      console.error("Error fetching events:", eventsError);
      throw eventsError;
    }

    console.log(`Found ${upcomingEvents?.length || 0} events in the next 24 hours`);

    if (!upcomingEvents || upcomingEvents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming events to send reminders for" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let totalEmailsSent = 0;
    const results: { eventId: string; emailsSent: number; errors: string[] }[] = [];

    for (const event of upcomingEvents) {
      const eventErrors: string[] = [];
      let eventEmailsSent = 0;

      // Get all registered attendees for this event
      const { data: registrations, error: regError } = await supabaseAdmin
        .from("event_registrations")
        .select("user_id")
        .eq("event_id", event.id)
        .eq("status", "registered");

      if (regError) {
        console.error(`Error fetching registrations for event ${event.id}:`, regError);
        eventErrors.push(`Failed to fetch registrations: ${regError.message}`);
        results.push({ eventId: event.id, emailsSent: 0, errors: eventErrors });
        continue;
      }

      if (!registrations || registrations.length === 0) {
        console.log(`No registrations for event ${event.id}`);
        results.push({ eventId: event.id, emailsSent: 0, errors: [] });
        continue;
      }

      // Get profile info for all registered users who have event reminders enabled
      const userIds = registrations.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, email, notify_event_reminders")
        .in("user_id", userIds)
        .eq("notify_event_reminders", true);

      if (profilesError) {
        console.error(`Error fetching profiles for event ${event.id}:`, profilesError);
        eventErrors.push(`Failed to fetch profiles: ${profilesError.message}`);
        results.push({ eventId: event.id, emailsSent: 0, errors: eventErrors });
        continue;
      }

      if (!profiles || profiles.length === 0) {
        console.log(`No profiles with reminders enabled for event ${event.id}`);
        results.push({ eventId: event.id, emailsSent: 0, errors: [] });
        continue;
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

      // Send reminder to each registered member
      for (const profile of profiles || []) {
        try {
          await resend.emails.send({
            from: "GPWDEBA <noreply@ghanapwdeba.lovable.app>",
            to: [profile.email],
            subject: `Reminder: ${event.title} is happening soon!`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                  .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
                  .badge { display: inline-block; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">Event Reminder</h1>
                    <span class="badge">⏰ Happening Soon!</span>
                  </div>
                  <div class="content">
                    <p>Dear ${profile.full_name},</p>
                    <p>This is a friendly reminder that you are registered for an upcoming event:</p>
                    
                    <div class="event-details">
                      <h2 style="margin-top: 0; color: #b45309;">${event.title}</h2>
                      <p><strong>Date & Time:</strong> ${eventDate}</p>
                      <p><strong>Type:</strong> ${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} (${event.location_type})</p>
                      ${locationInfo}
                      ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ""}
                    </div>
                    
                    <p>We look forward to seeing you there!</p>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                      If you can no longer attend, please update your registration in your dashboard.
                    </p>
                  </div>
                  <div class="footer">
                    <p>Ghana Persons with Disabilities Entrepreneurs Business Association</p>
                    <p>This is an automated reminder. Please do not reply to this email.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });

          eventEmailsSent++;
          totalEmailsSent++;
          console.log(`Reminder sent to ${profile.email} for event ${event.title}`);
        } catch (emailError: any) {
          console.error(`Failed to send reminder to ${profile.email}:`, emailError);
          eventErrors.push(`Failed to send to ${profile.email}: ${emailError.message}`);
        }
      }

      results.push({ eventId: event.id, emailsSent: eventEmailsSent, errors: eventErrors });
    }

    console.log(`Total reminders sent: ${totalEmailsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        totalEmailsSent,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminder function:", error);
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
