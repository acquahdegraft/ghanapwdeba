import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { MembershipCard } from "@/components/profile/MembershipCard";
import { MembershipTypeSelector } from "@/components/profile/MembershipTypeSelector";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";

export default function Profile() {
  return (
    <DashboardLayout
      title="My Profile"
      description="Manage your personal information and membership details."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <ProfileForm />
          <MembershipTypeSelector />
          <PasswordChangeForm />
          <NotificationPreferences />
        </div>
        <div>
          <MembershipCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
