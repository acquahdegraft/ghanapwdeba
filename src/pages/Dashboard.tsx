import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { MembershipStatusCard } from "@/components/dashboard/MembershipStatusCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { CreditCard, Calendar, FileText, Users } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePayments } from "@/hooks/usePayments";
import { format, differenceInDays, parseISO } from "date-fns";

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: payments, isLoading: paymentsLoading } = usePayments();

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
          value="GHS 100"
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
            membershipType={profile?.membership_status === "active" ? "Standard Member" : "Pending Member"}
            amount="100.00"
            currency="GHS"
            dueDate={expiryFormatted}
            status={lastPayment?.status === "completed" ? "paid" : "pending"}
            paidDate={lastPayment?.payment_date ? format(parseISO(lastPayment.payment_date), "MMM d, yyyy") : undefined}
          />
          <MembershipStatusCard
            memberSince={memberSince}
            expiryDate={expiryFormatted}
            membershipLevel={profile?.membership_status === "active" ? "Standard Member" : "Pending Activation"}
            memberNumber={`GPWDEBA-${profile?.id?.slice(0, 8).toUpperCase() || "XXXXXXXX"}`}
            daysRemaining={daysRemaining}
            totalDays={365}
          />
        </div>

        {/* Middle Column - Events */}
        <div className="lg:col-span-1">
          <UpcomingEvents />
        </div>

        {/* Right Column - Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>
    </DashboardLayout>
  );
}
