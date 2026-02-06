import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Payment {
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
  updated_at: string;
}

export function usePayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Explicitly select only the columns needed - exclude webhook_token for security
      const { data, error } = await supabase
        .from("payments")
        .select("id, user_id, amount, payment_type, payment_method, transaction_reference, status, payment_date, due_date, notes, created_at, updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });
}
