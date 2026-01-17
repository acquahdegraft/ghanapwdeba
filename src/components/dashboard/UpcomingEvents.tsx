import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: "workshop" | "conference" | "meetup";
}

const events: Event[] = [
  {
    id: "1",
    title: "Business Skills Workshop",
    date: "Feb 15, 2025",
    time: "10:00 AM",
    location: "Accra Conference Center",
    attendees: 45,
    type: "workshop",
  },
  {
    id: "2",
    title: "Annual General Meeting",
    date: "Mar 10, 2025",
    time: "2:00 PM",
    location: "Virtual (Zoom)",
    attendees: 120,
    type: "conference",
  },
  {
    id: "3",
    title: "Networking Breakfast",
    date: "Mar 25, 2025",
    time: "8:00 AM",
    location: "Kempinski Hotel, Accra",
    attendees: 30,
    type: "meetup",
  },
];

const typeStyles = {
  workshop: "bg-primary/10 text-primary",
  conference: "bg-accent/20 text-accent-foreground",
  meetup: "bg-success/10 text-success",
};

export function UpcomingEvents() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="font-semibold">Upcoming Events</h3>
          <p className="text-sm text-muted-foreground">
            Events you might be interested in
          </p>
        </div>
        <Button variant="ghost" size="sm">
          View All
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="divide-y">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-muted text-center">
              <span className="text-xs font-medium text-muted-foreground">
                {event.date.split(" ")[0]}
              </span>
              <span className="text-lg font-bold">{event.date.split(" ")[1].replace(",", "")}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    typeStyles[event.type]
                  }`}
                >
                  {event.type}
                </span>
              </div>
              <p className="font-medium truncate">{event.title}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.attendees} attending
                </span>
              </div>
            </div>

            <Button variant="outline" size="sm">
              RSVP
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
