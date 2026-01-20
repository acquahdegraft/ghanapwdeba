import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  created_by: string;
  publish_date: string | null;
  expire_date: string | null;
  created_at: string;
  updated_at: string;
}

export function usePublishedAnnouncements() {
  return useQuery({
    queryKey: ["announcements", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .or("publish_date.is.null,publish_date.lte.now()")
        .or("expire_date.is.null,expire_date.gt.now()")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
  });
}

export function useAllAnnouncements() {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["announcements", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!isAdmin,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: isAdmin } = useAdminRole();

  return useMutation({
    mutationFn: async (newAnnouncement: {
      title: string;
      content: string;
      priority?: "low" | "normal" | "high" | "urgent";
      is_published?: boolean;
      publish_date?: string;
      expire_date?: string;
    }) => {
      if (!isAdmin || !user) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("announcements")
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          priority: newAnnouncement.priority || "normal",
          is_published: newAnnouncement.is_published || false,
          publish_date: newAnnouncement.publish_date || null,
          expire_date: newAnnouncement.expire_date || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create announcement: " + error.message);
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const { data: isAdmin } = useAdminRole();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      content?: string;
      priority?: "low" | "normal" | "high" | "urgent";
      is_published?: boolean;
      publish_date?: string | null;
      expire_date?: string | null;
    }) => {
      if (!isAdmin) throw new Error("Unauthorized");

      const { data, error } = await supabase
        .from("announcements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update announcement: " + error.message);
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { data: isAdmin } = useAdminRole();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Unauthorized");

      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete announcement: " + error.message);
    },
  });
}
