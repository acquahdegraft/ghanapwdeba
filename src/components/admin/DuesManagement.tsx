import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import {
  useMembershipTypes,
  useCreateMembershipType,
  useUpdateMembershipType,
  useToggleMembershipTypeStatus,
  MembershipType,
} from "@/hooks/useMembershipTypes";

export function DuesManagement() {
  const { data: membershipTypes = [], isLoading } = useMembershipTypes(true);
  const createMutation = useCreateMembershipType();
  const updateMutation = useUpdateMembershipType();
  const toggleStatusMutation = useToggleMembershipTypeStatus();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingType, setEditingType] = useState<MembershipType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    annual_dues: "",
    benefits: "",
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", annual_dues: "", benefits: "" });
    setEditingType(null);
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      annual_dues: parseFloat(formData.annual_dues),
      benefits: formData.benefits
        ? formData.benefits.split("\n").filter((b) => b.trim())
        : undefined,
    });
    resetForm();
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingType) return;
    await updateMutation.mutateAsync({
      id: editingType.id,
      name: formData.name,
      description: formData.description || undefined,
      annual_dues: parseFloat(formData.annual_dues),
      benefits: formData.benefits
        ? formData.benefits.split("\n").filter((b) => b.trim())
        : undefined,
    });
    resetForm();
  };

  const openEditDialog = (type: MembershipType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || "",
      annual_dues: type.annual_dues.toString(),
      benefits: type.benefits?.join("\n") || "",
    });
  };

  const handleToggleStatus = (type: MembershipType) => {
    toggleStatusMutation.mutate({ id: type.id, is_active: !type.is_active });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Membership Dues Types</CardTitle>
          <CardDescription>
            Manage membership dues categories and pricing
          </CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Membership Type</DialogTitle>
              <DialogDescription>
                Add a new membership dues category
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Standard Membership"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual_dues">Annual Dues (GHS)</Label>
                <Input
                  id="annual_dues"
                  type="number"
                  value={formData.annual_dues}
                  onChange={(e) =>
                    setFormData({ ...formData, annual_dues: e.target.value })
                  }
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this membership type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) =>
                    setFormData({ ...formData, benefits: e.target.value })
                  }
                  placeholder="Access to workshops&#10;Networking events&#10;Business support"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createMutation.isPending ||
                  !formData.name ||
                  !formData.annual_dues
                }
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Annual Dues</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {membershipTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>GHS {type.annual_dues.toFixed(2)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {type.description || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={type.is_active ? "default" : "secondary"}>
                    {type.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Dialog
                      open={editingType?.id === type.id}
                      onOpenChange={(open) => !open && resetForm()}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Membership Type</DialogTitle>
                          <DialogDescription>
                            Update membership dues details
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-annual_dues">
                              Annual Dues (GHS)
                            </Label>
                            <Input
                              id="edit-annual_dues"
                              type="number"
                              value={formData.annual_dues}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  annual_dues: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-benefits">
                              Benefits (one per line)
                            </Label>
                            <Textarea
                              id="edit-benefits"
                              value={formData.benefits}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  benefits: e.target.value,
                                })
                              }
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => resetForm()}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdate}
                            disabled={
                              updateMutation.isPending ||
                              !formData.name ||
                              !formData.annual_dues
                            }
                          >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(type)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {type.is_active ? (
                        <ToggleRight className="h-4 w-4 text-primary" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {membershipTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No membership types found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
