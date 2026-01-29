import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Search, 
  BookOpen, 
  FileCheck, 
  FileSpreadsheet,
  FolderOpen,
  GraduationCap,
  ClipboardList
} from "lucide-react";
import { useResources, getResourceSignedUrl, RESOURCE_CATEGORIES, Resource } from "@/hooks/useResources";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  general: <FolderOpen className="h-5 w-5" />,
  guides: <BookOpen className="h-5 w-5" />,
  templates: <FileSpreadsheet className="h-5 w-5" />,
  policies: <FileCheck className="h-5 w-5" />,
  training: <GraduationCap className="h-5 w-5" />,
  forms: <ClipboardList className="h-5 w-5" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  guides: "Guides",
  templates: "Templates",
  policies: "Policies",
  training: "Training",
  forms: "Forms",
};

export default function Resources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { data: resources, isLoading } = useResources(categoryFilter);
  const { toast } = useToast();

  const filteredResources = resources?.filter((resource) => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDownload = async (resource: Resource) => {
    if (resource.external_url) {
      window.open(resource.external_url, "_blank");
      return;
    }

    if (resource.file_url) {
      try {
        const signedUrl = await getResourceSignedUrl(resource.file_url);
        if (signedUrl) {
          window.open(signedUrl, "_blank");
        } else {
          throw new Error("Could not get download link");
        }
      } catch (error) {
        toast({
          title: "Download Failed",
          description: "Unable to download this file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout
      title="Resources"
      description="Access documents, guides, and helpful materials"
    >
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {RESOURCE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resources count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{filteredResources?.length || 0} resources available</span>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredResources?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No resources found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || categoryFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Resources will appear here when they are published"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources?.map((resource) => (
            <Card key={resource.id} className="card-interactive flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    {CATEGORY_ICONS[resource.category] || <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-2">{resource.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[resource.category] || resource.category}
                      </Badge>
                      {resource.file_size && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(resource.file_size)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {resource.description && (
                  <CardDescription className="line-clamp-2 mb-4">
                    {resource.description}
                  </CardDescription>
                )}
                <div className="mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownload(resource)}
                  >
                    {resource.external_url ? (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
