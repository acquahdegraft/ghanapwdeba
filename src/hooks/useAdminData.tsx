import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { toast } from "sonner";

export interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  business_type: string | null;
  disability_type: string | null;
  region: string | null;
  city: string | null;
  membership_status: string;
  membership_start_date: string | null;
  membership_expiry_date: string | null;
  created_at: string;
}

export interface AdminPayment {
  id: string;
  user_id: string;
  amount: number;
  payment_type: string;
  payment_method: string | null;
  transaction_reference: string | null;
  status: string;
  payment_date: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export function useAllMembers() {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["admin", "members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MemberProfile[];
    },
    enabled: !!isAdmin,
  });
}

export function useAllPayments() {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      // First get all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Then get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email");

      if (profilesError) throw profilesError;

      // Join manually
      const profilesMap = new Map(
        profilesData?.map((p) => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      const enrichedPayments = paymentsData?.map((payment) => ({
        ...payment,
        profiles: profilesMap.get(payment.user_id),
      }));

      return enrichedPayments as AdminPayment[];
    },
    enabled: !!isAdmin,
  });
}

export function useUpdateMembershipStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      profileId, 
      status,
      expiryDate 
    }: { 
      profileId: string; 
      status: "pending" | "active" | "expired" | "suspended";
      expiryDate?: string;
    }) => {
      const updateData: Record<string, unknown> = { 
        membership_status: status 
      };
      
      if (status === "active" && expiryDate) {
        updateData.membership_expiry_date = expiryDate;
        updateData.membership_start_date = new Date().toISOString().split("T")[0];
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success("Membership status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update membership status: " + error.message);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      paymentId, 
      status 
    }: { 
      paymentId: string; 
      status: "pending" | "completed" | "failed" | "refunded";
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (status === "completed") {
        updateData.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      toast.success("Payment status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update payment status: " + error.message);
    },
  });
}
