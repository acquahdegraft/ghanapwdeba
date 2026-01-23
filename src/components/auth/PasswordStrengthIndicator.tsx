import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains a number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const metCount = requirements.filter((req) => req.met).length;
  const strength = metCount === 0 ? 0 : metCount <= 2 ? 1 : metCount <= 4 ? 2 : 3;

  const strengthLabels = ["", "Weak", "Good", "Strong"];
  const strengthColors = [
    "bg-muted",
    "bg-destructive",
    "bg-yellow-500",
    "bg-green-500",
  ];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                strength >= level ? strengthColors[strength] : "bg-muted"
              )}
            />
          ))}
        </div>
        {strength > 0 && (
          <p
            className={cn(
              "text-xs font-medium",
              strength === 1 && "text-destructive",
              strength === 2 && "text-yellow-600 dark:text-yellow-500",
              strength === 3 && "text-green-600 dark:text-green-500"
            )}
          >
            {strengthLabels[strength]} password
          </p>
        )}
      </div>

      {/* Requirements list */}
      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
