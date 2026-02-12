import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { useCoordinatorRole, useCoordinatorMembers, useCoordinatorPayments } from "@/hooks/useCoordinatorData";
import { Users, CreditCard, UserCheck, UserX, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

export default function CoordinatorDashboard() {
  const { data: coordRole, isLoading: roleLoading } = useCoordinatorRole();
  const { data: members = [], isLoading: membersLoading } = useCoordinatorMembers();
  const { data: payments = [], isLoading: paymentsLoading } = useCoordinatorPayments();

  const activeMembers = members.filter((m) => m.membership_status === "active");
  const pendingMembers = members.filter((m) => m.membership_status === "pending");
  const totalPayments = payments.reduce(
    (sum, p) => (p.status === "completed" ? sum + Number(p.amount) : sum),
    0
  );

  const scopeLabel = coordRole?.role === "regional_coordinator"
    ? coordRole.region || "Unknown Region"
    : coordRole?.district || "Unknown District";

  const roleLabel = coordRole?.role === "regional_coordinator"
    ? "Regional Coordinator"
    : "District Coordinator";

  if (roleLoading) {
    return (
      <DashboardLayout title="Coordinator Dashboard" description="Loading...">
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!coordRole) {
    return (
      <DashboardLayout title="Coordinator Dashboard" description="You don't have coordinator access">
        <div className="py-12 text-center text-muted-foreground">
          <MapPin className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="text-lg font-medium">No coordinator role assigned</p>
          <p className="text-sm">Contact a super admin to get coordinator access.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Coordinator Dashboard"
      description={`${roleLabel} — ${scopeLabel}`}
    >
      {/* Stats Overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={members.length}
          description={`In ${scopeLabel}`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Active Members"
          value={activeMembers.length}
          description="With active membership"
          icon={<UserCheck className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Pending Members"
          value={pendingMembers.length}
          description="Awaiting activation"
          icon={<UserX className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Total Collected"
          value={`GHS ${totalPayments.toFixed(2)}`}
          description="Completed payments"
          icon={<CreditCard className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      {/* Members Table */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4">
          <h3 className="font-semibold">Members in {scopeLabel}</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? "s" : ""} under your coordination
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {coordRole.role === "regional_coordinator" ? "City/District" : "Region"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {membersLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Loading members...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No members found in your area.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      {member.full_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {member.email || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {coordRole.role === "regional_coordinator"
                        ? member.city || "—"
                        : member.region || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {member.business_name || member.business_type || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge
                        variant={
                          member.membership_status === "active"
                            ? "default"
                            : member.membership_status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {member.membership_status || "unknown"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {member.created_at
                        ? format(parseISO(member.created_at), "MMM d, yyyy")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-6 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Showing {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="mt-6 rounded-xl border bg-card">
          <div className="border-b px-6 py-4">
            <h3 className="font-semibold">Recent Payments</h3>
            <p className="text-sm text-muted-foreground">
              Latest transactions from members in {scopeLabel}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.slice(0, 20).map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono">
                      {p.transaction_reference || p.id.slice(0, 13)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {p.payment_date
                        ? format(parseISO(p.payment_date), "MMM d, yyyy")
                        : format(parseISO(p.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      GHS {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge
                        variant={
                          p.status === "completed"
                            ? "default"
                            : p.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
