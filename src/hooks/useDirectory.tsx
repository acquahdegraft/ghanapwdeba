import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DirectoryMember {
  id: string;
  full_name: string;
  business_name: string | null;
  business_type: string | null;
  region: string | null;
  city: string | null;
  avatar_url: string | null;
  membership_status: string;
}

async function getSignedAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  
  // Extract just the file path if it's a full URL
  let filePath = avatarPath;
  if (avatarPath.includes('/storage/v1/object/public/avatars/')) {
    filePath = avatarPath.split('/storage/v1/object/public/avatars/')[1];
  }
  
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(filePath, 3600); // 1 hour expiry
  
  if (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
  
  return data.signedUrl;
}

export function useDirectory(searchQuery: string, regionFilter: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["directory", searchQuery, regionFilter],
    queryFn: async () => {
      // Use the secure directory_members view which only exposes safe fields
      // This view excludes sensitive data like email, phone, and disability_type
      let query = supabase
        .from("directory_members")
        .select("id, full_name, business_name, business_type, region, city, avatar_url, membership_status");

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,business_name.ilike.%${searchQuery}%,business_type.ilike.%${searchQuery}%`);
      }

      if (regionFilter && regionFilter !== "all") {
        query = query.eq("region", regionFilter);
      }

      const { data, error } = await query.order("full_name");

      if (error) throw error;

      // Get signed URLs for avatars
      const membersWithSignedUrls = await Promise.all(
        (data || []).map(async (member) => ({
          ...member,
          avatar_url: await getSignedAvatarUrl(member.avatar_url),
        }))
      );

      return membersWithSignedUrls as DirectoryMember[];
    },
    enabled: !!user,
  });
}

export function useUpdateDirectoryVisibility() {
  const { user } = useAuth();

  const updateVisibility = async (isPublic: boolean) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("profiles")
      .update({ is_public_directory: isPublic })
      .eq("user_id", user.id);

    if (error) throw error;
  };

  return { updateVisibility };
}
