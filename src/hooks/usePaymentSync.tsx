import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Payment } from "./usePayments";
import { toast } from "sonner";

interface SyncResult {
  reference: string;
  oldStatus: string;
  newStatus: string;
  amount?: number;
}

export function usePaymentSync(payments: Payment[] | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!user || !payments || hasSynced.current || isSyncing) return;

    const pendingPayments = payments.filter(
      (p) => p.status === "pending" && p.transaction_reference
    );

    if (pendingPayments.length === 0) return;

    hasSynced.current = true;

    const syncPayments = async () => {
      setIsSyncing(true);
      const results: SyncResult[] = [];

      for (const payment of pendingPayments) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "check-hubtel-status",
            {
              body: { clientReference: payment.transaction_reference },
            }
          );

          if (error) {
            console.error(`Sync failed for ${payment.transaction_reference}:`, error);
            continue;
          }

          if (data?.status && data.status !== payment.status) {
            results.push({
              reference: payment.transaction_reference!,
              oldStatus: payment.status,
              newStatus: data.status,
              amount: data.amount || payment.amount,
            });
          }
        } catch (err) {
          console.error(`Sync error for ${payment.transaction_reference}:`, err);
        }
      }

      if (results.length > 0) {
        setSyncResults(results);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });

        const completed = results.filter((r) => r.newStatus === "completed");
        if (completed.length > 0) {
          toast.success(
            `${completed.length} payment${completed.length > 1 ? "s" : ""} confirmed as completed`
          );
        }
      }

      setIsSyncing(false);
    };

    syncPayments();
  }, [user, payments, queryClient, isSyncing]);

  // Reset sync flag when user changes
  useEffect(() => {
    hasSynced.current = false;
  }, [user?.id]);

  return { isSyncing, syncResults };
}
