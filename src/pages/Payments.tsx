import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { PaymentHistoryTable } from "@/components/dashboard/PaymentHistoryTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { CreditCard, TrendingUp, Calendar, Receipt } from "lucide-react";

export default function Payments() {
  return (
    <DashboardLayout
      title="Payments & Dues"
      description="Manage your membership payments and view transaction history"
    >
      {/* Stats Overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Paid (2025)"
          value="GHS 200.00"
          description="Annual membership dues"
          icon={<CreditCard className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total Paid (All Time)"
          value="GHS 640.00"
          description="Since 2020"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Next Due Date"
          value="Dec 31, 2025"
          description="348 days remaining"
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Transactions"
          value="8"
          description="Total payments made"
          icon={<Receipt className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      {/* Payment Cards Grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* Current Year Payment */}
        <PaymentCard
          membershipType="Standard Member"
          amount="200.00"
          currency="GHS"
          dueDate="Dec 31, 2025"
          status="paid"
          paidDate="Jan 15, 2025"
        />

        {/* Upcoming Payment */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 font-semibold">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <span className="text-lg font-bold text-warning">M</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">MTN Mobile Money</p>
                <p className="text-xs text-muted-foreground">**** 4521</p>
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Primary
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <span className="text-lg font-bold text-destructive">V</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Vodafone Cash</p>
                <p className="text-xs text-muted-foreground">**** 7832</p>
              </div>
            </div>
            <button className="w-full rounded-lg border border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              + Add Payment Method
            </button>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 font-semibold">Membership Fee Structure</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Standard Member</p>
                <p className="text-xs text-muted-foreground">Annual fee</p>
              </div>
              <p className="text-lg font-bold">GHS 200</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Premium Member</p>
                <p className="text-xs text-muted-foreground">Annual fee</p>
              </div>
              <p className="text-lg font-bold">GHS 500</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Corporate Member</p>
                <p className="text-xs text-muted-foreground">Annual fee</p>
              </div>
              <p className="text-lg font-bold">GHS 1,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <PaymentHistoryTable />
    </DashboardLayout>
  );
}
