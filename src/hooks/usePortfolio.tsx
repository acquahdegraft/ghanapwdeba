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

export function useSavePortfolio() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolio: Partial<Portfolio> & { slug: string; headline: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if portfolio exists
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("portfolios")
          .update({
            ...portfolio,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("portfolios")
          .insert({
            ...portfolio,
            user_id: user.id,
          });
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
