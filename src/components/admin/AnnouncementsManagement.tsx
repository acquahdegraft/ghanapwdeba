import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import {
  useAllAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  Announcement,
} from "@/hooks/useAnnouncements";

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

interface FormData {
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  is_published: boolean;
  publish_date: string;
  expire_date: string;
}

interface AnnouncementFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
}

function AnnouncementForm({ formData, onChange }: AnnouncementFormProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Announcement title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => onChange({ ...formData, content: e.target.value })}
          placeholder="Announcement content..."
          rows={5}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: "low" | "normal" | "high" | "urgent") =>
              onChange({ ...formData, priority: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) =>
                onChange({ ...formData, is_published: checked })
              }
            />
            <Label htmlFor="is_published">Publish immediately</Label>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publish_date">Publish Date (optional)</Label>
          <Input
            id="publish_date"
            type="datetime-local"
            value={formData.publish_date}
            onChange={(e) => onChange({ ...formData, publish_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expire_date">Expire Date (optional)</Label>
          <Input
            id="expire_date"
            type="datetime-local"
            value={formData.expire_date}
            onChange={(e) => onChange({ ...formData, expire_date: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsManagement() {
  const { data: announcements = [], isLoading } = useAllAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    priority: "normal",
    is_published: false,
    publish_date: "",
    expire_date: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "normal",
      is_published: false,
      publish_date: "",
      expire_date: "",
    });
    setEditingAnnouncement(null);
  };

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      is_published: formData.is_published,
      publish_date: formData.publish_date || undefined,
      expire_date: formData.expire_date || undefined,
    });
    resetForm();
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingAnnouncement) return;
    await updateMutation.mutateAsync({
      id: editingAnnouncement.id,
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      is_published: formData.is_published,
      publish_date: formData.publish_date || null,
      expire_date: formData.expire_date || null,
    });
    resetForm();
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      is_published: announcement.is_published,
      publish_date: announcement.publish_date
        ? format(new Date(announcement.publish_date), "yyyy-MM-dd'T'HH:mm")
        : "",
      expire_date: announcement.expire_date
        ? format(new Date(announcement.expire_date), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
  };

  const handleTogglePublish = (announcement: Announcement) => {
    updateMutation.mutate({
      id: announcement.id,
      is_published: !announcement.is_published,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
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
          <CardTitle>Announcements</CardTitle>
          <CardDescription>
            Create and manage announcements for members
          </CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Create a new announcement for members
              </DialogDescription>
            </DialogHeader>
            <AnnouncementForm formData={formData} onChange={setFormData} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !formData.title || !formData.content}
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
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((announcement) => (
              <TableRow key={announcement.id}>
                <TableCell className="font-medium max-w-xs truncate">
                  {announcement.title}
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[announcement.priority]}>
                    {announcement.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={announcement.is_published ? "default" : "secondary"}>
                    {announcement.is_published ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(announcement.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(announcement)}
                      disabled={updateMutation.isPending}
                    >
                      {announcement.is_published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Dialog
                      open={editingAnnouncement?.id === announcement.id}
                      onOpenChange={(open) => !open && resetForm()}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Announcement</DialogTitle>
                          <DialogDescription>
                            Update announcement details
                          </DialogDescription>
                        </DialogHeader>
                        <AnnouncementForm formData={formData} onChange={setFormData} />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => resetForm()}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpdate}
                            disabled={
                              updateMutation.isPending ||
                              !formData.title ||
                              !formData.content
                            }
                          >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this announcement? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(announcement.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {announcements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No announcements found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
