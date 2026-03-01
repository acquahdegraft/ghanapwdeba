import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ghanaRegions, disabilityTypeOptions, businessTypes, genderOptions, educationLevels } from "@/lib/ghanaRegions";
import { Camera, Loader2, Save, Building2, GraduationCap, FileText, Users, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ghanaPhoneRegex = /^(\+233|233|0)?[0-9]{9,10}$/;

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(15).refine(
    (val) => !val || val === "" || ghanaPhoneRegex.test(val.replace(/\s/g, "")),
    { message: "Please enter a valid Ghana phone number" }
  ).optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  disability_type: z.string().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  // Business info
  business_name: z.string().max(200).optional().or(z.literal("")),
  business_type: z.string().max(100).optional().or(z.literal("")),
  business_address: z.string().max(500).optional().or(z.literal("")),
  mailing_address: z.string().max(500).optional().or(z.literal("")),
  // Education
  education_level: z.string().optional().or(z.literal("")),
  special_skills: z.string().max(500).optional().or(z.literal("")),
  // Certificates
  bir_registration_number: z.string().max(50).optional().or(z.literal("")),
  nis_registration_number: z.string().max(50).optional().or(z.literal("")),
  vat_registration_number: z.string().max(50).optional().or(z.literal("")),
  has_certificate_of_registration: z.boolean().optional(),
  has_certificate_of_continuance: z.boolean().optional(),
  // Human resources
  num_permanent_staff: z.coerce.number().int().min(0).max(99999).optional().or(z.literal("")),
  num_temporary_staff: z.coerce.number().int().min(0).max(99999).optional().or(z.literal("")),
  // Financial
  bank_name: z.string().max(200).optional().or(z.literal("")),
  bank_branch: z.string().max(200).optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "", phone: "", gender: "", disability_type: "",
      region: "", city: "", business_name: "", business_type: "",
      business_address: "", mailing_address: "",
      education_level: "", special_skills: "",
      bir_registration_number: "", nis_registration_number: "", vat_registration_number: "",
      has_certificate_of_registration: false, has_certificate_of_continuance: false,
      num_permanent_staff: "", num_temporary_staff: "",
      bank_name: "", bank_branch: "",
    },
  });

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      form.reset({
        full_name: p.full_name || "",
        phone: p.phone || "",
        gender: p.gender || "",
        business_name: p.business_name || "",
        business_type: p.business_type || "",
        disability_type: p.disability_type || "",
        region: p.region || "",
        city: p.city || "",
        business_address: p.business_address || "",
        mailing_address: p.mailing_address || "",
        education_level: p.education_level || "",
        special_skills: p.special_skills || "",
        bir_registration_number: p.bir_registration_number || "",
        nis_registration_number: p.nis_registration_number || "",
        vat_registration_number: p.vat_registration_number || "",
        has_certificate_of_registration: p.has_certificate_of_registration || false,
        has_certificate_of_continuance: p.has_certificate_of_continuance || false,
        num_permanent_staff: p.num_permanent_staff ?? "",
        num_temporary_staff: p.num_temporary_staff ?? "",
        bank_name: p.bank_name || "",
        bank_branch: p.bank_branch || "",
      });
      setSelectedRegion(p.region || "");
      setAvatarUrl(p.avatar_url);
    }
  }, [profile, form]);

  useEffect(() => {
    if (selectedRegion) {
      const region = ghanaRegions.find((r) => r.name === selectedRegion);
      setDistricts(region?.districts || []);
    } else {
      setDistricts([]);
    }
  }, [selectedRegion]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          gender: data.gender || null,
          business_name: data.business_name || null,
          business_type: data.business_type || null,
          disability_type: data.disability_type as any || null,
          region: data.region || null,
          city: data.city || null,
          business_address: data.business_address || null,
          mailing_address: data.mailing_address || null,
          education_level: data.education_level || null,
          special_skills: data.special_skills || null,
          bir_registration_number: data.bir_registration_number || null,
          nis_registration_number: data.nis_registration_number || null,
          vat_registration_number: data.vat_registration_number || null,
          has_certificate_of_registration: data.has_certificate_of_registration || false,
          has_certificate_of_continuance: data.has_certificate_of_continuance || false,
          num_permanent_staff: data.num_permanent_staff === "" ? null : Number(data.num_permanent_staff),
          num_temporary_staff: data.num_temporary_staff === "" ? null : Number(data.num_temporary_staff),
          bank_name: data.bank_name || null,
          bank_branch: data.bank_branch || null,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: signedUrlData, error: urlError } = await supabase.storage.from("avatars").createSignedUrl(filePath, 60 * 60 * 24 * 7);
      if (urlError) throw urlError;
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: filePath }).eq("user_id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(signedUrlData.signedUrl);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Photo Updated", description: "Your profile photo has been uploaded." });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: ProfileFormData) => updateProfileMutation.mutate(data);

  const initials = profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "M";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Loading profile...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" aria-label="Edit profile">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} alt={`${profile?.full_name}'s profile photo`} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-110" aria-label="Upload new profile photo">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Click the camera icon to upload a new photo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: General / Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              General Information
            </CardTitle>
            <CardDescription>Your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl><Input placeholder="Enter your full name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="e.g. 0244123456" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {genderOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="disability_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Disability Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select disability type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {disabilityTypeOptions.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section 2: Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              Location
            </CardTitle>
            <CardDescription>Your region and district</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="region" render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); setSelectedRegion(value); form.setValue("city", ""); }} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {ghanaRegions.map((region) => (<SelectItem key={region.name} value={region.name}>{region.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>District</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {districts.map((district) => (<SelectItem key={district} value={district}>{district}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section 3: Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              Business Information
            </CardTitle>
            <CardDescription>Details about your business or service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="business_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl><Input placeholder="Enter business name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="business_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Business / Service</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {businessTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="business_address" render={({ field }) => (
              <FormItem>
                <FormLabel>Business Address</FormLabel>
                <FormControl><Textarea placeholder="Enter the physical address of your business" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="mailing_address" render={({ field }) => (
              <FormItem>
                <FormLabel>Mailing Address</FormLabel>
                <FormDescription>If different from business address</FormDescription>
                <FormControl><Textarea placeholder="Enter mailing address (if different)" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section 4: Education & Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
              Education & Skills
            </CardTitle>
            <CardDescription>Your qualifications and expertise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="education_level" render={({ field }) => (
              <FormItem>
                <FormLabel>Highest Level of Education</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select education level" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {educationLevels.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="special_skills" render={({ field }) => (
              <FormItem>
                <FormLabel>Special Skills / Expertise</FormLabel>
                <FormDescription>e.g. catering, welding, masonry, IT, tailoring</FormDescription>
                <FormControl><Textarea placeholder="List your special skills or expertise" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section 5: Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">5</span>
              Business Certificates
            </CardTitle>
            <CardDescription>Registration numbers and certificates (if available)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="bir_registration_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>BIR Registration Number</FormLabel>
                  <FormControl><Input placeholder="If applicable" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nis_registration_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>NIS Registration Number</FormLabel>
                  <FormControl><Input placeholder="If applicable" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="vat_registration_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT Registration Number</FormLabel>
                  <FormControl><Input placeholder="If applicable" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="space-y-3 pt-2">
              <FormField control={form.control} name="has_certificate_of_registration" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">I have a Certificate of Registration / Incorporation</FormLabel>
                </FormItem>
              )} />
              <FormField control={form.control} name="has_certificate_of_continuance" render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">I have a Certificate of Continuance</FormLabel>
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Human Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">6</span>
              Human Resources
            </CardTitle>
            <CardDescription>Staffing information for your business</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="num_permanent_staff" render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Permanent Staff</FormLabel>
                <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="num_temporary_staff" render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Temporary Staff</FormLabel>
                <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* Section 7: Financial Capacity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">7</span>
              Financial Capacity
            </CardTitle>
            <CardDescription>Banking details for your business</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="bank_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Bank / Financial Institution</FormLabel>
                <FormControl><Input placeholder="e.g. GCB Bank" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="bank_branch" render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <FormControl><Input placeholder="e.g. Accra Main Branch" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateProfileMutation.isPending} className="min-w-[140px]">
            {updateProfileMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}