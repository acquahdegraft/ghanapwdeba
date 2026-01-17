import { CheckCircle, Download, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  date: string;
  description: string;
  amount: string;
  method: string;
  status: "completed" | "pending" | "failed";
}

const payments: Payment[] = [
  {
    id: "PAY-2025-001",
    date: "Jan 15, 2025",
    description: "Annual Membership Dues 2025",
    amount: "GHS 200.00",
    method: "MTN Mobile Money",
    status: "completed",
  },
  {
    id: "PAY-2024-012",
    date: "Dec 10, 2024",
    description: "Event Registration - Annual Conference",
    amount: "GHS 50.00",
    method: "Vodafone Cash",
    status: "completed",
  },
  {
    id: "PAY-2024-008",
    date: "Jul 05, 2024",
    description: "Training Workshop Fee",
    amount: "GHS 30.00",
    method: "Bank Transfer",
    status: "completed",
  },
  {
    id: "PAY-2024-001",
    date: "Jan 20, 2024",
    description: "Annual Membership Dues 2024",
    amount: "GHS 180.00",
    method: "MTN Mobile Money",
    status: "completed",
  },
];

export function PaymentHistoryTable() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h3 className="font-semibold">Payment History</h3>
          <p className="text-sm text-muted-foreground">
            Your recent transactions and payment records
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-xs text-muted-foreground">{payment.id}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {payment.date}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {payment.amount}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                  {payment.method}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium text-success">
                      Completed
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t px-6 py-4">
        <p className="text-center text-sm text-muted-foreground">
          Showing {payments.length} of {payments.length} transactions
        </p>
      </div>
    </div>
  );
}
