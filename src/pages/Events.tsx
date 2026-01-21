import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Users, Video, ExternalLink, CheckCircle2 } from "lucide-react";
import { useEvents, useMyRegistrations, useRegisterForEvent, useCancelRegistration } from "@/hooks/useEvents";
import { format, parseISO, isPast } from "date-fns";

const eventTypeStyles: Record<string, string> = {
  workshop: "bg-primary/10 text-primary",
  conference: "bg-accent/20 text-accent-foreground",
  meetup: "bg-success/10 text-success",
  training: "bg-warning/10 text-warning",
  social: "bg-secondary text-secondary-foreground",
};

const locationTypeIcons: Record<string, typeof MapPin> = {
  physical: MapPin,
  virtual: Video,
  hybrid: Users,
};

export default function Events() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const { data: registrations, isLoading: registrationsLoading } = useMyRegistrations();
  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelRegistration();

  const registeredEvents = registrations?.map((r: any) => r.events) || [];

  const handleRegister = (eventId: string) => {
    registerMutation.mutate(eventId);
  };

  const handleCancel = (eventId: string) => {
    cancelMutation.mutate(eventId);
  };

  const formatEventDate = (dateStr: string) => {
    return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
  };

  const formatEventTime = (dateStr: string) => {
    return format(parseISO(dateStr), "h:mm a");
  };

  const isRegistrationOpen = (event: any) => {
    if (!event.registration_deadline) return true;
    return !isPast(parseISO(event.registration_deadline));
  };

  const isFull = (event: any) => {
    if (!event.max_attendees) return false;
    return event.registrations_count >= event.max_attendees;
  };

  const renderEventCard = (event: any, showCancelButton = false) => {
    const LocationIcon = locationTypeIcons[event.location_type] || MapPin;
    const registrationOpen = isRegistrationOpen(event);
    const eventFull = isFull(event);

    return (
      <Card key={event.id} className="card-interactive">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge className={eventTypeStyles[event.event_type] || eventTypeStyles.meetup}>
                  {event.event_type}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  <LocationIcon className="mr-1 h-3 w-3" />
                  {event.location_type}
                </Badge>
                {event.is_registered && (
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Registered
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{event.title}</CardTitle>
              {event.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {event.description}
                </CardDescription>
              )}
            </div>
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-lg bg-muted text-center">
              <span className="text-xs font-medium text-muted-foreground">
                {format(parseISO(event.event_date), "MMM")}
              </span>
              <span className="text-xl font-bold">
                {format(parseISO(event.event_date), "d")}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatEventDate(event.event_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatEventTime(event.event_date)}
                {event.end_date && ` - ${formatEventTime(event.end_date)}`}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {event.registrations_count} attending
                {event.max_attendees && ` / ${event.max_attendees} max`}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {showCancelButton ? (
              <>
                {event.virtual_link && (
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(event.virtual_link, "_blank")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Join Event
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleCancel(event.id)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel Registration
                </Button>
              </>
            ) : event.is_registered ? (
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Already Registered
              </Button>
            ) : !registrationOpen ? (
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                Registration Closed
              </Button>
            ) : eventFull ? (
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                Event Full
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => handleRegister(event.id)}
                disabled={registerMutation.isPending}
              >
                Register Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLoadingSkeleton = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-9 w-full mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <DashboardLayout
      title="Events"
      description="Discover and register for upcoming workshops, conferences, and networking events"
    >
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="registered">My Registrations</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {eventsLoading ? (
            renderLoadingSkeleton()
          ) : events?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No upcoming events</h3>
                <p className="text-sm text-muted-foreground">
                  Check back soon for new events and workshops
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {events?.map((event) => renderEventCard(event))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registered">
          {registrationsLoading ? (
            renderLoadingSkeleton()
          ) : registeredEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">No registered events</h3>
                <p className="text-sm text-muted-foreground">
                  Browse upcoming events and register for ones that interest you
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {registeredEvents.map((event: any) => renderEventCard({ ...event, is_registered: true }, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
