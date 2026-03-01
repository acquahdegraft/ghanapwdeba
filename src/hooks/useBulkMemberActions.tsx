import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addYears } from "date-fns";

export function useBulkDeleteMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileIds }: { profileIds: string[] }) => {
      // First, look up the user_ids for these profile IDs
      const { data: profiles, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id")
        .in("id", profileIds);

      if (lookupError) throw lookupError;

      const userIds = profiles?.map((p) => p.user_id) || [];
      if (userIds.length === 0) throw new Error("No matching users found");

      // Call edge function to delete from auth (cascades to profiles)
      const { data, error } = await supabase.functions.invoke("delete-members", {
        body: { userIds },
      });

      if (error) throw error;
      if (data?.errors?.length > 0) {
        console.error("Some deletions failed:", data.errors);
      }

      return { count: data?.deleted || 0 };
    },
    onSuccess: ({ count }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`Deleted ${count} member(s) successfully`);
    },
    onError: (error) => {
      toast.error("Failed to delete members: " + error.message);
    },
  });
}

interface BulkStatusUpdateParams {
  profileIds: string[];
  status: "active" | "pending" | "expired" | "suspended";
}

export function useBulkUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileIds, status }: BulkStatusUpdateParams) => {
      const expiryDate = status === "active" 
        ? addYears(new Date(), 1).toISOString().split("T")[0]
        : undefined;
      
      const startDate = status === "active" 
        ? new Date().toISOString().split("T")[0]
        : undefined;

      const updateData: Record<string, unknown> = {
        membership_status: status,
      };

      if (expiryDate) {
        updateData.membership_expiry_date = expiryDate;
      }

      if (startDate) {
        updateData.membership_start_date = startDate;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .in("id", profileIds);

      if (error) throw error;

      return { count: profileIds.length, status };
    },
    onSuccess: ({ count, status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      toast.success(`Updated ${count} members to ${status}`);
    },
    onError: (error) => {
      toast.error("Failed to update members: " + error.message);
    },
  });
}

export function useSendEventNotification() {
  return useMutation({
    mutationFn: async ({
      eventId,
      eventTitle,
      eventDate,
      eventLocation,
      eventDescription,
    }: {
      eventId: string;
      eventTitle: string;
      eventDate: string;
      eventLocation?: string;
      eventDescription?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("send-event-notification", {
        body: {
          eventId,
          eventTitle,
          eventDate,
          eventLocation,
          eventDescription,
        },
      });

      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Notification sent to ${data.successCount} active members`);
    },
    onError: (error) => {
      toast.error("Failed to send notifications: " + error.message);
    },
  });
}
