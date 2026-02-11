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
import { Users, CreditCard, DollarSign, Megaphone, Calendar, BarChart3, FileText, Shield } from "lucide-react";

export default function AdminDashboard() {
  // Admin access is enforced at route level via ProtectedRoute requireAdmin
  // These hooks are only for data fetching, not access control
  const { data: members = [], isLoading: membersLoading } = useAllMembers();
  const { data: payments = [], isLoading: paymentsLoading } = useAllPayments();

  return (
    <DashboardLayout
      title="Admin Dashboard"
      description="Manage members, payments, dues, events, and announcements"
    >
      {/* Stats Overview */}
      <div className="mb-8">
        <AdminStats members={members} payments={payments} />
      </div>

      {/* Tabs for all admin sections */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="analytics" className="flex items-center gap-2 px-3 py-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2 px-3 py-2">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2 px-3 py-2">
            <CreditCard className="h-4 w-4" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger value="dues" className="flex items-center gap-2 px-3 py-2">
            <DollarSign className="h-4 w-4" />
            <span>Dues</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 px-3 py-2">
            <Calendar className="h-4 w-4" />
            <span>Events</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2 px-3 py-2">
            <FileText className="h-4 w-4" />
            <span>Resources</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2 px-3 py-2">
            <Megaphone className="h-4 w-4" />
            <span>Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2 px-3 py-2">
            <Shield className="h-4 w-4" />
            <span>Roles & Permissions</span>
          </TabsTrigger>
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
    </DashboardLayout>
  );
}
