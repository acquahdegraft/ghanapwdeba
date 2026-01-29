import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  external_url: string | null;
  file_type: string | null;
  file_size: number | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const RESOURCE_CATEGORIES = [
  "general",
  "guides",
  "templates",
  "policies",
  "training",
  "forms",
] as const;

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number];

export function useResources(category?: string) {
  return useQuery({
    queryKey: ["resources", category],
    queryFn: async () => {
      let query = supabase
        .from("resources")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Resource[];
    },
  });
}

export function useAdminResources() {
  return useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Resource[];
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (resource: Omit<Resource, "id" | "created_at" | "updated_at" | "created_by">) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("resources")
        .insert({
          ...resource,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Resource> & { id: string }) => {
      const { data, error } = await supabase
        .from("resources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
    },
  });
}

export async function uploadResourceFile(file: File): Promise<{ path: string; url: string }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("resources")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from("resources")
    .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

  if (urlError) throw urlError;

  return {
    path: fileName,
    url: signedUrlData.signedUrl,
  };
}

export async function getResourceSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("resources")
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (error) {
    console.error("Error getting signed URL:", error);
    return null;
  }

  return data.signedUrl;
}

export { RESOURCE_CATEGORIES };
