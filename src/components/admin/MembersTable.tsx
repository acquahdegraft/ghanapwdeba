import { useState, useMemo } from "react";
import { format, parseISO, addYears } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Search, UserCheck, UserX, Clock, Ban, Download, X, Users, Trash2, Eye, Mail } from "lucide-react";
import { MemberProfile, useUpdateMembershipStatus } from "@/hooks/useAdminData";
import { useMembershipTypes } from "@/hooks/useMembershipTypes";
import { useBulkUpdateMemberStatus, useBulkDeleteMembers } from "@/hooks/useBulkMemberActions";
import { ghanaRegions, educationLevels } from "@/lib/ghanaRegions";
import { exportToCSV, formatDateForExport } from "@/lib/csvExport";
import { MemberImport } from "./MemberImport";
import { MemberDetailDialog } from "./MemberDetailDialog";
import { getProfileCompletion } from "@/lib/profileCompletion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface MembersTableProps {
  members: MemberProfile[];
  isLoading: boolean;
}

const membershipStatuses = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
];

export function MembersTable({ members, isLoading }: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [membershipTypeFilter, setMembershipTypeFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [certificateFilter, setCertificateFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [singleDeleteMember, setSingleDeleteMember] = useState<MemberProfile | null>(null);
  const [detailMember, setDetailMember] = useState<MemberProfile | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  const updateStatus = useUpdateMembershipStatus();
  const bulkUpdateStatus = useBulkUpdateMemberStatus();
  const bulkDelete = useBulkDeleteMembers();
  const { data: membershipTypes = [] } = useMembershipTypes();

  const handleSendProfileReminders = async () => {
    setSendingReminders(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-profile-reminder", {
        body: { threshold: 80 },
      });
      if (error) throw error;
      toast.success(`Profile reminders sent to ${data.sent} member(s)`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to send reminders: " + message);
    } finally {
      setSendingReminders(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members?.filter((member) => {
      // Search filter
      const matchesSearch =
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.business_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || member.membership_status === statusFilter;

      // Region filter
      const matchesRegion =
        regionFilter === "all" || member.region === regionFilter;

      // Membership type filter
      const matchesMembershipType =
        membershipTypeFilter === "all" ||
        member.membership_type_id === membershipTypeFilter;

      // Education level filter
      const matchesEducation =
        educationFilter === "all" || member.education_level === educationFilter;

      // Certificate filter
      const matchesCertificate =
        certificateFilter === "all" ||
        (certificateFilter === "has_bir" && !!member.bir_registration_number) ||
        (certificateFilter === "has_nis" && !!member.nis_registration_number) ||
        (certificateFilter === "has_vat" && !!member.vat_registration_number) ||
        (certificateFilter === "has_reg" && member.has_certificate_of_registration) ||
        (certificateFilter === "has_cont" && member.has_certificate_of_continuance) ||
        (certificateFilter === "no_certs" &&
          !member.bir_registration_number &&
          !member.nis_registration_number &&
          !member.vat_registration_number &&
          !member.has_certificate_of_registration &&
          !member.has_certificate_of_continuance);

      return matchesSearch && matchesStatus && matchesRegion && matchesMembershipType && matchesEducation && matchesCertificate;
    });
  }, [members, searchTerm, statusFilter, regionFilter, membershipTypeFilter, educationFilter, certificateFilter]);

  const handleStatusUpdate = (
    member: MemberProfile,
    status: "pending" | "active" | "expired" | "suspended"
  ) => {
    const expiryDate = status === "active" 
      ? addYears(new Date(), 1).toISOString().split("T")[0]
      : undefined;
    
    updateStatus.mutate({ 
      profileId: member.id, 
      status, 
      expiryDate,
      memberEmail: member.email,
      memberName: member.full_name,
      oldStatus: member.membership_status,
    });
  };

  const handleExportCSV = () => {
    const exportData = filteredMembers.map((member) => {
      const membershipType = membershipTypes.find(
        (t) => t.id === member.membership_type_id
      );
      return {
        ...member,
        membership_type_name: membershipType?.name || "",
        membership_start_date_formatted: formatDateForExport(member.membership_start_date),
        membership_expiry_date_formatted: formatDateForExport(member.membership_expiry_date),
        created_at_formatted: formatDateForExport(member.created_at),
      };
    });

    const columns = [
      { key: "full_name" as const, label: "Full Name" },
      { key: "email" as const, label: "Email" },
      { key: "gender" as const, label: "Gender" },
      { key: "business_name" as const, label: "Business Name" },
      { key: "business_type" as const, label: "Business Type" },
      { key: "business_address" as const, label: "Business Address" },
      { key: "mailing_address" as const, label: "Mailing Address" },
      { key: "region" as const, label: "Region" },
      { key: "city" as const, label: "City/District" },
      { key: "education_level" as const, label: "Education Level" },
      { key: "special_skills" as const, label: "Special Skills" },
      { key: "bir_registration_number" as const, label: "BIR Reg. No." },
      { key: "nis_registration_number" as const, label: "NIS Reg. No." },
      { key: "vat_registration_number" as const, label: "VAT Reg. No." },
      { key: "has_certificate_of_registration" as const, label: "Cert. of Registration" },
      { key: "has_certificate_of_continuance" as const, label: "Cert. of Continuance" },
      { key: "num_permanent_staff" as const, label: "Permanent Staff" },
      { key: "num_temporary_staff" as const, label: "Temporary Staff" },
      { key: "bank_name" as const, label: "Bank/Financial Institution" },
      { key: "bank_branch" as const, label: "Bank Branch" },
      { key: "membership_status" as const, label: "Status" },
      { key: "membership_type_name" as const, label: "Membership Type" },
      { key: "membership_start_date_formatted" as const, label: "Start Date" },
      { key: "membership_expiry_date_formatted" as const, label: "Expiry Date" },
      { key: "created_at_formatted" as const, label: "Joined Date" },
    ];

    const filename = `members_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    exportToCSV(exportData, filename, columns);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRegionFilter("all");
    setMembershipTypeFilter("all");
    setEducationFilter("all");
    setCertificateFilter("all");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMembers?.map((m) => m.id) || []);
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

  const handleBulkAction = (status: "active" | "pending" | "expired" | "suspended") => {
    if (selectedIds.length === 0) return;
    bulkUpdateStatus.mutate({ profileIds: selectedIds, status });
    setSelectedIds([]);
  };

  const handleExportSelected = () => {
    const selectedMembers = filteredMembers?.filter((m) => selectedIds.includes(m.id)) || [];
    const exportData = selectedMembers.map((member) => {
      const membershipType = membershipTypes.find(
        (t) => t.id === member.membership_type_id
      );
      return {
        ...member,
        membership_type_name: membershipType?.name || "",
        membership_start_date_formatted: formatDateForExport(member.membership_start_date),
        membership_expiry_date_formatted: formatDateForExport(member.membership_expiry_date),
        created_at_formatted: formatDateForExport(member.created_at),
      };
    });

    const columns = [
      { key: "full_name" as const, label: "Full Name" },
      { key: "email" as const, label: "Email" },
      { key: "gender" as const, label: "Gender" },
      { key: "business_name" as const, label: "Business Name" },
      { key: "business_type" as const, label: "Business Type" },
      { key: "business_address" as const, label: "Business Address" },
      { key: "mailing_address" as const, label: "Mailing Address" },
      { key: "region" as const, label: "Region" },
      { key: "city" as const, label: "City/District" },
      { key: "education_level" as const, label: "Education Level" },
      { key: "special_skills" as const, label: "Special Skills" },
      { key: "bir_registration_number" as const, label: "BIR Reg. No." },
      { key: "nis_registration_number" as const, label: "NIS Reg. No." },
      { key: "vat_registration_number" as const, label: "VAT Reg. No." },
      { key: "has_certificate_of_registration" as const, label: "Cert. of Registration" },
      { key: "has_certificate_of_continuance" as const, label: "Cert. of Continuance" },
      { key: "num_permanent_staff" as const, label: "Permanent Staff" },
      { key: "num_temporary_staff" as const, label: "Temporary Staff" },
      { key: "bank_name" as const, label: "Bank/Financial Institution" },
      { key: "bank_branch" as const, label: "Bank Branch" },
      { key: "membership_status" as const, label: "Status" },
      { key: "membership_type_name" as const, label: "Membership Type" },
      { key: "membership_start_date_formatted" as const, label: "Start Date" },
      { key: "membership_expiry_date_formatted" as const, label: "Expiry Date" },
      { key: "created_at_formatted" as const, label: "Joined Date" },
    ];

    const filename = `selected_members_${format(new Date(), "yyyy-MM-dd")}.csv`;
    exportToCSV(exportData, filename, columns);
    setSelectedIds([]);
  };

  const hasActiveFilters =
    searchTerm || statusFilter !== "all" || regionFilter !== "all" || membershipTypeFilter !== "all" || educationFilter !== "all" || certificateFilter !== "all";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expired</Badge>;
      case "suspended":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Suspended</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>Manage member accounts and membership statuses</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <MemberImport />
            <Button variant="outline" onClick={handleSendProfileReminders} disabled={sendingReminders}>
              <Mail className="mr-2 h-4 w-4" />
              {sendingReminders ? "Sending..." : "Send Profile Reminders"}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!filteredMembers?.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {membershipStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {ghanaRegions.map((region) => (
                  <SelectItem key={region.name} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={membershipTypeFilter} onValueChange={setMembershipTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Membership Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {membershipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={educationFilter} onValueChange={setEducationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Education Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Education</SelectItem>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={certificateFilter} onValueChange={setCertificateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Certificates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certificates</SelectItem>
                <SelectItem value="has_bir">Has BIR Reg.</SelectItem>
                <SelectItem value="has_nis">Has NIS Reg.</SelectItem>
                <SelectItem value="has_vat">Has VAT Reg.</SelectItem>
                <SelectItem value="has_reg">Has Cert. of Registration</SelectItem>
                <SelectItem value="has_cont">Has Cert. of Continuance</SelectItem>
                <SelectItem value="no_certs">No Certificates</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("active")}
                disabled={bulkUpdateStatus.isPending}
              >
                <UserCheck className="mr-1 h-4 w-4 text-green-600" />
                Activate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction("suspended")}
                disabled={bulkUpdateStatus.isPending}
              >
                <Ban className="mr-1 h-4 w-4 text-gray-600" />
                Suspend
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportSelected}
              >
                <Download className="mr-1 h-4 w-4" />
                Export
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={bulkDelete.isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.length} member(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected member profiles and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  bulkDelete.mutate({ profileIds: selectedIds }, {
                    onSuccess: () => {
                      setSelectedIds([]);
                      setShowDeleteDialog(false);
                    },
                  });
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Single Delete Confirmation Dialog */}
        <AlertDialog open={!!singleDeleteMember} onOpenChange={(open) => { if (!open) setSingleDeleteMember(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {singleDeleteMember?.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this member's account and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (!singleDeleteMember) return;
                  bulkDelete.mutate({ profileIds: [singleDeleteMember.id] }, {
                    onSuccess: () => setSingleDeleteMember(null),
                  });
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                        filteredMembers && filteredMembers.length > 0 &&
                        selectedIds.length === filteredMembers.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers?.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(member.id)}
                          onCheckedChange={(checked) => handleSelectOne(member.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{member.business_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{member.business_type || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.city && member.region 
                          ? `${member.city}, ${member.region}`
                          : member.region || "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(member.membership_status)}</TableCell>
                      <TableCell>
                        {member.membership_expiry_date
                          ? format(parseISO(member.membership_expiry_date), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const pct = getProfileCompletion(member as unknown as Record<string, unknown>);
                          return (
                            <div className="flex items-center gap-2 min-w-[80px]">
                              <Progress value={pct} className="h-2 flex-1" />
                              <span className={`text-xs font-medium ${pct === 100 ? "text-success" : pct >= 60 ? "text-foreground" : "text-destructive"}`}>
                                {pct}%
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(member.created_at), "MMM d, yyyy")}
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
                              onClick={() => handleStatusUpdate(member, "active")}
                              disabled={member.membership_status === "active"}
                            >
                              <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                              Activate Membership
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member, "pending")}
                              disabled={member.membership_status === "pending"}
                            >
                              <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                              Set as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member, "expired")}
                              disabled={member.membership_status === "expired"}
                            >
                              <UserX className="mr-2 h-4 w-4 text-red-600" />
                              Mark as Expired
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member, "suspended")}
                              disabled={member.membership_status === "suspended"}
                            >
                              <Ban className="mr-2 h-4 w-4 text-gray-600" />
                              Suspend Membership
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDetailMember(member)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setSingleDeleteMember(member)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Member
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
          Showing {filteredMembers?.length || 0} of {members?.length || 0} members
        </div>

        <MemberDetailDialog
          member={detailMember}
          open={!!detailMember}
          onOpenChange={(open) => { if (!open) setDetailMember(null); }}
        />
      </CardContent>
    </Card>
  );
}
