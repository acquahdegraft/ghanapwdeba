import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useEvents } from "@/hooks/useEvents";
import { format, parseISO } from "date-fns";

const typeStyles: Record<string, string> = {
  workshop: "bg-primary/10 text-primary",
  conference: "bg-accent/20 text-accent-foreground",
  meetup: "bg-success/10 text-success",
  training: "bg-warning/10 text-warning",
  social: "bg-secondary text-secondary-foreground",
};

export function UpcomingEvents() {
  const { data: events, isLoading } = useEvents();
  const displayEvents = events?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
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
          <h3 className="font-semibold">Upcoming Events</h3>
          <p className="text-sm text-muted-foreground">Events you might be interested in</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/events">View All<ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>

      {displayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No upcoming events</p>
        </div>
      ) : (
        <div className="divide-y">
          {displayEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-muted text-center">
                <span className="text-xs font-medium text-muted-foreground">{format(parseISO(event.event_date), "MMM")}</span>
                <span className="text-lg font-bold">{format(parseISO(event.event_date), "d")}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${typeStyles[event.event_type] || typeStyles.meetup}`}>{event.event_type}</span>
                </div>
                <p className="font-medium truncate">{event.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(parseISO(event.event_date), "h:mm a")}</span>
                  {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{event.registrations_count} attending</span>
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
  );
}
