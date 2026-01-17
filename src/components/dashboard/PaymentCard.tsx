import { CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaymentCardProps {
  membershipType: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  paidDate?: string;
}

const statusConfig = {
  paid: {
    icon: CheckCircle,
    label: "Paid",
    className: "badge-success",
    iconClass: "text-success",
  },
  pending: {
    icon: Clock,
    label: "Payment Due",
    className: "badge-warning",
    iconClass: "text-warning",
  },
  overdue: {
    icon: AlertTriangle,
    label: "Overdue",
    className: "badge-destructive",
    iconClass: "text-destructive",
  },
};

export function PaymentCard({
  membershipType,
  amount,
  currency,
  dueDate,
  status,
  paidDate,
}: PaymentCardProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="gradient-primary px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">
              Membership Dues
            </p>
            <p className="text-2xl font-bold text-primary-foreground">
              {currency} {amount}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/10">
            <CreditCard className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
              config.className
            )}
          >
            <StatusIcon className={cn("h-3.5 w-3.5", config.iconClass)} />
            {config.label}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Membership Type</span>
            <span className="font-medium">{membershipType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date</span>
            <span className="font-medium">{dueDate}</span>
          </div>
          {paidDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid On</span>
              <span className="font-medium">{paidDate}</span>
            </div>
          )}
        </div>

        {status !== "paid" && (
          <div className="mt-6">
            <Button className="w-full gradient-accent border-0 text-accent-foreground font-semibold">
              Pay Now
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Mobile Money • Bank Transfer
            </p>
          </div>
        )}

        {status === "paid" && (
          <div className="mt-6">
            <Button variant="outline" className="w-full">
              Download Receipt
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
