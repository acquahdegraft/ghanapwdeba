import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { MemberProfile, AdminPayment } from "@/hooks/useAdminData";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface AdminChartsProps {
  members: MemberProfile[];
  payments: AdminPayment[];
}

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#6b7280"];
const STATUS_COLORS = {
  active: "#22c55e",
  pending: "#f59e0b",
  suspended: "#ef4444",
  expired: "#6b7280",
};

export function AdminCharts({ members, payments }: AdminChartsProps) {
  // Calculate membership growth over last 12 months
  const membershipGrowth = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const membersJoined = members.filter((m) => {
        if (!m.created_at) return false;
        const createdDate = parseISO(m.created_at);
        return isWithinInterval(createdDate, { start: monthStart, end: monthEnd });
      }).length;

      // Calculate cumulative total up to this month
      const cumulativeTotal = members.filter((m) => {
        if (!m.created_at) return false;
        const createdDate = parseISO(m.created_at);
        return createdDate <= monthEnd;
      }).length;

      months.push({
        month: format(date, "MMM yy"),
        new: membersJoined,
        total: cumulativeTotal,
      });
    }
    return months;
  }, [members]);

  // Calculate payment trends over last 12 months
  const paymentTrends = useMemo(() => {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthPayments = payments.filter((p) => {
        if (!p.created_at) return false;
        const paymentDate = parseISO(p.created_at);
        return isWithinInterval(paymentDate, { start: monthStart, end: monthEnd }) && p.status === "completed";
      });

      const revenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const count = monthPayments.length;

      months.push({
        month: format(date, "MMM yy"),
        revenue,
        count,
      });
    }
    return months;
  }, [payments]);

  // Calculate membership status distribution
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      active: 0,
      pending: 0,
      suspended: 0,
      expired: 0,
    };

    members.forEach((m) => {
      const status = m.membership_status || "pending";
      distribution[status] = (distribution[status] || 0) + 1;
    });

    return Object.entries(distribution)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || "#6b7280",
      }));
  }, [members]);

  // Calculate regional distribution
  const regionalDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    
    members.forEach((m) => {
      const region = m.region || "Unknown";
      distribution[region] = (distribution[region] || 0) + 1;
    });

    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [members]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Membership Growth Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Membership Growth</CardTitle>
          <CardDescription>New members and cumulative total over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={membershipGrowth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Members"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  name="New Members"
                  stroke="#22c55e"
                  fill="#22c55e20"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue from completed payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `₵${value}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`GHS ${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Status</CardTitle>
          <CardDescription>Distribution by membership status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Regional Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Regional Distribution</CardTitle>
          <CardDescription>Members by region (top 8)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={120} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} name="Members" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
