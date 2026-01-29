import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Briefcase, Building2, User } from "lucide-react";

interface DirectoryMember {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  business_name: string | null;
  business_type: string | null;
  region: string | null;
  city: string | null;
  membership_status: string;
}

// Helper function to get signed URL for avatar
async function getSignedAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    const pathMatch = avatarPath.match(/\/avatars\/(.+)$/);
    if (pathMatch) {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(pathMatch[1], 60 * 60);
      
      if (!error && data) {
        return data.signedUrl;
      }
    }
    return avatarPath;
  }
  
  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 60);
  
  if (error) {
    console.error("Error generating signed URL for avatar:", error);
    return null;
  }
  
  return data.signedUrl;
}

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const { data: member, isLoading, error } = useQuery({
    queryKey: ["directory-member", memberId],
    queryFn: async () => {
      if (!memberId) throw new Error("Member ID is required");

      const { data, error } = await supabase
        .from("directory_members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Member not found");

      // Get signed avatar URL
      const signedAvatarUrl = await getSignedAvatarUrl(data.avatar_url);
      
      return {
        ...data,
        avatar_url: signedAvatarUrl,
      } as DirectoryMember;
    },
    enabled: !!memberId,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (error) {
    return (
      <DashboardLayout title="Member Not Found" description="">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Member not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This member profile is not available or has been removed from the directory.
            </p>
            <Button onClick={() => navigate("/dashboard/directory")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Member Profile" description="View member details">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard/directory")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Directory
      </Button>

      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="flex-1 space-y-4 text-center md:text-left">
                <Skeleton className="h-8 w-64 mx-auto md:mx-0" />
                <Skeleton className="h-5 w-48 mx-auto md:mx-0" />
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : member ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Profile Card */}
          <Card className="lg:col-span-2">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
                <Avatar className="h-32 w-32 text-3xl">
                  <AvatarImage src={member.avatar_url || undefined} alt={member.full_name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{member.full_name}</h2>
                  {member.business_name && (
                    <p className="text-lg text-muted-foreground mt-1">
                      {member.business_name}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    <Badge className={getStatusColor(member.membership_status)}>
                      {member.membership_status.charAt(0).toUpperCase() + member.membership_status.slice(1)} Member
                    </Badge>
                    {member.business_type && (
                      <Badge variant="secondary">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {member.business_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {member.business_name && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Business</p>
                    <p className="text-sm text-muted-foreground">{member.business_name}</p>
                  </div>
                </div>
              )}
              
              {member.business_type && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <p className="text-sm text-muted-foreground">{member.business_type}</p>
                  </div>
                </div>
              )}
              
              {(member.region || member.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {[member.city, member.region].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {!member.business_name && !member.business_type && !member.region && !member.city && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No additional details available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
