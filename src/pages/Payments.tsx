import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PaymentCard } from "@/components/dashboard/PaymentCard";
import { PaymentHistoryTable } from "@/components/dashboard/PaymentHistoryTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { CreditCard, TrendingUp, Calendar, Receipt } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { usePayments } from "@/hooks/usePayments";
import { format, parseISO, differenceInDays } from "date-fns";

export default function Payments() {
  const { data: profile } = useProfile();
  const { data: payments } = usePayments();

  const totalPaidThisYear = payments?.reduce((sum, p) => {
    if (p.status === "completed" && p.payment_date) {
      const paymentYear = new Date(p.payment_date).getFullYear();
      if (paymentYear === new Date().getFullYear()) {
        return sum + Number(p.amount);
      }
    }
    return sum;
  }, 0) || 0;

  const totalPaidAllTime = payments?.reduce((sum, p) => 
    p.status === "completed" ? sum + Number(p.amount) : sum, 0
  ) || 0;

  const membershipExpiry = profile?.membership_expiry_date 
    ? parseISO(profile.membership_expiry_date)
    : null;
  const daysRemaining = membershipExpiry 
    ? Math.max(0, differenceInDays(membershipExpiry, new Date()))
    : 0;

  const expiryFormatted = membershipExpiry
    ? format(membershipExpiry, "MMM d, yyyy")
    : "Not set";

  const lastPayment = payments?.[0];

  return (
    <DashboardLayout
      title="Payments & Dues"
      description="Manage your membership payments and view transaction history"
    >
      {/* Stats Overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={`Total Paid (${new Date().getFullYear()})`}
          value={`GHS ${totalPaidThisYear.toFixed(2)}`}
          description="This year"
          icon={<CreditCard className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total Paid (All Time)"
          value={`GHS ${totalPaidAllTime.toFixed(2)}`}
          description="Since joining"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Next Due Date"
          value={expiryFormatted}
          description={membershipExpiry ? `${daysRemaining} days remaining` : "Pending activation"}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Transactions"
          value={payments?.length || 0}
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
          amount="100.00"
          currency="GHS"
          dueDate={expiryFormatted}
          status={lastPayment?.status === "completed" ? "paid" : "pending"}
          paidDate={lastPayment?.payment_date ? format(parseISO(lastPayment.payment_date), "MMM d, yyyy") : undefined}
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
                <p className="text-xs text-muted-foreground">Recommended</p>
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                Available
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <span className="text-lg font-bold text-destructive">V</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Vodafone Cash</p>
                <p className="text-xs text-muted-foreground">Coming soon</p>
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
              <p className="text-lg font-bold">GHS 100</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Premium Member</p>
                <p className="text-xs text-muted-foreground">Annual fee</p>
              </div>
              <p className="text-lg font-bold">GHS 250</p>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">Corporate Member</p>
                <p className="text-xs text-muted-foreground">Annual fee</p>
              </div>
              <p className="text-lg font-bold">GHS 500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <PaymentHistoryTable />
    </DashboardLayout>
  );
}
