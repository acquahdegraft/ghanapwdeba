import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROFILE_FIELDS = [
  "full_name", "email", "phone", "gender", "disability_type",
  "business_name", "business_type", "business_address", "mailing_address",
  "region", "city", "education_level", "special_skills",
  "bir_registration_number", "nis_registration_number", "vat_registration_number",
  "num_permanent_staff", "num_temporary_staff", "bank_name", "bank_branch",
];

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name", email: "Email", phone: "Phone",
  gender: "Gender", disability_type: "Disability Type",
  business_name: "Business Name", business_type: "Business Type",
  business_address: "Business Address", mailing_address: "Mailing Address",
  region: "Region", city: "District",
  education_level: "Education Level", special_skills: "Special Skills",
  bir_registration_number: "BIR Registration", nis_registration_number: "NIS Registration",
  vat_registration_number: "VAT Registration",
  num_permanent_staff: "Permanent Staff", num_temporary_staff: "Temporary Staff",
  bank_name: "Bank Name", bank_branch: "Bank Branch",
};

function getCompletionInfo(profile: Record<string, unknown>) {
  const filled = PROFILE_FIELDS.filter((k) => {
    const v = profile[k];
    return v !== null && v !== undefined && v !== "";
  });
  const missing = PROFILE_FIELDS.filter((k) => {
    const v = profile[k];
    return v === null || v === undefined || v === "";
  });
  return {
    percentage: Math.round((filled.length / PROFILE_FIELDS.length) * 100),
    missingLabels: missing.map((k) => FIELD_LABELS[k] || k),
  };
}

const handler = async (req: Request): Promise<Response> => {
  // This function is triggered by pg_cron or manually by admin
  // Verify via Bearer token (service role or admin JWT)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500 });
  }

  // Use service role to read all profiles
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Verify the caller is admin or the service role itself
  const token = authHeader.replace("Bearer ", "");
  if (token !== serviceRoleKey) {
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
  }

  // Get threshold from body (default: send to anyone below 80%)
  let threshold = 80;
  try {
    const body = await req.json();
    if (body.threshold) threshold = Number(body.threshold);
  } catch {
    // no body is fine
  }

  // Fetch all active/pending members
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .in("membership_status", ["active", "pending"]);

  if (error) {
    console.error("Error fetching profiles:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const incomplete = (profiles || [])
    .map((p: Record<string, unknown>) => ({
      profile: p,
      ...getCompletionInfo(p),
    }))
    .filter((p) => p.percentage < threshold);

  console.log(`Found ${incomplete.length} members with <${threshold}% profile completion`);

  let sent = 0;
  let failed = 0;

  // Send in batches of 10
  for (let i = 0; i < incomplete.length; i += 10) {
    const batch = incomplete.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (member) => {
        const profile = member.profile as Record<string, unknown>;
        const name = String(profile.full_name || "Member");
        const email = String(profile.email || "");
        if (!email) return;

        const missingList = member.missingLabels
          .slice(0, 5)
          .map((l: string) => `<li style="padding: 4px 0;">${l}</li>`)
          .join("");
        const moreCount = member.missingLabels.length > 5 ? member.missingLabels.length - 5 : 0;

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a5f7a;">Ghana PWDs Entrepreneurs and Business Association</h1>
            <h2 style="color: #333;">Complete Your Registration Profile</h2>
            <p>Dear ${name.replace(/[<>]/g, "")},</p>
            <p>Your registration profile is currently <strong>${member.percentage}% complete</strong>. 
            To fully benefit from your membership, please complete the remaining fields.</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-weight: bold; margin-bottom: 10px;">Missing information:</p>
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${missingList}
                ${moreCount > 0 ? `<li style="padding: 4px 0; color: #888;">...and ${moreCount} more</li>` : ""}
              </ul>
            </div>
            <p>
              <a href="https://ghanapwdeba.lovable.app/profile" 
                 style="display: inline-block; background-color: #1a5f7a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Complete Your Profile
              </a>
            </p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              If you've already completed your profile, please disregard this email.
            </p>
            <p>Best regards,<br>Ghana PWDs EBA Team</p>
          </div>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Ghana PWDs EBA <info@mail.gpwdeba.org>",
            to: [email],
            subject: `Your Profile is ${member.percentage}% Complete – Action Needed`,
            html,
          }),
        });

        const resBody = await res.text();
        if (!res.ok) {
          console.error(`Failed to send to ${email}:`, resBody);
          throw new Error(resBody);
        }
      })
    );

    results.forEach((r) => {
      if (r.status === "fulfilled") sent++;
      else failed++;
    });
  }

  console.log(`Profile reminders sent: ${sent}, failed: ${failed}`);

  return new Response(
    JSON.stringify({ sent, failed, totalIncomplete: incomplete.length }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

serve(handler);
