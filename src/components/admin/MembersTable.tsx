import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Search, UserCheck, UserX, Clock, Ban } from "lucide-react";
import { MemberProfile, useUpdateMembershipStatus } from "@/hooks/useAdminData";

interface MembersTableProps {
  members: MemberProfile[];
  isLoading: boolean;
}

export function MembersTable({ members, isLoading }: MembersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const updateStatus = useUpdateMembershipStatus();

  const filteredMembers = members?.filter((member) =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = (profileId: string, status: "pending" | "active" | "expired" | "suspended") => {
    const expiryDate = status === "active" 
      ? addYears(new Date(), 1).toISOString().split("T")[0]
      : undefined;
    
    updateStatus.mutate({ profileId, status, expiryDate });
  };

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
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
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
                  <TableHead>Business</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers?.map((member) => (
                    <TableRow key={member.id}>
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
                              onClick={() => handleStatusUpdate(member.id, "active")}
                              disabled={member.membership_status === "active"}
                            >
                              <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                              Activate Membership
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "pending")}
                              disabled={member.membership_status === "pending"}
                            >
                              <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                              Set as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "expired")}
                              disabled={member.membership_status === "expired"}
                            >
                              <UserX className="mr-2 h-4 w-4 text-red-600" />
                              Mark as Expired
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusUpdate(member.id, "suspended")}
                              disabled={member.membership_status === "suspended"}
                            >
                              <Ban className="mr-2 h-4 w-4 text-gray-600" />
                              Suspend Membership
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
      </CardContent>
    </Card>
  );
}
