import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersTable } from "@/components/admin/MembersTable";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { DuesManagement } from "@/components/admin/DuesManagement";
import { AnnouncementsManagement } from "@/components/admin/AnnouncementsManagement";
import { EventsManagement } from "@/components/admin/EventsManagement";
import { ResourcesManagement } from "@/components/admin/ResourcesManagement";
import { useAllMembers, useAllPayments } from "@/hooks/useAdminData";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, DollarSign, Megaphone, Calendar, BarChart3, FileText, Shield, ScrollText } from "lucide-react";

interface AdminTab {
  value: string;
  label: string;
  icon: React.ReactNode;
  permission: string | null; // null = always visible for any admin
}

const ALL_TABS: AdminTab[] = [
  { value: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, permission: "view_analytics" },
  { value: "members", label: "Members", icon: <Users className="h-4 w-4" />, permission: "manage_members" },
  { value: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" />, permission: "manage_payments" },
  { value: "dues", label: "Dues", icon: <DollarSign className="h-4 w-4" />, permission: "manage_dues" },
  { value: "events", label: "Events", icon: <Calendar className="h-4 w-4" />, permission: "manage_content" },
  { value: "resources", label: "Resources", icon: <FileText className="h-4 w-4" />, permission: "manage_content" },
  { value: "announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" />, permission: "manage_content" },
  { value: "roles", label: "Roles & Permissions", icon: <Shield className="h-4 w-4" />, permission: "manage_roles" },
];

export default function AdminDashboard() {
  const { data: members = [], isLoading: membersLoading } = useAllMembers();
  const { data: payments = [], isLoading: paymentsLoading } = useAllPayments();
  const { data: userPerms, isLoading: permsLoading } = useCurrentUserPermissions();

  const visibleTabs = useMemo(() => {
    if (!userPerms) return [];
    // Super admins see everything
    if (userPerms.isSuperAdmin) return ALL_TABS;
    return ALL_TABS.filter(
      (tab) => tab.permission === null || userPerms.hasPermission(tab.permission)
    );
  }, [userPerms]);

  const defaultTab = visibleTabs[0]?.value ?? "analytics";

  if (permsLoading) {
    return (
      <DashboardLayout title="Admin Dashboard" description="Loading permissions...">
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      description="Manage members, payments, dues, events, and announcements"
    >
      {/* Stats Overview + Payment Logs link */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <AdminStats members={members} payments={payments} />
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
          <Link to="/dashboard/admin/payment-logs">
            <ScrollText className="h-4 w-4" />
            Payment Logs
          </Link>
        </Button>
      </div>

      {visibleTabs.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <Shield className="mx-auto mb-3 h-10 w-10 opacity-50" />
          <p className="text-lg font-medium">No permissions assigned</p>
          <p className="text-sm">Contact a super admin to get access to admin features.</p>
        </div>
      ) : (
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 px-3 py-2">
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="analytics">
            <AdminCharts members={members} payments={payments} />
          </TabsContent>

          <TabsContent value="members">
            <MembersTable members={members} isLoading={membersLoading} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTable payments={payments} isLoading={paymentsLoading} />
          </TabsContent>

          <TabsContent value="dues">
            <DuesManagement />
          </TabsContent>

          <TabsContent value="events">
            <EventsManagement />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesManagement />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManagement />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}
