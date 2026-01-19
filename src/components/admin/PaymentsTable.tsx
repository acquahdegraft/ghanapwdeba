import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import { AdminPayment, useUpdatePaymentStatus } from "@/hooks/useAdminData";

interface PaymentsTableProps {
  payments: AdminPayment[];
  isLoading: boolean;
}

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const updateStatus = useUpdatePaymentStatus();

  const filteredPayments = payments?.filter((payment) =>
    payment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = (paymentId: string, status: "pending" | "completed" | "failed" | "refunded") => {
    updateStatus.mutate({ paymentId, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Refunded</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>All Payments</CardTitle>
            <CardDescription>View and manage all member payments</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.profiles?.full_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{payment.profiles?.email || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method?.replace("_", " ") || "—"}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">
                          {payment.transaction_reference?.slice(0, 12) || "—"}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.payment_date
                          ? format(parseISO(payment.payment_date), "MMM d, yyyy")
                          : format(parseISO(payment.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(payment.id, "completed")}
                              disabled={payment.status === "completed"}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(payment.id, "pending")}
                              disabled={payment.status === "pending"}
                            >
                              <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                              Set as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(payment.id, "failed")}
                              disabled={payment.status === "failed"}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Mark as Failed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(payment.id, "refunded")}
                              disabled={payment.status === "refunded"}
                            >
                              <RotateCcw className="mr-2 h-4 w-4 text-purple-600" />
                              Mark as Refunded
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredPayments?.length || 0} of {payments?.length || 0} payments
        </div>
      </CardContent>
    </Card>
  );
}
