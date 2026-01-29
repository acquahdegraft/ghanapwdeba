import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface MemberImportData {
  full_name: string;
  email: string;
  phone?: string;
  region?: string;
  city?: string;
  business_name?: string;
  business_type?: string;
  disability_type?: string;
  membership_status?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { email: string; error: string }[];
  created_users: { email: string; user_id: string }[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify authentication and admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify their identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using RPC
    const { data: isAdmin, error: adminError } = await userClient.rpc("is_admin");
    
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { members } = await req.json() as { members: MemberImportData[] };

    if (!members || !Array.isArray(members) || members.length === 0) {
      return new Response(
        JSON.stringify({ error: "No members provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input size (prevent abuse)
    if (members.length > 500) {
      return new Response(
        JSON.stringify({ error: "Maximum 500 members per import" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for admin operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      created_users: [],
    };

    // Validate email format
    const isValidEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Valid enum values
    const validDisabilityTypes = ["physical", "visual", "hearing", "intellectual", "psychosocial", "multiple", "other"];
    const validStatuses = ["active", "pending", "suspended", "expired"];

    // Get existing emails to prevent duplicates
    const { data: existingProfiles } = await adminClient
      .from("profiles")
      .select("email");
    const existingEmails = new Set((existingProfiles || []).map((p) => p.email.toLowerCase()));

    // Process each member
    for (const member of members) {
      try {
        // Validate required fields
        if (!member.full_name || !member.email) {
          result.failed++;
          result.errors.push({
            email: member.email || "unknown",
            error: "Missing required fields (full_name, email)",
          });
          continue;
        }

        // Validate email format
        if (!isValidEmail(member.email)) {
          result.failed++;
          result.errors.push({
            email: member.email,
            error: "Invalid email format",
          });
          continue;
        }

        // Sanitize and validate inputs
        const sanitizedEmail = member.email.toLowerCase().trim();
        const sanitizedName = member.full_name.trim().substring(0, 100);
        
        // Validate disability_type if provided
        if (member.disability_type && !validDisabilityTypes.includes(member.disability_type.toLowerCase())) {
          result.failed++;
          result.errors.push({
            email: sanitizedEmail,
            error: `Invalid disability_type: ${member.disability_type}`,
          });
          continue;
        }

        // Validate membership_status if provided
        if (member.membership_status && !validStatuses.includes(member.membership_status.toLowerCase())) {
          result.failed++;
          result.errors.push({
            email: sanitizedEmail,
            error: `Invalid membership_status: ${member.membership_status}`,
          });
          continue;
        }

        // Check if email already exists
        if (existingEmails.has(sanitizedEmail)) {
          result.failed++;
          result.errors.push({
            email: sanitizedEmail,
            error: "Email already exists",
          });
          continue;
        }

        // Create auth user with Admin API
        // Generate a random secure password (user will reset via email)
        const tempPassword = crypto.randomUUID() + crypto.randomUUID();
        
        const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
          email: sanitizedEmail,
          password: tempPassword,
          email_confirm: true, // Auto-confirm since admin is creating
          user_metadata: {
            full_name: sanitizedName,
          },
        });

        if (createError || !authUser?.user) {
          result.failed++;
          result.errors.push({
            email: sanitizedEmail,
            error: createError?.message || "Failed to create auth user",
          });
          continue;
        }

        // Update the profile with additional info
        // (Profile is auto-created by handle_new_user trigger)
        const { error: profileError } = await adminClient
          .from("profiles")
          .update({
            phone: member.phone?.substring(0, 20) || null,
            region: member.region?.substring(0, 100) || null,
            city: member.city?.substring(0, 100) || null,
            business_name: member.business_name?.substring(0, 200) || null,
            business_type: member.business_type?.substring(0, 100) || null,
            disability_type: member.disability_type?.toLowerCase() || null,
            membership_status: (member.membership_status?.toLowerCase() || "pending"),
          })
          .eq("user_id", authUser.user.id);

        if (profileError) {
          // Log but don't fail - user was created successfully
          console.error(`Profile update error for ${sanitizedEmail}:`, profileError.message);
        }

        // Send password reset email so user can set their own password
        const { error: resetError } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: sanitizedEmail,
        });

        if (resetError) {
          console.error(`Password reset email error for ${sanitizedEmail}:`, resetError.message);
        }

        result.success++;
        result.created_users.push({
          email: sanitizedEmail,
          user_id: authUser.user.id,
        });
        existingEmails.add(sanitizedEmail);

      } catch (memberError) {
        result.failed++;
        result.errors.push({
          email: member.email || "unknown",
          error: memberError instanceof Error ? memberError.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Import members error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred during import" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
