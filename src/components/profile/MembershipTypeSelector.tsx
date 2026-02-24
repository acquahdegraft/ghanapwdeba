import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useMembershipTypes } from "@/hooks/useMembershipTypes";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, Loader2, Crown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MembershipTypeSelector() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: membershipTypes, isLoading: typesLoading } = useMembershipTypes();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: async (typeId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({ membership_type_id: typeId } as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["memberDues"] });
      setSelectedTypeId(null);
      toast({ title: "Membership Type Updated", description: "Your membership type has been changed successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const isLoading = profileLoading || typesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const currentTypeId = profile?.membership_type_id;

  const handleChange = (typeId: string) => {
    if (typeId === currentTypeId) return;
    setSelectedTypeId(typeId);
  };

  const handleConfirm = () => {
    if (selectedTypeId) updateMutation.mutate(selectedTypeId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="h-5 w-5" />
          Membership Type
        </CardTitle>
        <CardDescription>
          Choose your membership tier. Annual dues vary by type and are payable at the end of the year.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {membershipTypes?.map((type) => {
          const isCurrent = type.id === currentTypeId;
          const isSelected = type.id === selectedTypeId;

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleChange(type.id)}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-all",
                isCurrent && !selectedTypeId
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : isSelected
                  ? "border-accent bg-accent/10 ring-1 ring-accent"
                  : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.name}</span>
                    {isCurrent && (
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    )}
                  </div>
                  {type.description && (
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    GH₵{type.annual_dues}/yr
                  </span>
                  {(isCurrent && !selectedTypeId) || isSelected ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : null}
                </div>
              </div>
              {type.benefits && type.benefits.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {type.benefits.slice(0, 3).map((b, i) => (
                    <li key={i}>
                      <Badge variant="secondary" className="text-xs font-normal">{b}</Badge>
                    </li>
                  ))}
                  {type.benefits.length > 3 && (
                    <li>
                      <Badge variant="secondary" className="text-xs font-normal">
                        +{type.benefits.length - 3} more
                      </Badge>
                    </li>
                  )}
                </ul>
              )}
            </button>
          );
        })}

        {selectedTypeId && selectedTypeId !== currentTypeId && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedTypeId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Confirm Change"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
