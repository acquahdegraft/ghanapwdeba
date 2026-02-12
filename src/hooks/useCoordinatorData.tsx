import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CoordinatorRole {
  role: "regional_coordinator" | "district_coordinator";
  region: string | null;
  district: string | null;
}

export interface CoordinatorMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  business_name: string | null;
  business_type: string | null;
  region: string | null;
  city: string | null;
  membership_status: string | null;
  membership_type_id: string | null;
  membership_start_date: string | null;
  membership_expiry_date: string | null;
  created_at: string | null;
}

export function useCoordinatorRole() {
  const { user } = useAuth();

  return useQuery<CoordinatorRole | null>({
    queryKey: ["coordinatorRole", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role, region, district")
        .eq("user_id", user.id)
        .in("role", ["regional_coordinator", "district_coordinator"])
        .maybeSingle();

      if (error || !data) return null;
      return data as CoordinatorRole;
    },
    enabled: !!user,
  });
}

export function useCoordinatorMembers() {
  const { data: coordRole } = useCoordinatorRole();

  return useQuery<CoordinatorMember[]>({
    queryKey: ["coordinatorMembers", coordRole?.role, coordRole?.region, coordRole?.district],
    queryFn: async () => {
      if (!coordRole) return [];

      // Use admin_members view - coordinators with admin roles can access it
      let query = supabase
        .from("admin_members")
        .select("*")
        .order("created_at", { ascending: false });

      if (coordRole.role === "regional_coordinator" && coordRole.region) {
        query = query.eq("region", coordRole.region);
      } else if (coordRole.role === "district_coordinator" && coordRole.district) {
        // District coordinators filter by city (district)
        query = query.eq("city", coordRole.district);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CoordinatorMember[];
    },
    enabled: !!coordRole,
  });
}

export function useCoordinatorPayments() {
  const { data: coordRole } = useCoordinatorRole();
  const { data: members } = useCoordinatorMembers();

  return useQuery({
    queryKey: ["coordinatorPayments", coordRole?.role, members?.length],
    queryFn: async () => {
      if (!members?.length) return [];

      const userIds = members.map((m) => m.user_id).filter(Boolean);
      if (userIds.length === 0) return [];

      const { data, error } = await supabase
        .from("payments")
        .select("id, user_id, amount, payment_type, payment_method, transaction_reference, status, payment_date, created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!members && members.length > 0,
  });
}
