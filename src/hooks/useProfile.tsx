import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  business_type: string | null;
  disability_type: string | null;
  region: string | null;
  city: string | null;
  membership_type_id: string | null;
  membership_status: string;
  membership_start_date: string | null;
  membership_expiry_date: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  // New business registration fields
  business_address: string | null;
  mailing_address: string | null;
  education_level: string | null;
  special_skills: string | null;
  num_permanent_staff: number | null;
  num_temporary_staff: number | null;
  bank_name: string | null;
  bank_branch: string | null;
  bir_registration_number: string | null;
  nis_registration_number: string | null;
  vat_registration_number: string | null;
  has_certificate_of_registration: boolean;
  has_certificate_of_continuance: boolean;
}

// Helper function to get signed URL for avatar
async function getSignedAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  
  // If it's already a full URL (legacy data), return as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    // For legacy URLs that were stored as full public URLs,
    // try to extract the path and get a signed URL
    const pathMatch = avatarPath.match(/\/avatars\/(.+)$/);
    if (pathMatch) {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(pathMatch[1], 60 * 60 * 24); // 24 hours
      
      if (!error && data) {
        return data.signedUrl;
      }
    }
    return avatarPath; // Return original if we can't extract path
  }
  
  // It's a file path, generate signed URL
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 60 * 24); // 24 hours
  
  if (error) {
    console.error("Error generating signed URL for avatar:", error);
    return null;
  }
  
  return data.signedUrl;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Generate signed URL for avatar if it exists
        const signedAvatarUrl = await getSignedAvatarUrl(data.avatar_url);
        return {
          ...data,
          avatar_url: signedAvatarUrl,
        } as Profile;
      }
      
      return data as Profile | null;
    },
    enabled: !!user,
  });
}
