import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAdminRole() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["adminRole", user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .rpc("is_admin");

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!user,
  });
}
