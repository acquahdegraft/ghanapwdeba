import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersTable } from "@/components/admin/MembersTable";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { AdminStats } from "@/components/admin/AdminStats";
import { DuesManagement } from "@/components/admin/DuesManagement";
import { AnnouncementsManagement } from "@/components/admin/AnnouncementsManagement";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useAllMembers, useAllPayments } from "@/hooks/useAdminData";
import { Users, CreditCard, DollarSign, Megaphone } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useAdminRole();
  const { data: members = [], isLoading: membersLoading } = useAllMembers();
  const { data: payments = [], isLoading: paymentsLoading } = useAllPayments();

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, navigate]);

  if (adminLoading) {
    return (
      <DashboardLayout title="Admin Dashboard" description="Loading...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      description="Manage members, payments, dues, and announcements"
    >
      {/* Stats Overview */}
      <div className="mb-8">
        <AdminStats members={members} payments={payments} />
      </div>

      {/* Tabs for all admin sections */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="dues" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Dues
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTable members={members} isLoading={membersLoading} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTable payments={payments} isLoading={paymentsLoading} />
        </TabsContent>

        <TabsContent value="dues">
          <DuesManagement />
        </TabsContent>

        <TabsContent value="announcements">
          <AnnouncementsManagement />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
