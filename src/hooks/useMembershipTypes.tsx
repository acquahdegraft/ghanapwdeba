import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  annual_dues: number;
  benefits: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMembershipTypes(includeInactive = false) {
  return useQuery({
    queryKey: ["membershipTypes", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("membership_types")
        .select("*")
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as MembershipType[];
    },
  });
}

export function useCreateMembershipType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newType: {
      name: string;
      description?: string;
      annual_dues: number;
      benefits?: string[];
    }) => {
      // RLS policies enforce admin-only access - this is just for UX
      const { data, error } = await supabase
        .from("membership_types")
        .insert({
          name: newType.name,
          description: newType.description || null,
          annual_dues: newType.annual_dues,
          benefits: newType.benefits || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membershipTypes"] });
      toast.success("Membership type created successfully");
    },
    onError: (error) => {
      // Handle RLS permission denied errors gracefully
      const message = error.message.includes("row-level security") 
        ? "You don't have permission to perform this action"
        : error.message;
      toast.error("Failed to create membership type: " + message);
    },
  });
}

export function useUpdateMembershipType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string;
      annual_dues?: number;
      benefits?: string[];
      is_active?: boolean;
    }) => {
      // RLS policies enforce admin-only access - this is just for UX
      const { data, error } = await supabase
        .from("membership_types")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membershipTypes"] });
      toast.success("Membership type updated successfully");
    },
    onError: (error) => {
      const message = error.message.includes("row-level security") 
        ? "You don't have permission to perform this action"
        : error.message;
      toast.error("Failed to update membership type: " + message);
    },
  });
}

export function useToggleMembershipTypeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // RLS policies enforce admin-only access - this is just for UX
      const { error } = await supabase
        .from("membership_types")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["membershipTypes"] });
      toast.success(
        variables.is_active
          ? "Membership type activated"
          : "Membership type deactivated"
      );
    },
    onError: (error) => {
      const message = error.message.includes("row-level security") 
        ? "You don't have permission to perform this action"
        : error.message;
      toast.error("Failed to update status: " + message);
    },
  });
}
