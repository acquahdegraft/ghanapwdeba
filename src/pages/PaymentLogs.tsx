import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Search, RefreshCw, Copy, CheckCircle2, XCircle, Clock, FileJson } from "lucide-react";
import { toast } from "sonner";

interface PaymentLog {
  id: string;
  log_type: string;
  transaction_reference: string | null;
  payment_id: string | null;
  raw_payload: Record<string, unknown>;
  parsed_status: string | null;
  hubtel_status: string | null;
  amount: number | null;
  source_ip: string | null;
  created_at: string;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="secondary">—</Badge>;
  if (status === "completed") return <Badge className="bg-chart-2/20 text-chart-2 border-chart-2/30">completed</Badge>;
  if (status === "failed") return <Badge variant="destructive">failed</Badge>;
  if (status === "pending") return <Badge className="bg-chart-4/20 text-chart-4 border-chart-4/30">pending</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  if (type === "callback") return (
    <Badge className="bg-primary/10 text-primary border-primary/30">
      <FileJson className="h-3 w-3 mr-1" /> callback
    </Badge>
  );
  return (
    <Badge className="bg-muted text-muted-foreground">
      <Clock className="h-3 w-3 mr-1" /> status_check
    </Badge>
  );
}

function JsonViewer({ data }: { data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed max-h-64">
        {json}
      </pre>
    </div>
  );
}

export default function PaymentLogs() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["payment-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_logs" as never)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      return (data as PaymentLog[]) ?? [];
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.transaction_reference?.toLowerCase().includes(search.toLowerCase()) ||
      log.payment_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.hubtel_status?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || log.log_type === typeFilter;
    const matchStatus = statusFilter === "all" || log.parsed_status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const callbackCount = logs.filter((l) => l.log_type === "callback").length;
  const statusCheckCount = logs.filter((l) => l.log_type === "status_check").length;
  const completedCount = logs.filter((l) => l.parsed_status === "completed").length;
  const failedCount = logs.filter((l) => l.parsed_status === "failed").length;

  return (
    <DashboardLayout
      title="Payment Logs"
      description="Raw JSON payloads from Hubtel callbacks and status checks"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Logs", value: logs.length, icon: <FileJson className="h-4 w-4" /> },
          { label: "Callbacks", value: callbackCount, icon: <FileJson className="h-4 w-4 text-primary" /> },
          { label: "Status Checks", value: statusCheckCount, icon: <Clock className="h-4 w-4 text-muted-foreground" /> },
          { label: "Completed", value: completedCount, icon: <CheckCircle2 className="h-4 w-4 text-chart-2" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                {icon}
              </div>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-base">Log Entries ({filtered.length})</CardTitle>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reference, ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-52"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="callback">Callback</SelectItem>
                  <SelectItem value="status_check">Status Check</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileJson className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No logs found</p>
              <p className="text-sm mt-1">Logs will appear here after Hubtel sends callbacks or status checks are made.</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[65vh]">
              <div className="space-y-3">
                {filtered.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Header row */}
                    <button
                      className="w-full flex flex-wrap gap-2 items-center px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <TypeBadge type={log.log_type} />
                      <StatusBadge status={log.parsed_status} />
                      {log.parsed_status === "failed" && (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                        {log.transaction_reference ?? "—"}
                      </span>
                      {log.hubtel_status && (
                        <span className="text-xs text-muted-foreground">
                          Hubtel: <span className="font-medium text-foreground">{log.hubtel_status}</span>
                        </span>
                      )}
                      {log.amount != null && (
                        <span className="text-xs text-muted-foreground ml-auto mr-2">
                          GHS {Number(log.amount).toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd MMM yyyy, HH:mm:ss")}
                      </span>
                    </button>

                    {/* Expanded JSON */}
                    {expandedId === log.id && (
                      <div className="p-4 border-t bg-background">
                        <div className="grid md:grid-cols-2 gap-3 mb-3 text-xs text-muted-foreground">
                          <div><span className="font-medium text-foreground">Log ID:</span> {log.id}</div>
                          <div><span className="font-medium text-foreground">Payment ID:</span> {log.payment_id ?? "—"}</div>
                          <div><span className="font-medium text-foreground">Source IP:</span> {log.source_ip ?? "—"}</div>
                          <div><span className="font-medium text-foreground">Created:</span> {format(new Date(log.created_at), "PPpp")}</div>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Raw Payload:</p>
                        <JsonViewer data={log.raw_payload} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
