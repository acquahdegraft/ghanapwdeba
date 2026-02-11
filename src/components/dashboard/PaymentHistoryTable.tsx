import { CheckCircle, Download, ArrowUpRight, Clock, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePayments, Payment } from "@/hooks/usePayments";
import { usePaymentSync } from "@/hooks/usePaymentSync";
import { format, parseISO } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex items-center gap-1.5" role="status">
          <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
          <span className="text-sm font-medium text-success">Completed</span>
        </div>
      );
    case "pending":
      return (
        <div className="flex items-center gap-1.5" role="status">
          <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
          <span className="text-sm font-medium text-warning">Pending</span>
        </div>
      );
    case "failed":
      return (
        <div className="flex items-center gap-1.5" role="status">
          <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
          <span className="text-sm font-medium text-destructive">Failed</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5" role="status">
          <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">{status}</span>
        </div>
      );
  }
}

function formatPaymentDate(payment: Payment): string {
  if (payment.payment_date) {
    return format(parseISO(payment.payment_date), "MMM d, yyyy");
  }
  return format(parseISO(payment.created_at), "MMM d, yyyy");
}

function formatPaymentType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PaymentHistoryTable() {
  const { data: payments, isLoading } = usePayments();
  const { isSyncing } = usePaymentSync(payments);

  const handleExport = () => {
    if (!payments?.length) return;
    const headers = ["Reference", "Date", "Description", "Amount (GHS)", "Method", "Status"];
    const rows = payments.map((p) => [
      p.transaction_reference || p.id.slice(0, 13),
      formatPaymentDate(p),
      formatPaymentType(p.payment_type),
      p.amount.toFixed(2),
      p.payment_method || "N/A",
      p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border bg-card" role="region" aria-label="Payment History">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="font-semibold" id="payment-history-title">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            Your recent transactions and payment records
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Syncing with payment provider...</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!payments?.length}
            aria-label="Export payment history as CSV"
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" aria-labelledby="payment-history-title">
          <thead>
            <tr className="border-b bg-muted/50">
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transaction
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Method
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  <span role="status">Loading payment history...</span>
                </td>
              </tr>
            ) : !payments?.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No payment records found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <p className="font-medium">{formatPaymentType(payment.payment_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.transaction_reference || payment.id.slice(0, 13)}
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {formatPaymentDate(payment)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    GHS {payment.amount.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {payment.payment_method || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" aria-label={`View details for ${formatPaymentType(payment.payment_type)}`}>
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t px-6 py-4" aria-live="polite">
        <p className="text-center text-sm text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `Showing ${payments?.length || 0} transaction${(payments?.length || 0) !== 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  );
}
