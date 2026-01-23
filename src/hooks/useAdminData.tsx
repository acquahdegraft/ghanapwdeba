import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { toast } from "sonner";

// MemberProfile excludes sensitive fields (disability_type, phone) for privacy
// These fields are only accessible via direct profiles table queries with super_admin role
export interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
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

async function sendNotificationEmail(
  to: string,
  memberName: string,
  notificationType: "membership_status" | "payment_status",
  oldStatus: string,
  newStatus: string,
  additionalInfo?: string
) {
  try {
    const response = await supabase.functions.invoke("send-notification", {
      body: {
        to,
        memberName,
        notificationType,
        oldStatus,
        newStatus,
        additionalInfo,
      },
    });

    if (response.error) {
      console.error("Failed to send notification email:", response.error);
    } else {
      console.log("Notification email sent successfully");
    }
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
}

export function useAllMembers() {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["admin", "members"],
    queryFn: async () => {
      // Use admin_members view which excludes sensitive fields (disability_type, phone)
      // This protects member privacy while allowing admins to manage memberships
      const { data, error } = await supabase
        .from("admin_members")
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
      expiryDate,
      memberEmail,
      memberName,
      oldStatus,
    }: { 
      profileId: string; 
      status: "pending" | "active" | "expired" | "suspended";
      expiryDate?: string;
      memberEmail?: string;
      memberName?: string;
      oldStatus?: string;
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

      // Send email notification if we have member details
      if (memberEmail && memberName && oldStatus) {
        await sendNotificationEmail(
          memberEmail,
          memberName,
          "membership_status",
          oldStatus,
          status,
          expiryDate ? `Membership valid until: ${expiryDate}` : undefined
        );
      }
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
      status,
      memberEmail,
      memberName,
      oldStatus,
      amount,
    }: { 
      paymentId: string; 
      status: "pending" | "completed" | "failed" | "refunded";
      memberEmail?: string;
      memberName?: string;
      oldStatus?: string;
      amount?: number;
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

      // Send email notification if we have member details
      if (memberEmail && memberName && oldStatus) {
        await sendNotificationEmail(
          memberEmail,
          memberName,
          "payment_status",
          oldStatus,
          status,
          amount ? `Amount: GHS ${amount.toFixed(2)}` : undefined
        );
      }
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
