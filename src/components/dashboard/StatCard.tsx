import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "success" | "warning" | "accent";
}

const variantStyles = {
  default: "bg-card",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
  accent: "bg-accent/5 border-accent/30",
};

const iconStyles = {
  default: "bg-secondary text-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  accent: "bg-accent/20 text-accent-foreground",
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 transition-all duration-200 hover:shadow-md",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg",
            iconStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
