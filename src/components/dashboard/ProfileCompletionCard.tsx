import { useProfile } from "@/hooks/useProfile";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PROFILE_FIELDS = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "disability_type", label: "Disability Type" },
  { key: "business_name", label: "Business Name" },
  { key: "business_type", label: "Business Type" },
  { key: "business_address", label: "Business Address" },
  { key: "mailing_address", label: "Mailing Address" },
  { key: "region", label: "Region" },
  { key: "city", label: "District" },
  { key: "education_level", label: "Education Level" },
  { key: "special_skills", label: "Special Skills" },
  { key: "bir_registration_number", label: "BIR Registration" },
  { key: "nis_registration_number", label: "NIS Registration" },
  { key: "vat_registration_number", label: "VAT Registration" },
  { key: "num_permanent_staff", label: "Permanent Staff" },
  { key: "num_temporary_staff", label: "Temporary Staff" },
  { key: "bank_name", label: "Bank Name" },
  { key: "bank_branch", label: "Bank Branch" },
] as const;

export function ProfileCompletionCard() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  if (!profile) return null;

  const filled = PROFILE_FIELDS.filter((f) => {
    const val = (profile as unknown as Record<string, unknown>)[f.key];
    return val !== null && val !== undefined && val !== "";
  });

  const percentage = Math.round((filled.length / PROFILE_FIELDS.length) * 100);
  const missing = PROFILE_FIELDS.filter((f) => {
    const val = (profile as unknown as Record<string, unknown>)[f.key];
    return val === null || val === undefined || val === "";
  });

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
          : `${filled.length} of ${PROFILE_FIELDS.length} fields completed`}
      </p>

      {!isComplete && (
        <>
          <div className="mb-3 space-y-1">
            {missing.slice(0, 3).map((f) => (
              <div key={f.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 text-warning shrink-0" />
                {f.label}
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
