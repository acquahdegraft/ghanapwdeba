import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Portfolio {
  id: string;
  user_id: string;
  slug: string;
  headline: string;
  bio: string;
  services: string[];
  skills: string[];
  years_of_experience: number | null;
  portfolio_images: string[];
  website_url: string | null;
  social_links: Record<string, string>;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface PublicPortfolio {
  id: string;
  slug: string;
  headline: string;
  bio: string;
  services: string[];
  skills: string[];
  years_of_experience: number | null;
  portfolio_images: string[];
  website_url: string | null;
  social_links: Record<string, string>;
  is_featured: boolean;
  view_count: number;
  full_name: string;
  business_name: string | null;
  business_type: string | null;
  avatar_url: string | null;
  region: string | null;
  city: string | null;
}

export function useMyPortfolio() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-portfolio", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Portfolio | null;
    },
    enabled: !!user,
  });
}

export function usePublicPortfolios() {
  return useQuery({
    queryKey: ["public-portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_portfolios")
        .select("*");
      if (error) throw error;
      return (data || []) as PublicPortfolio[];
    },
  });
}

export function useFeaturedPortfolios() {
  return useQuery({
    queryKey: ["featured-portfolios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_portfolios")
        .select("*")
        .eq("is_featured", true);
      if (error) throw error;
      return (data || []) as PublicPortfolio[];
    },
  });
}

export function usePublicPortfolioBySlug(slug: string) {
  return useQuery({
    queryKey: ["public-portfolio", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_portfolios")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as PublicPortfolio | null;
    },
    enabled: !!slug,
  });
}

export function useAllPortfoliosAdmin() {
  return useQuery({
    queryKey: ["admin-portfolios"],
    queryFn: async () => {
      // Get portfolios
      const { data: portfolios, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get profile info for each portfolio
      const userIds = (portfolios || []).map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, business_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      return (portfolios || []).map((p) => ({
        ...p,
        profiles: profileMap.get(p.user_id) || null,
      })) as (Portfolio & { profiles: { full_name: string; email: string; business_name: string | null } | null })[];
    },
  });
}

export function useTogglePortfolioFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from("portfolios")
        .update({ is_featured })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["featured-portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["public-portfolios"] });
    },
  });
}

export function useTogglePortfolioPublished() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("portfolios")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["public-portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["featured-portfolios"] });
    },
  });
}

export function useSavePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolio: Partial<Portfolio> & { slug: string; headline: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("portfolios")
          .update({ ...portfolio, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("portfolios")
          .insert({ ...portfolio, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["public-portfolios"] });
      toast.success("Portfolio saved successfully!");
    },
    onError: (error: Error) => {
      if (error.message?.includes("row-level security")) {
        toast.error("Only active paid members can create a portfolio.");
      } else {
        toast.error("Failed to save portfolio: " + error.message);
      }
    },
  });
}

// Image upload helpers
export async function uploadPortfolioImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("portfolio-images")
    .upload(fileName, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("portfolio-images").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deletePortfolioImage(imageUrl: string): Promise<void> {
  const match = imageUrl.match(/portfolio-images\/(.+)$/);
  if (!match) return;
  const { error } = await supabase.storage.from("portfolio-images").remove([match[1]]);
  if (error) console.error("Failed to delete image:", error);
}

export async function trackPortfolioView(slug: string): Promise<void> {
  await supabase.rpc("increment_portfolio_view", { portfolio_slug: slug });
}
