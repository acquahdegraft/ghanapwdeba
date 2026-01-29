import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "./useAdminRole";
import { toast } from "sonner";

export interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  location_type: string;
  virtual_link: string | null;
  max_attendees: number | null;
  registration_deadline: string | null;
  event_type: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  registrations_count?: number;
}

export interface EventFormData {
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  location?: string;
  location_type: string;
  virtual_link?: string;
  max_attendees?: number;
  registration_deadline?: string;
  event_type: string;
  is_published: boolean;
}

export function useAdminEvents() {
  const { data: isAdmin } = useAdminRole();

  return useQuery({
    queryKey: ["admin", "events"],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;

      // Get registration counts for each event
      const eventsWithCounts = await Promise.all(
        (events || []).map(async (event) => {
          const { count } = await supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "registered");

          return {
            ...event,
            registrations_count: count || 0,
          };
        })
      );

      return eventsWithCounts as AdminEvent[];
    },
    enabled: !!isAdmin,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: EventFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .insert({
          ...eventData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create event: " + error.message);
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...eventData }: EventFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete event: " + error.message);
    },
  });
}

export function useToggleEventPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, isPublished }: { eventId: string; isPublished: boolean }) => {
      const { error } = await supabase
        .from("events")
        .update({ is_published: isPublished })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: (_, { isPublished }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(isPublished ? "Event published" : "Event unpublished");
    },
    onError: (error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });
}
