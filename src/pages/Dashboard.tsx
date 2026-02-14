import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { AnnouncementsBanner } from "@/components/dashboard/AnnouncementsBanner";
import { Calendar, MapPin, Briefcase, Phone, Mail, Shield, Star, Award, Building2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useMemberDues } from "@/hooks/useMemberDues";
import { format, differenceInDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { membershipTypeName } = useMemberDues();

  const firstName = profile?.full_name?.split(" ")[0] || "Member";

  const membershipExpiry = profile?.membership_expiry_date
    ? parseISO(profile.membership_expiry_date)
    : null;
  const membershipStart = profile?.membership_start_date
    ? parseISO(profile.membership_start_date)
    : null;
  const daysRemaining = membershipExpiry
    ? Math.max(0, differenceInDays(membershipExpiry, new Date()))
    : 0;
  const totalDays = membershipExpiry && membershipStart
    ? Math.max(1, differenceInDays(membershipExpiry, membershipStart))
    : 365;
  const progressPercentage = Math.round(((totalDays - daysRemaining) / totalDays) * 100);

  const memberSince = profile?.created_at
    ? format(parseISO(profile.created_at), "MMMM yyyy")
    : "Recently";

  const expiryFormatted = membershipExpiry
    ? format(membershipExpiry, "MMMM d, yyyy")
    : "Not set";

  const isActive = profile?.membership_status === "active";

  return (
    <DashboardLayout
      title={`Welcome back, ${firstName}!`}
      description="Your membership profile and quick actions"
    >
      <AnnouncementsBanner />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile & Membership Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="gradient-primary px-6 py-8">
              <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-4 border-primary-foreground/20">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Member"} />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl font-bold">
                    {profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "M"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-primary-foreground">{profile?.full_name || "Member"}</h2>
                  <p className="text-primary-foreground/80">{membershipTypeName}</p>
                  <Badge variant={isActive ? "default" : "secondary"} className="mt-2">
                    <Shield className="mr-1 h-3 w-3" />
                    {isActive ? "Active Member" : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{profile?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{profile?.phone || "—"}</span>
              </div>
              {profile?.business_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{profile.business_name}</span>
                </div>
              )}
              {profile?.business_type && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{profile.business_type}</span>
                </div>
              )}
              {(profile?.region || profile?.city) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    {[profile?.city, profile?.region].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Member since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Membership Status Card */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold">Membership Status</h3>
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
                <Shield className="h-3.5 w-3.5" />
                {isActive ? "Active" : "Pending"}
              </div>
            </div>

            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-bold">{membershipTypeName}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.disability_type ? `Type: ${profile.disability_type}` : ""}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </span>
                <span className="font-medium">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  Valid Until
                </span>
                <span className="font-medium">{expiryFormatted}</span>
              </div>
              <div className="pt-2">
                <div className="mb-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">Membership Period</span>
                  <span className="font-medium">{daysRemaining} days remaining</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Column */}
        <div>
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  );
}
