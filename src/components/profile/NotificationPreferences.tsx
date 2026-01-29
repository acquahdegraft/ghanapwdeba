import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Calendar, Megaphone, Receipt, Loader2 } from "lucide-react";

interface NotificationSetting {
  key: "notify_event_reminders" | "notify_announcements" | "notify_payment_receipts";
  label: string;
  description: string;
  icon: React.ReactNode;
}

const notificationSettings: NotificationSetting[] = [
  {
    key: "notify_event_reminders",
    label: "Event Reminders",
    description: "Receive email reminders before events you've registered for",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    key: "notify_announcements",
    label: "Announcements",
    description: "Get notified about important announcements and updates",
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    key: "notify_payment_receipts",
    label: "Payment Receipts",
    description: "Receive email receipts for your payments",
    icon: <Receipt className="h-5 w-5" />,
  },
];

export function NotificationPreferences() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    notify_event_reminders: true,
    notify_announcements: true,
    notify_payment_receipts: true,
  });

  useEffect(() => {
    if (profile) {
      setPreferences({
        notify_event_reminders: (profile as any).notify_event_reminders ?? true,
        notify_announcements: (profile as any).notify_announcements ?? true,
        notify_payment_receipts: (profile as any).notify_payment_receipts ?? true,
      });
    }
  }, [profile]);

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = async (key: string, checked: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: checked }));
    
    try {
      await updatePreferenceMutation.mutateAsync({ key, value: checked });
      toast({
        title: "Preferences Updated",
        description: `${checked ? "Enabled" : "Disabled"} ${key.replace("notify_", "").replace(/_/g, " ")} notifications`,
      });
    } catch {
      // Revert on error
      setPreferences((prev) => ({ ...prev, [key]: !checked }));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which email notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notificationSettings.map((setting) => (
          <div
            key={setting.key}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">{setting.icon}</div>
              <div className="space-y-1">
                <Label
                  htmlFor={setting.key}
                  className="font-medium cursor-pointer"
                >
                  {setting.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            </div>
            <Switch
              id={setting.key}
              checked={preferences[setting.key]}
              onCheckedChange={(checked) => handleToggle(setting.key, checked)}
              disabled={updatePreferenceMutation.isPending}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
