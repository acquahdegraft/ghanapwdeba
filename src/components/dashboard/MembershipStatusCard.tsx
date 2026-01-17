import { Shield, Star, Calendar, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MembershipStatusCardProps {
  memberSince: string;
  expiryDate: string;
  membershipLevel: string;
  memberNumber: string;
  daysRemaining: number;
  totalDays: number;
}

export function MembershipStatusCard({
  memberSince,
  expiryDate,
  membershipLevel,
  memberNumber,
  daysRemaining,
  totalDays,
}: MembershipStatusCardProps) {
  const progressPercentage = Math.round(
    ((totalDays - daysRemaining) / totalDays) * 100
  );

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-semibold">Membership Status</h3>
        <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-medium text-success">
          <Shield className="h-3.5 w-3.5" />
          Active
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Award className="h-8 w-8" />
        </div>
        <div>
          <p className="text-lg font-bold">{membershipLevel}</p>
          <p className="text-sm text-muted-foreground">Member #{memberNumber}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Member Since
          </span>
          <span className="font-medium">{memberSince}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            Valid Until
          </span>
          <span className="font-medium">{expiryDate}</span>
        </div>

        <div className="pt-2">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">Membership Period</span>
            <span className="font-medium">{daysRemaining} days remaining</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>
    </div>
  );
}
