import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { EventsWidget } from "@/components/dashboard/EventsWidget";
import { AnnouncementsBanner } from "@/components/dashboard/AnnouncementsBanner";
import { CreditCard, Calendar, FileText, Users, MapPin, Briefcase, Phone, Mail } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePayments } from "@/hooks/usePayments";
import { useMemberDues } from "@/hooks/useMemberDues";
import { format, differenceInDays, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Dashboard() {
  const { data: profile } = useProfile();
  const { data: payments } = usePayments();
  const { duesAmount, membershipTypeName } = useMemberDues();

  const firstName = profile?.full_name?.split(" ")[0] || "Member";
  
  // Calculate membership days remaining
  const membershipExpiry = profile?.membership_expiry_date 
    ? parseISO(profile.membership_expiry_date)
    : null;
  const daysRemaining = membershipExpiry 
    ? Math.max(0, differenceInDays(membershipExpiry, new Date()))
    : 0;
  
  // Get last payment
  const lastPayment = payments?.[0];
  const totalPaid = payments?.reduce((sum, p) => 
    p.status === "completed" ? sum + Number(p.amount) : sum, 0
  ) || 0;

  const memberSince = profile?.created_at 
    ? format(parseISO(profile.created_at), "MMMM yyyy")
    : "Recently";

  const expiryFormatted = membershipExpiry
    ? format(membershipExpiry, "MMMM d, yyyy")
    : "Not set";

  return (
    <DashboardLayout
      title={`Welcome back, ${firstName}!`}
      description="Here's an overview of your membership and recent activity"
    >
      {/* Announcements */}
      <AnnouncementsBanner />

      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Membership Status"
          value={profile?.membership_status === "active" ? "Active" : "Pending"}
          description={membershipExpiry ? `Valid until ${format(membershipExpiry, "MMM d, yyyy")}` : "Awaiting activation"}
          icon={<Users className="h-5 w-5" />}
          variant={profile?.membership_status === "active" ? "success" : "warning"}
        />
        <StatCard
          title="Next Payment Due"
          value={`GHS ${duesAmount.toFixed(2)}`}
          description={membershipExpiry ? `Due in ${daysRemaining} days` : "After activation"}
          icon={<CreditCard className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Total Payments"
          value={payments?.length || 0}
          description="Transactions made"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Amount Paid"
          value={`GHS ${totalPaid.toFixed(2)}`}
          description="All time"
          icon={<FileText className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Payment & Status */}
        <div className="space-y-6">
          <PaymentCard
            membershipType={membershipTypeName}
            amount={duesAmount.toFixed(2)}
            currency="GHS"
            dueDate={expiryFormatted}
            status={lastPayment?.status === "completed" ? "paid" : "pending"}
            paidDate={lastPayment?.payment_date ? format(parseISO(lastPayment.payment_date), "MMM d, yyyy") : undefined}
          />
          {/* Profile Info Card */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-5 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Member"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "M"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold">{profile?.full_name || "Member"}</p>
                <p className="text-sm text-muted-foreground">{membershipTypeName}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile?.phone || "—"}</span>
              </div>
              {profile?.business_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.business_name}</span>
                </div>
              )}
              {(profile?.region || profile?.city) && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {[profile?.city, profile?.region].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Events */}
        <div className="lg:col-span-1">
          <EventsWidget />
        </div>

        {/* Right Column - Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  );
}
