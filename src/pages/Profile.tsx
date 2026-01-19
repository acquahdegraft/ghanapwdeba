import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { MembershipCard } from "@/components/profile/MembershipCard";

export default function Profile() {
  return (
    <DashboardLayout
      title="My Profile"
      description="Manage your personal information and membership details."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileForm />
        </div>
        <div>
          <MembershipCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
