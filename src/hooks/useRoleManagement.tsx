import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  region: string | null;
  district: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  created_at: string;
}

export interface UserWithRoles {
  user_id: string;
  full_name: string;
  email: string;
  roles: UserRole[];
  permissions: UserPermission[];
}

export const AVAILABLE_PERMISSIONS = [
  { key: "manage_members", label: "Member Management", description: "View, edit, activate, and suspend member profiles" },
  { key: "manage_payments", label: "Payment Management", description: "View and update payment statuses" },
  { key: "manage_content", label: "Content Management", description: "Manage announcements, events, and resources" },
  { key: "manage_roles", label: "Role Management", description: "Assign and revoke roles and permissions" },
  { key: "manage_dues", label: "Dues Management", description: "Create and update membership fee structures" },
  { key: "view_analytics", label: "View Analytics", description: "Access dashboard analytics and reports" },
  { key: "export_data", label: "Export Data", description: "Export member and payment data as CSV" },
] as const;

export const ROLE_LABELS: Record<AppRole, string> = {
  member: "Member",
  admin: "Admin",
  super_admin: "Super Admin",
  regional_coordinator: "Regional Coordinator",
  district_coordinator: "District Coordinator",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  member: "Standard member with basic access",
  admin: "Administrator with configurable permissions",
  super_admin: "Full access to all features and settings",
  regional_coordinator: "Manages members and activities within a region",
  district_coordinator: "Manages members and activities within a district",
};

export function useAllUserRoles() {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["admin", "user-roles"],
    queryFn: async () => {
      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Get all permissions
      const { data: permissions, error: permError } = await supabase
        .from("admin_permissions")
        .select("*");

      if (permError) throw permError;

      // Get profiles for these users
      const userIds = [...new Set(roles?.map((r) => r.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      if (profilesError) throw profilesError;

      // Build combined data
      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      const userMap = new Map<string, UserWithRoles>();

      for (const role of roles || []) {
        if (!userMap.has(role.user_id)) {
          const profile = profileMap.get(role.user_id);
          userMap.set(role.user_id, {
            user_id: role.user_id,
            full_name: profile?.full_name || "Unknown",
            email: profile?.email || "Unknown",
            roles: [],
            permissions: [],
          });
        }
        userMap.get(role.user_id)!.roles.push(role as UserRole);
      }

      for (const perm of permissions || []) {
        if (!userMap.has(perm.user_id)) {
          const profile = profileMap.get(perm.user_id);
          userMap.set(perm.user_id, {
            user_id: perm.user_id,
            full_name: profile?.full_name || "Unknown",
            email: profile?.email || "Unknown",
            roles: [],
            permissions: [],
          });
        }
        userMap.get(perm.user_id)!.permissions.push(perm as UserPermission);
      }

      return Array.from(userMap.values());
    },
    enabled: !!isAdmin,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
      region,
      district,
    }: {
      userId: string;
      role: AppRole;
      region?: string;
      district?: string;
    }) => {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
        region: region || null,
        district: district || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toast.success("Role assigned successfully");
    },
    onError: (error) => {
      toast.error("Failed to assign role: " + error.message);
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toast.success("Role removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove role: " + error.message);
    },
  });
}

export function useTogglePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      permission,
      enabled,
      existingPermId,
    }: {
      userId: string;
      permission: string;
      enabled: boolean;
      existingPermId?: string;
    }) => {
      if (enabled) {
        const { error } = await supabase.from("admin_permissions").insert({
          user_id: userId,
          permission,
        });
        if (error) throw error;
      } else if (existingPermId) {
        const { error } = await supabase
          .from("admin_permissions")
          .delete()
          .eq("id", existingPermId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-roles"] });
      toast.success("Permission updated");
    },
    onError: (error) => {
      toast.error("Failed to update permission: " + error.message);
    },
  });
}
