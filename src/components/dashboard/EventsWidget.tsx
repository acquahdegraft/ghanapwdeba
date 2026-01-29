import { Calendar, Users, ArrowRight, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isPast } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface EventWithStats {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  location: string | null;
  location_type: string;
  max_attendees: number | null;
  registrations_count: number;
  attendance_rate?: number;
  is_registered?: boolean;
  is_past: boolean;
}

const typeStyles: Record<string, string> = {
  workshop: "bg-primary/10 text-primary",
  conference: "bg-accent/20 text-accent-foreground",
  meetup: "bg-success/10 text-success",
  training: "bg-warning/10 text-warning",
  social: "bg-secondary text-secondary-foreground",
};

export function EventsWidget() {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events-widget"],
    queryFn: async () => {
      // Get all published events (both upcoming and recent past)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: allEvents, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .gte("event_date", thirtyDaysAgo.toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;

      // Get registration and attendance data for each event
      const eventsWithStats = await Promise.all(
        (allEvents || []).map(async (event) => {
          const eventDate = parseISO(event.event_date);
          const isPastEvent = isPast(eventDate);

          // Get registration count
          const { count: regCount } = await supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "registered");

          // For past events, get attendance stats
          let attendanceRate: number | undefined;
          if (isPastEvent) {
            const { data: attendanceData } = await supabase
              .from("event_registrations")
              .select("attendance_status")
              .eq("event_id", event.id)
              .eq("status", "registered");

            if (attendanceData && attendanceData.length > 0) {
              const presentCount = attendanceData.filter(
                (r) => r.attendance_status === "present"
              ).length;
              attendanceRate = Math.round((presentCount / attendanceData.length) * 100);
            }
          }

          // Check if user is registered
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
            id: event.id,
            title: event.title,
            event_date: event.event_date,
            event_type: event.event_type,
            location: event.location,
            location_type: event.location_type,
            max_attendees: event.max_attendees,
            registrations_count: regCount || 0,
            attendance_rate: attendanceRate,
            is_registered: isRegistered,
            is_past: isPastEvent,
          } as EventWithStats;
        })
      );

      return eventsWithStats;
    },
    enabled: !!user,
  });

  const upcomingEvents = events?.filter((e) => !e.is_past).slice(0, 3) || [];
  const pastEvents = events?.filter((e) => e.is_past && e.attendance_rate !== undefined).slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-14 w-14 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="font-semibold">Events Overview</h3>
          <p className="text-sm text-muted-foreground">Upcoming events & attendance stats</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/events">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Upcoming Events Section */}
      <div className="border-b">
        <div className="px-6 py-3 bg-muted/30">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events
          </h4>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="divide-y">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-muted text-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    {format(parseISO(event.event_date), "MMM")}
                  </span>
                  <span className="text-lg font-bold">
                    {format(parseISO(event.event_date), "d")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        typeStyles[event.event_type] || typeStyles.meetup
                      }`}
                    >
                      {event.event_type}
                    </span>
                    {event.is_registered && (
                      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                        Registered
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium truncate">{event.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(event.event_date), "h:mm a")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.registrations_count}
                      {event.max_attendees && ` / ${event.max_attendees}`}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/dashboard/events">{event.is_registered ? "View" : "RSVP"}</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events with Attendance Rates */}
      {pastEvents.length > 0 && (
        <div>
          <div className="px-6 py-3 bg-muted/30">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Attendance Rates
            </h4>
          </div>
          <div className="p-4 space-y-3">
            {pastEvents.map((event) => (
              <div key={event.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{event.title}</span>
                  <span className="text-muted-foreground whitespace-nowrap ml-2">
                    {event.attendance_rate}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={event.attendance_rate} className="h-2" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.registrations_count} attended
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
