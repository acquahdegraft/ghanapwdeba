import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Event {
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
  registrations_count?: number;
  is_registered?: boolean;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  registered_at: string;
  notes: string | null;
}

export function useEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;

      // Get registration counts and user's registration status
      const eventsWithCounts = await Promise.all(
        (events || []).map(async (event) => {
          const { count } = await supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "registered");

          let isRegistered = false;
          if (user) {
            const { data: reg } = await supabase
              .from("event_registrations")
              .select("id")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .eq("status", "registered")
              .maybeSingle();
            isRegistered = !!reg;
          }

          return {
            ...event,
            registrations_count: count || 0,
            is_registered: isRegistered,
          };
        })
      );

      return eventsWithCounts as Event[];
    },
    enabled: !!user,
  });
}

export function useMyRegistrations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*, events(*)")
        .eq("user_id", user!.id)
        .eq("status", "registered")
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRegisterForEvent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: "registered",
        })
        .select()
        .single();

      if (error) throw error;

      // Send confirmation email (non-blocking)
      try {
        const { data: session } = await supabase.auth.getSession();
        await supabase.functions.invoke("send-registration-confirmation", {
          body: { eventId, userId: user.id },
          headers: {
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't throw - registration succeeded, email is nice-to-have
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Registered!",
        description: "You have successfully registered for this event. A confirmation email has been sent.",
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCancelRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Registration cancelled",
        description: "Your registration has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => {
      toast({
        title: "Cancellation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
