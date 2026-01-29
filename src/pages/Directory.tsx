import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Briefcase, Users, Eye, EyeOff } from "lucide-react";
import { useDirectory, useUpdateDirectoryVisibility } from "@/hooks/useDirectory";
import { useProfile } from "@/hooks/useProfile";
import { ghanaRegions } from "@/lib/ghanaRegions";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Directory() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const { data: members, isLoading } = useDirectory(searchQuery, regionFilter);
  const { data: profile } = useProfile();
  const { updateVisibility } = useUpdateDirectoryVisibility();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleVisibilityChange = async (isPublic: boolean) => {
    try {
      await updateVisibility(isPublic);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: isPublic ? "Profile visible" : "Profile hidden",
        description: isPublic 
          ? "Other members can now find you in the directory."
          : "Your profile is now hidden from the directory.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update visibility settings.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout
      title="Member Directory"
      description="Connect with fellow entrepreneurs and business owners"
    >
      {/* Privacy Control */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {(profile as any)?.is_public_directory ? (
              <Eye className="h-5 w-5 text-primary" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="visibility" className="font-medium">
                Directory Visibility
              </Label>
              <p className="text-sm text-muted-foreground">
                {(profile as any)?.is_public_directory
                  ? "Your profile is visible to other members"
                  : "Your profile is hidden from the directory"}
              </p>
            </div>
          </div>
          <Switch
            id="visibility"
            checked={(profile as any)?.is_public_directory ?? true}
            onCheckedChange={handleVisibilityChange}
          />
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, business, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Regions" />
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
      </div>

      {/* Members Count */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{members?.length || 0} members found</span>
      </div>

      {/* Members Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : members?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No members found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members?.map((member) => (
            <Card key={member.id} className="card-interactive">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{member.full_name}</h3>
                    {member.business_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {member.business_name}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {member.business_type && (
                        <Badge variant="secondary" className="text-xs">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {member.business_type}
                        </Badge>
                      )}
                      {member.region && (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="mr-1 h-3 w-3" />
                          {member.region}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate(`/dashboard/directory/${member.id}`)}
                  >
                    View Profile
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
