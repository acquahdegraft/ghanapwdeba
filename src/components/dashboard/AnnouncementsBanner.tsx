import { Megaphone, X, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePublishedAnnouncements } from "@/hooks/useAnnouncements";

const priorityIcons = {
  low: Info,
  normal: Megaphone,
  high: AlertTriangle,
  urgent: AlertCircle,
};

const priorityStyles = {
  low: "bg-muted border-muted-foreground/20",
  normal: "bg-primary/5 border-primary/20",
  high: "bg-warning/10 border-warning/30",
  urgent: "bg-destructive/10 border-destructive/30",
};

export function AnnouncementsBanner() {
  const { data: announcements = [] } = usePublishedAnnouncements();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  if (visibleAnnouncements.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-3 mb-6">
      {visibleAnnouncements.map((announcement) => {
        const Icon = priorityIcons[announcement.priority];
        return (
          <div
            key={announcement.id}
            className={`relative rounded-lg border p-4 ${priorityStyles[announcement.priority]}`}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold">{announcement.title}</h4>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={() => handleDismiss(announcement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
