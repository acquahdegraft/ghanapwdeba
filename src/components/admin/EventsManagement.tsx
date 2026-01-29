import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Users,
  Video,
  ClipboardList,
  Send,
} from "lucide-react";
import {
  AdminEvent,
  EventFormData,
  useAdminEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useToggleEventPublish,
} from "@/hooks/useAdminEvents";
import { AttendanceDialog } from "./AttendanceDialog";
import { useSendEventNotification } from "@/hooks/useBulkMemberActions";

const eventTypes = [
  { value: "meetup", label: "Meetup" },
  { value: "workshop", label: "Workshop" },
  { value: "conference", label: "Conference" },
  { value: "training", label: "Training" },
  { value: "networking", label: "Networking" },
  { value: "webinar", label: "Webinar" },
  { value: "other", label: "Other" },
];

const locationTypes = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
];

const initialFormData: EventFormData = {
  title: "",
  description: "",
  event_date: "",
  end_date: "",
  location: "",
  location_type: "physical",
  virtual_link: "",
  max_attendees: undefined,
  registration_deadline: "",
  event_type: "meetup",
  is_published: false,
};

export function EventsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [attendanceEvent, setAttendanceEvent] = useState<AdminEvent | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const { data: events = [], isLoading } = useAdminEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const togglePublish = useToggleEventPublish();
  const sendNotification = useSendEventNotification();

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (event: AdminEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      event_date: event.event_date.slice(0, 16),
      end_date: event.end_date?.slice(0, 16) || "",
      location: event.location || "",
      location_type: event.location_type,
      virtual_link: event.virtual_link || "",
      max_attendees: event.max_attendees || undefined,
      registration_deadline: event.registration_deadline?.slice(0, 16) || "",
      event_type: event.event_type,
      is_published: event.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      end_date: formData.end_date || undefined,
      registration_deadline: formData.registration_deadline || undefined,
      max_attendees: formData.max_attendees || undefined,
    };

    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, ...submitData });
    } else {
      await createEvent.mutateAsync(submitData);
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingEventId) {
      await deleteEvent.mutateAsync(deletingEventId);
      setIsDeleteDialogOpen(false);
      setDeletingEventId(null);
    }
  };

  const handleTogglePublish = (event: AdminEvent) => {
    togglePublish.mutate({ eventId: event.id, isPublished: !event.is_published });
  };

  const handleOpenAttendance = (event: AdminEvent) => {
    setAttendanceEvent(event);
    setIsAttendanceOpen(true);
  };

  const handleSendNotification = (event: AdminEvent) => {
    sendNotification.mutate({
      eventId: event.id,
      eventTitle: event.title,
      eventDate: format(parseISO(event.event_date), "MMMM d, yyyy 'at' h:mm a"),
      eventLocation: event.location || undefined,
      eventDescription: event.description || undefined,
    });
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case "virtual":
        return <Video className="h-4 w-4" />;
      case "hybrid":
        return (
          <div className="flex">
            <MapPin className="h-4 w-4" />
            <Video className="h-4 w-4 -ml-1" />
          </div>
        );
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Events</CardTitle>
            <CardDescription>Create and manage events for members</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {event.description || "No description"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(parseISO(event.event_date), "MMM d, yyyy")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(event.event_date), "h:mm a")}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLocationIcon(event.location_type)}
                          <span className="capitalize">{event.location_type}</span>
                        </div>
                        {event.location && (
                          <p className="text-xs text-muted-foreground">{event.location}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {event.registrations_count}
                            {event.max_attendees && ` / ${event.max_attendees}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.is_published ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Published
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(event)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenAttendance(event)}>
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublish(event)}>
                              {event.is_published ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleSendNotification(event)}
                              disabled={sendNotification.isPending}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Notify Members
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeletingEventId(event.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Update the event details below"
                : "Fill in the details to create a new event"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_type">Location Type *</Label>
                <Select
                  value={formData.location_type}
                  onValueChange={(value) => setFormData({ ...formData, location_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_date">Start Date & Time *</Label>
                <Input
                  id="event_date"
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              {(formData.location_type === "physical" || formData.location_type === "hybrid") && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="location">Physical Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Community Center, Accra"
                  />
                </div>
              )}

              {(formData.location_type === "virtual" || formData.location_type === "hybrid") && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="virtual_link">Virtual Meeting Link</Label>
                  <Input
                    id="virtual_link"
                    type="url"
                    value={formData.virtual_link}
                    onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="max_attendees">Maximum Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  min="1"
                  value={formData.max_attendees || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_attendees: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_deadline">Registration Deadline</Label>
                <Input
                  id="registration_deadline"
                  type="datetime-local"
                  value={formData.registration_deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_deadline: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2 flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_published">Publish Event</Label>
                  <p className="text-sm text-muted-foreground">
                    Published events are visible to all members
                  </p>
                </div>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {createEvent.isPending || updateEvent.isPending
                  ? "Saving..."
                  : editingEvent
                  ? "Update Event"
                  : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone
              and will also remove all registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendance Dialog */}
      <AttendanceDialog
        event={attendanceEvent}
        open={isAttendanceOpen}
        onOpenChange={setIsAttendanceOpen}
      />
    </Card>
  );
}
