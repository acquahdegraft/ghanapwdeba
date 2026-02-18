import { useState, useRef, useEffect } from "react";
import { Bell, Megaphone, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { usePublishedAnnouncements } from "@/hooks/useAnnouncements";
import { useEvents } from "@/hooks/useEvents";
import { format, formatDistanceToNow, isBefore, addDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "gpwdeba_dismissed_notifications";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function addDismissed(id: string) {
  const current = getDismissed();
  if (!current.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
  }
}

const priorityColor: Record<string, string> = {
  urgent: "bg-destructive text-destructive-foreground",
  high: "bg-accent text-accent-foreground",
  normal: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>(getDismissed);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();

  const { data: announcements = [] } = usePublishedAnnouncements();
  const { data: events = [] } = useEvents();

  // Realtime subscription for announcements
  useEffect(() => {
    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload) => {
          // Refetch published announcements when any change occurs
          queryClient.invalidateQueries({ queryKey: ["announcements", "published"] });

          // Show a toast for new published announcements
          if (
            payload.eventType === "INSERT" &&
            (payload.new as { is_published?: boolean })?.is_published
          ) {
            const title = (payload.new as { title?: string })?.title || "New announcement";
            toast.info(`📢 New announcement: ${title}`, { duration: 5000 });
          } else if (
            payload.eventType === "UPDATE" &&
            (payload.new as { is_published?: boolean })?.is_published &&
            !(payload.old as { is_published?: boolean })?.is_published
          ) {
            // Was just published
            const title = (payload.new as { title?: string })?.title || "New announcement";
            toast.info(`📢 New announcement: ${title}`, { duration: 5000 });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") setRealtimeStatus("disconnected");
        else setRealtimeStatus("connecting");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Upcoming events in the next 7 days that the user is registered for
  const upcomingEvents = events.filter((e) => {
    if (!e.is_registered) return false;
    const eventDate = new Date(e.event_date);
    return isBefore(eventDate, addDays(new Date(), 7));
  });

  // Build combined notification list
  const announcementItems = announcements
    .filter((a) => !dismissed.includes(`ann-${a.id}`))
    .slice(0, 5)
    .map((a) => ({ id: `ann-${a.id}`, type: "announcement" as const, data: a }));

  const eventItems = upcomingEvents
    .filter((e) => !dismissed.includes(`evt-${e.id}`))
    .slice(0, 3)
    .map((e) => ({ id: `evt-${e.id}`, type: "event" as const, data: e }));

  const notifications = [...announcementItems, ...eventItems];
  const unreadCount = notifications.length;

  const dismiss = (id: string) => {
    addDismissed(id);
    setDismissed((prev) => [...prev, id]);
  };

  const dismissAll = () => {
    notifications.forEach((n) => addDismissed(n.id));
    setDismissed(getDismissed());
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-popover text-popover-foreground shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifications</span>
              <span
                title={
                  realtimeStatus === "connected"
                    ? "Live updates active"
                    : realtimeStatus === "connecting"
                    ? "Connecting…"
                    : "Realtime disconnected"
                }
              className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  realtimeStatus === "connected" && "bg-chart-2",
                  realtimeStatus === "connecting" && "bg-chart-4 animate-pulse",
                  realtimeStatus === "disconnected" && "bg-destructive"
                )}
              />
            </div>
            {unreadCount > 0 && (
              <button
                onClick={dismissAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Dismiss all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="divide-y">
                {notifications.map((notif) => {
                  if (notif.type === "announcement") {
                    const a = notif.data;
                    return (
                      <div key={notif.id} className="group relative flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Megaphone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5 flex-wrap">
                            <p className="text-sm font-medium leading-tight truncate">{a.title}</p>
                            <Badge
                              className={cn("shrink-0 text-[10px] px-1.5 py-0 h-4", priorityColor[a.priority])}
                            >
                              {a.priority}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.content}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <button
                          onClick={() => dismiss(notif.id)}
                          className="absolute right-2 top-2 hidden rounded p-0.5 text-muted-foreground hover:text-foreground group-hover:block"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  }

                  // event
                  const e = notif.data;
                  return (
                    <div key={notif.id} className="group relative flex gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Calendar className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{e.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {format(new Date(e.event_date), "EEE, MMM d · h:mm a")}
                        </p>
                        <p className="mt-1 text-[11px] text-primary font-medium">
                          Registered · coming up soon
                        </p>
                      </div>
                      <button
                        onClick={() => dismiss(notif.id)}
                        className="absolute right-2 top-2 hidden rounded p-0.5 text-muted-foreground hover:text-foreground group-hover:block"
                        aria-label="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Footer links */}
          <Separator />
          <div className="flex gap-0 divide-x">
            <a
              href="/dashboard/events"
              className="flex-1 py-2.5 text-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors rounded-bl-xl"
              onClick={() => setOpen(false)}
            >
              View Events
            </a>
            <a
              href="/dashboard"
              className="flex-1 py-2.5 text-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors rounded-br-xl"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
