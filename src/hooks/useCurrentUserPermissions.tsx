import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CurrentUserPermissions {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

export function useCurrentUserPermissions() {
  const { user } = useAuth();

  return useQuery<CurrentUserPermissions>({
    queryKey: ["currentUserPermissions", user?.id],
    queryFn: async () => {
      if (!user) {
        return { isSuperAdmin: false, isAdmin: false, permissions: [], hasPermission: () => false };
      }

      // Check roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isSuperAdmin = roles?.some((r) => r.role === "super_admin") ?? false;
      const isAdmin = roles?.some((r) => r.role === "admin" || r.role === "super_admin") ?? false;

      // Get explicit permissions
      const { data: perms } = await supabase
        .from("admin_permissions")
        .select("permission")
        .eq("user_id", user.id);

      const permissionKeys = perms?.map((p) => p.permission) ?? [];

      return {
        isSuperAdmin,
        isAdmin,
        permissions: permissionKeys,
        hasPermission: (permission: string) => {
          if (isSuperAdmin) return true;
          return permissionKeys.includes(permission);
        },
      };
    },
    enabled: !!user,
  });
}
