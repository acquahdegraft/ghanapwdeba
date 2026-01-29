import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserCheck, UserX, CircleHelp, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { AdminEvent } from "@/hooks/useAdminEvents";
import {
  useEventRegistrations,
  useUpdateAttendance,
  useBulkUpdateAttendance,
} from "@/hooks/useEventAttendance";

interface AttendanceDialogProps {
  event: AdminEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({ event, open, onOpenChange }: AttendanceDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: registrations = [], isLoading } = useEventRegistrations(event?.id || "");
  const updateAttendance = useUpdateAttendance();
  const bulkUpdateAttendance = useBulkUpdateAttendance();

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const matchesSearch =
        reg.profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.profile?.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || reg.attendance_status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchTerm, filterStatus]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRegistrations.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBulkAction = (status: "present" | "absent" | "unknown") => {
    if (selectedIds.length === 0) return;
    bulkUpdateAttendance.mutate({ registrationIds: selectedIds, attendanceStatus: status });
    setSelectedIds([]);
  };

  const handleSingleUpdate = (registrationId: string, status: "present" | "absent" | "unknown") => {
    updateAttendance.mutate({ registrationId, attendanceStatus: status });
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Present
          </Badge>
        );
      case "absent":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Absent
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            <HelpCircle className="mr-1 h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const attendanceStats = useMemo(() => {
    const present = registrations.filter((r) => r.attendance_status === "present").length;
    const absent = registrations.filter((r) => r.attendance_status === "absent").length;
    const unknown = registrations.filter((r) => r.attendance_status === "unknown").length;
    return { present, absent, unknown, total: registrations.length };
  }, [registrations]);

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Attendance</DialogTitle>
          <DialogDescription>
            {event.title} - {format(parseISO(event.event_date), "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        {/* Stats summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{attendanceStats.total}</p>
            <p className="text-xs text-muted-foreground">Registered</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
            <p className="text-xs text-green-600">Present</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
            <p className="text-xs text-red-600">Absent</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-700">{attendanceStats.unknown}</p>
            <p className="text-xs text-gray-600">Unknown</p>
          </div>
        </div>

        {/* Filters and bulk actions */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("present")}
              disabled={bulkUpdateAttendance.isPending}
            >
              <UserCheck className="mr-1 h-4 w-4 text-green-600" />
              Mark Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("absent")}
              disabled={bulkUpdateAttendance.isPending}
            >
              <UserX className="mr-1 h-4 w-4 text-red-600" />
              Mark Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction("unknown")}
              disabled={bulkUpdateAttendance.isPending}
            >
              <CircleHelp className="mr-1 h-4 w-4 text-gray-600" />
              Reset
            </Button>
          </div>
        )}

        {/* Registrations table */}
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredRegistrations.length > 0 &&
                        selectedIds.length === filteredRegistrations.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(reg.id)}
                          onCheckedChange={(checked) => handleSelectOne(reg.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reg.profile?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{reg.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(reg.registered_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{getAttendanceBadge(reg.attendance_status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant={reg.attendance_status === "present" ? "default" : "outline"}
                            onClick={() => handleSingleUpdate(reg.id, "present")}
                            disabled={updateAttendance.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={reg.attendance_status === "absent" ? "destructive" : "outline"}
                            onClick={() => handleSingleUpdate(reg.id, "absent")}
                            disabled={updateAttendance.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
