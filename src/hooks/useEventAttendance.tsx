import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { toast } from "sonner";

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: string;
  notes: string | null;
  attendance_status: string;
  attended_at: string | null;
  profile?: {
    full_name: string;
    email: string;
  };
}

export function useEventRegistrations(eventId: string) {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["admin", "event-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          event_id,
          user_id,
          registered_at,
          status,
          notes,
          attendance_status,
          attended_at
        `)
        .eq("event_id", eventId)
        .eq("status", "registered");

      if (error) throw error;

      // Fetch profile data for each registration
      const registrationsWithProfiles = await Promise.all(
        (data || []).map(async (reg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", reg.user_id)
            .single();

          return {
            ...reg,
            profile: profile || { full_name: "Unknown", email: "" },
          };
        })
      );

      return registrationsWithProfiles as EventRegistration[];
    },
    enabled: !!isAdmin && !!eventId,
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationId,
      attendanceStatus,
    }: {
      registrationId: string;
      attendanceStatus: "present" | "absent" | "unknown";
    }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({
          attendance_status: attendanceStatus,
          attended_at: attendanceStatus !== "unknown" ? new Date().toISOString() : null,
        })
        .eq("id", registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "event-registrations"] });
      toast.success("Attendance updated");
    },
    onError: (error) => {
      toast.error("Failed to update attendance: " + error.message);
    },
  });
}

export function useBulkUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      registrationIds,
      attendanceStatus,
    }: {
      registrationIds: string[];
      attendanceStatus: "present" | "absent" | "unknown";
    }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({
          attendance_status: attendanceStatus,
          attended_at: attendanceStatus !== "unknown" ? new Date().toISOString() : null,
        })
        .in("id", registrationIds);

      if (error) throw error;
    },
    onSuccess: (_, { registrationIds }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "event-registrations"] });
      toast.success(`Updated attendance for ${registrationIds.length} attendees`);
    },
    onError: (error) => {
      toast.error("Failed to update attendance: " + error.message);
    },
  });
}
