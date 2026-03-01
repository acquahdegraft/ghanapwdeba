import { useProfile } from "@/hooks/useProfile";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getProfileCompletion, getMissingFields } from "@/lib/profileCompletion";

export function ProfileCompletionCard() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  if (!profile) return null;

  const percentage = getProfileCompletion(profile as unknown as Record<string, unknown>);
  const missing = getMissingFields(profile as unknown as Record<string, unknown>);
  const isComplete = percentage === 100;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Profile Completion</h3>
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <span className="text-sm font-bold text-primary">{percentage}%</span>
        )}
      </div>

      <Progress value={percentage} className="h-2 mb-3" />

      <p className="text-xs text-muted-foreground mb-3">
        {isComplete
          ? "Your registration profile is complete!"
          : `${20 - missing.length} of 20 fields completed`}
      </p>

      {!isComplete && (
        <>
          <div className="mb-3 space-y-1">
            {missing.slice(0, 3).map((label) => (
              <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 text-warning shrink-0" />
                {label}
              </div>
            ))}
            {missing.length > 3 && (
              <p className="text-xs text-muted-foreground pl-5">
                +{missing.length - 3} more fields
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/profile")}
          >
            Complete Profile
          </Button>
        </>
      )}
    </div>
  );
}
