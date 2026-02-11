import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Shield, UserPlus, Trash2, Search, MapPin } from "lucide-react";
import {
  useAllUserRoles,
  useAssignRole,
  useRemoveRole,
  useTogglePermission,
  AVAILABLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type UserWithRoles,
} from "@/hooks/useRoleManagement";
import { useAllMembers } from "@/hooks/useAdminData";
import { ghanaRegions } from "@/lib/ghanaRegions";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

function RoleBadge({ role }: { role: AppRole }) {
  const colors: Record<AppRole, string> = {
    super_admin: "bg-red-100 text-red-800",
    admin: "bg-blue-100 text-blue-800",
    regional_coordinator: "bg-purple-100 text-purple-800",
    district_coordinator: "bg-indigo-100 text-indigo-800",
    member: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge className={`${colors[role]} hover:${colors[role]}`}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

function AddRoleDialog() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const { data: members = [] } = useAllMembers();
  const assignRole = useAssignRole();

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMember = members.find((m) => m.user_id === selectedUserId);
  const showRegion = selectedRole === "regional_coordinator" || selectedRole === "district_coordinator";
  const showDistrict = selectedRole === "district_coordinator";

  const selectedRegionData = ghanaRegions.find((r) => r.name === selectedRegion);

  const handleSubmit = () => {
    if (!selectedUserId || !selectedRole) return;
    assignRole.mutate(
      {
        userId: selectedUserId,
        role: selectedRole,
        region: showRegion ? selectedRegion : undefined,
        district: showDistrict ? selectedDistrict : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setSelectedUserId("");
          setSelectedRole("");
          setSelectedRegion("");
          setSelectedDistrict("");
          setSearchTerm("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Role to Member</DialogTitle>
          <DialogDescription>
            Search for a member and assign them a role with specific permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Member Search */}
          <div className="space-y-2">
            <Label>Select Member</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto rounded-md border">
                {filteredMembers.slice(0, 10).map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => {
                      setSelectedUserId(member.user_id);
                      setSearchTerm("");
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </button>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No members found</p>
                )}
              </div>
            )}
            {selectedMember && (
              <div className="rounded-md bg-muted p-2 text-sm">
                <strong>{selectedMember.full_name}</strong> — {selectedMember.email}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABELS) as AppRole[])
                  .filter((r) => r !== "member")
                  .map((role) => (
                    <SelectItem key={role} value={role}>
                      <div>
                        <span className="font-medium">{ROLE_LABELS[role]}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          — {ROLE_DESCRIPTIONS[role]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region Selection for coordinators */}
          {showRegion && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Region
              </Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {ghanaRegions.map((region) => (
                    <SelectItem key={region.name} value={region.name}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* District Selection */}
          {showDistrict && selectedRegionData && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                District
              </Label>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRegionData.districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !selectedUserId ||
              !selectedRole ||
              assignRole.isPending ||
              (showRegion && !selectedRegion) ||
              (showDistrict && !selectedDistrict)
            }
          >
            {assignRole.isPending ? "Assigning..." : "Assign Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserPermissions({ user }: { user: UserWithRoles }) {
  const togglePermission = useTogglePermission();

  const isSuperAdmin = user.roles.some((r) => r.role === "super_admin");

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm font-medium text-muted-foreground">Permissions</p>
      {isSuperAdmin ? (
        <p className="text-sm text-muted-foreground italic">
          Super Admins have all permissions automatically.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABLE_PERMISSIONS.map((perm) => {
            const existing = user.permissions.find((p) => p.permission === perm.key);
            return (
              <div
                key={perm.key}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Switch
                  checked={!!existing}
                  onCheckedChange={(checked) =>
                    togglePermission.mutate({
                      userId: user.user_id,
                      permission: perm.key,
                      enabled: checked,
                      existingPermId: existing?.id,
                    })
                  }
                  aria-label={`Toggle ${perm.label} permission`}
                />
                <div>
                  <p className="text-sm font-medium">{perm.label}</p>
                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function RoleManagement() {
  const { data: usersWithRoles = [], isLoading } = useAllUserRoles();
  const removeRole = useRemoveRole();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = usersWithRoles.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role & Permission Management
            </CardTitle>
            <CardDescription>
              Manage administrators, coordinators, and their permissions
            </CardDescription>
          </div>
          <AddRoleDialog />
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Shield className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p>No roles assigned yet. Click &quot;Add Role&quot; to get started.</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {filteredUsers.map((user) => (
              <AccordionItem
                key={user.user_id}
                value={user.user_id}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-4 text-left">
                    <div className="flex-1">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <RoleBadge key={role.id} role={role.role} />
                      ))}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Roles Table */}
                  <div className="mb-4 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>District</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell>
                              <RoleBadge role={role.role} />
                            </TableCell>
                            <TableCell>{role.region || "—"}</TableCell>
                            <TableCell>{role.district || "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(role.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRole.mutate(role.id)}
                                disabled={removeRole.isPending}
                                aria-label={`Remove ${ROLE_LABELS[role.role]} role`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Permissions */}
                  <UserPermissions user={user} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
