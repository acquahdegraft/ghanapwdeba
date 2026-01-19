import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, CheckCircle, Clock } from "lucide-react";
import { MemberProfile, AdminPayment } from "@/hooks/useAdminData";

interface AdminStatsProps {
  members: MemberProfile[];
  payments: AdminPayment[];
}

export function AdminStats({ members, payments }: AdminStatsProps) {
  const totalMembers = members?.length || 0;
  const activeMembers = members?.filter((m) => m.membership_status === "active").length || 0;
  const pendingMembers = members?.filter((m) => m.membership_status === "pending").length || 0;
  
  const totalPayments = payments?.length || 0;
  const completedPayments = payments?.filter((p) => p.status === "completed").length || 0;
  const pendingPayments = payments?.filter((p) => p.status === "pending").length || 0;
  
  const totalRevenue = payments
    ?.filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      description: `${activeMembers} active, ${pendingMembers} pending`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Members",
      value: activeMembers,
      description: `${((activeMembers / totalMembers) * 100 || 0).toFixed(0)}% of total`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Payments",
      value: totalPayments,
      description: `${completedPayments} completed, ${pendingPayments} pending`,
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Revenue",
      value: `GHS ${totalRevenue.toLocaleString()}`,
      description: "From completed payments",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
