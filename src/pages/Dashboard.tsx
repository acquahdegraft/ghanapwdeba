import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { MembershipStatusCard } from "@/components/dashboard/MembershipStatusCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { CreditCard, Calendar, FileText, Users } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout
      title="Welcome back, Kwame!"
      description="Here's an overview of your membership and recent activity"
    >
      {/* Stats Row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Membership Status"
          value="Active"
          description="Valid until Dec 31, 2025"
          icon={<Users className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Next Payment Due"
          value="GHS 200"
          description="Due in 348 days"
          icon={<CreditCard className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Events Attended"
          value="12"
          description="This year"
          icon={<Calendar className="h-5 w-5" />}
          trend={{ value: "3 more than last year", positive: true }}
        />
        <StatCard
          title="Resources Downloaded"
          value="24"
          description="Total downloads"
          icon={<FileText className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Payment & Status */}
        <div className="space-y-6">
          <PaymentCard
            membershipType="Standard Member"
            amount="200.00"
            currency="GHS"
            dueDate="Dec 31, 2025"
            status="paid"
            paidDate="Jan 15, 2025"
          />
          <MembershipStatusCard
            memberSince="March 2020"
            expiryDate="December 31, 2025"
            membershipLevel="Standard Member"
            memberNumber="GPWDEBA-2020-0458"
            daysRemaining={348}
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
