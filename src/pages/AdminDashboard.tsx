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
import { Users, CreditCard, DollarSign, Megaphone, Calendar, BarChart3, FileText } from "lucide-react";

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
        <TabsList className="grid w-full max-w-4xl grid-cols-7">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="dues" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Dues</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline">Announcements</span>
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
      </Tabs>
    </DashboardLayout>
  );
}
