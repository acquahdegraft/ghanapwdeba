import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUpdateDirectoryVisibility } from "@/hooks/useDirectory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Shield,
  Bell,
  Eye,
  Trash2,
  Download,
  Loader2,
  Lock,
  Calendar,
  Megaphone,
  Receipt,
  AlertTriangle,
  Mail,
  Phone,
  KeyRound,
  Monitor,
  LogOut,
  Globe,
} from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { format, parseISO } from "date-fns";
import { useState as useReactState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ── Notification Preferences Section ──────────────────────────────
function NotificationsSection() {
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

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    onError: (error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleToggle = async (key: string, checked: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: checked }));
    try {
      await updateMutation.mutateAsync({ key, value: checked });
      toast({
        title: "Updated",
        description: `${checked ? "Enabled" : "Disabled"} ${key.replace("notify_", "").replace(/_/g, " ")} notifications`,
      });
    } catch {
      setPreferences((prev) => ({ ...prev, [key]: !checked }));
    }
  };

  const settings = [
    { key: "notify_event_reminders", label: "Event Reminders", desc: "Email reminders before registered events", icon: <Calendar className="h-5 w-5" /> },
    { key: "notify_announcements", label: "Announcements", desc: "Important announcements and updates", icon: <Megaphone className="h-5 w-5" /> },
    { key: "notify_payment_receipts", label: "Payment Receipts", desc: "Email receipts for your payments", icon: <Receipt className="h-5 w-5" /> },
  ];

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto my-8" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Email Notifications</CardTitle>
        <CardDescription>Choose which emails you receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {settings.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-muted-foreground">{s.icon}</div>
              <div>
                <Label htmlFor={s.key} className="font-medium cursor-pointer">{s.label}</Label>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
            <Switch
              id={s.key}
              checked={preferences[s.key]}
              onCheckedChange={(c) => handleToggle(s.key, c)}
              disabled={updateMutation.isPending}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Security Section (Password Change) ────────────────────────────
function SecuritySection() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Verify current password
      const email = (await supabase.auth.getUser()).data.user?.email;
      if (!email) throw new Error("Unable to verify session");
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInErr) throw new Error("Current password is incorrect");

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="current-pw">Current Password</Label>
          <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pw">New Password</Label>
          <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          {newPassword && <PasswordStrengthIndicator password={newPassword} />}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pw">Confirm New Password</Label>
          <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
        </div>
        <Button onClick={handleChangePassword} disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : "Update Password"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Sessions Management Section ───────────────────────────────────
function SessionsSection() {
  const { user, signOut } = useAuth();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const lastSignIn = user?.last_sign_in_at
    ? format(parseISO(user.last_sign_in_at), "MMMM d, yyyy 'at' h:mm a")
    : "Unknown";

  const createdAt = user?.created_at
    ? format(parseISO(user.created_at), "MMMM d, yyyy")
    : "Unknown";

  const currentProvider = user?.app_metadata?.provider || "email";

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      toast({ title: "Done", description: "All other sessions have been signed out." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRevokingOthers(false);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast({ title: "Signed Out", description: "All sessions have been revoked. You will be redirected." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Active Sessions</CardTitle>
        <CardDescription>Manage your login sessions across devices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Session */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Current Session</span>
            </div>
            <Badge variant="default" className="text-xs">Active</Badge>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Sign-in method: </span>
              <span className="font-medium capitalize">{currentProvider}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last sign-in: </span>
              <span className="font-medium">{lastSignIn}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Account created: </span>
              <span className="font-medium">{createdAt}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Email: </span>
              <span className="font-medium">{user?.email || "—"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Session Actions */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="font-medium text-sm">Sign out other devices</h4>
              <p className="text-sm text-muted-foreground">Revoke all sessions except this one</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out Others
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out other devices?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out of all other browsers and devices. Your current session will remain active.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRevokeOthers} disabled={revokingOthers}>
                    {revokingOthers ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Revoking…</> : "Yes, sign out others"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="font-medium text-sm">Sign out everywhere</h4>
              <p className="text-sm text-muted-foreground">Revoke all sessions including this one</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Globe className="mr-2 h-4 w-4" /> Sign Out Everywhere
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out everywhere?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will sign you out of all devices, including this one. You will need to log in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRevokeAll}
                    disabled={revokingAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {revokingAll ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing out…</> : "Yes, sign out everywhere"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Privacy Section ───────────────────────────────────────────────
function PrivacySection() {
  const { data: profile, isLoading } = useProfile();
  const { updateVisibility } = useUpdateDirectoryVisibility();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) setIsPublic((profile as any).is_public_directory ?? true);
  }, [profile]);

  const handleToggle = async (checked: boolean) => {
    setIsPublic(checked);
    try {
      await updateVisibility(checked);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Updated", description: checked ? "Your profile is now visible in the directory." : "Your profile is hidden from the directory." });
    } catch {
      setIsPublic(!checked);
      toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
    }
  };

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto my-8" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Privacy</CardTitle>
        <CardDescription>Control who can see your information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="dir-vis" className="font-medium cursor-pointer">Directory Visibility</Label>
            <p className="text-sm text-muted-foreground">Show your profile in the member directory</p>
          </div>
          <Switch id="dir-vis" checked={isPublic} onCheckedChange={handleToggle} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Account Overview Section ──────────────────────────────────────
function AccountSection() {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto my-8" />;

  const memberSince = profile?.created_at ? format(parseISO(profile.created_at), "MMMM d, yyyy") : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account Overview</CardTitle>
        <CardDescription>Your account details at a glance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{profile?.phone || "Not set"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{memberSince}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={profile?.membership_status === "active" ? "default" : "secondary"}>
                {profile?.membership_status || "pending"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Data Export Section ────────────────────────────────────────────
function DataExportSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const { data: payments } = await supabase.from("payments").select("*").eq("user_id", user.id);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile || {},
        payments: payments || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Downloaded", description: "Your data has been exported." });
    } catch {
      toast({ title: "Error", description: "Failed to export data.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Export Your Data</CardTitle>
        <CardDescription>Download a copy of your personal data</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will download your profile information and payment history as a JSON file.
        </p>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting…</> : <><Download className="mr-2 h-4 w-4" /> Download My Data</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Danger Zone (Delete Account) ──────────────────────────────────
function DangerZoneSection() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user || confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      // Delete profile (cascade will handle related data via RLS)
      const { error } = await supabase.from("profiles").delete().eq("user_id", user.id);
      if (error) throw error;

      await signOut();
      navigate("/");
      toast({ title: "Account Deleted", description: "Your account data has been removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </CardTitle>
        <CardDescription>Irreversible actions that affect your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">Delete Account</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your profile and all associated data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">This will permanently delete your profile, payment history, and all associated data. This action cannot be undone.</span>
                  <span className="block font-medium">Type <strong>DELETE</strong> to confirm:</span>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    className="mt-2"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</> : "Yes, delete my account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Settings Page ────────────────────────────────────────────
export default function Settings() {
  return (
    <DashboardLayout title="Settings" description="Manage your account, security, and preferences.">
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid lg:grid-cols-4">
          <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4 hidden sm:inline" /> Account</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4 hidden sm:inline" /> Security</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4 hidden sm:inline" /> Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><Eye className="h-4 w-4 hidden sm:inline" /> Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <AccountSection />
          <DataExportSection />
          <DangerZoneSection />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySection />
          <SessionsSection />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <PrivacySection />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
