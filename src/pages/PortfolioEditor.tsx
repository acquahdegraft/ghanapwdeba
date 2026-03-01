import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyPortfolio, useSavePortfolio } from "@/hooks/usePortfolio";
import { useProfile } from "@/hooks/useProfile";
import { Loader2, Plus, X, Eye, Globe, Lock, Briefcase, Wrench, User, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function PortfolioEditor() {
  const { data: portfolio, isLoading } = useMyPortfolio();
  const { data: profile } = useProfile();
  const saveMutation = useSavePortfolio();

  const isActive = profile?.membership_status === "active";

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState(false);
  const [newService, setNewService] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (portfolio) {
      setHeadline(portfolio.headline || "");
      setBio(portfolio.bio || "");
      setServices(portfolio.services || []);
      setSkills(portfolio.skills || []);
      setYearsOfExperience(portfolio.years_of_experience ?? "");
      setWebsiteUrl(portfolio.website_url || "");
      setSocialLinks(portfolio.social_links || {});
      setIsPublished(portfolio.is_published);
      setSlug(portfolio.slug || "");
    } else if (profile) {
      // Generate default slug from name
      const defaultSlug = (profile.full_name || "member")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(defaultSlug);
    }
  }, [portfolio, profile]);

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleSave = () => {
    if (!headline.trim()) {
      return;
    }
    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    saveMutation.mutate({
      slug: cleanSlug || "my-portfolio",
      headline,
      bio,
      services,
      skills,
      years_of_experience: yearsOfExperience === "" ? null : Number(yearsOfExperience),
      website_url: websiteUrl || null,
      social_links: socialLinks,
      is_published: isPublished,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="My Portfolio" description="Showcase your services">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isActive && !portfolio) {
    return (
      <DashboardLayout title="My Portfolio" description="Showcase your services">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Portfolio Locked</h3>
            <p className="text-center text-muted-foreground max-w-md">
              Only active paid members can create a portfolio. Please ensure your membership dues are paid to unlock this feature.
            </p>
            <Button asChild>
              <Link to="/dashboard/payments">Pay Membership Dues</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Portfolio" description="Showcase your services to the public">
      <div className="space-y-6">
        {/* Publish Toggle & Preview */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <div className="flex items-center gap-2">
                {isPublished ? (
                  <><Globe className="h-4 w-4 text-success" /><span className="text-sm font-medium">Published — visible to the public</span></>
                ) : (
                  <><Lock className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium text-muted-foreground">Draft — only you can see this</span></>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {portfolio && isPublished && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/portfolios/${portfolio.slug}`} target="_blank">
                    <Eye className="mr-1.5 h-4 w-4" /> Preview
                  </Link>
                </Button>
              )}
              <Button onClick={handleSave} disabled={saveMutation.isPending || !headline.trim()}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="about" className="space-y-4">
          <TabsList>
            <TabsTrigger value="about"><User className="mr-1.5 h-4 w-4" />About</TabsTrigger>
            <TabsTrigger value="services"><Briefcase className="mr-1.5 h-4 w-4" />Services</TabsTrigger>
            <TabsTrigger value="skills"><Wrench className="mr-1.5 h-4 w-4" />Skills</TabsTrigger>
            <TabsTrigger value="links"><LinkIcon className="mr-1.5 h-4 w-4" />Links</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About You</CardTitle>
                <CardDescription>Tell potential clients about yourself and your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Portfolio URL Slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/portfolios/</span>
                    <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="your-name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional Headline *</Label>
                  <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Professional Tailor & Fashion Designer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about yourself, your experience, and what makes your services unique..." rows={5} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" type="number" min={0} value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value === "" ? "" : parseInt(e.target.value))} placeholder="e.g. 5" className="w-32" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services You Offer</CardTitle>
                <CardDescription>List the services clients can hire you for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="e.g. Custom Tailoring" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddService())} />
                  <Button type="button" variant="secondary" onClick={handleAddService}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {services.map((s, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 py-1.5 px-3">
                      {s}
                      <button onClick={() => setServices(services.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  {services.length === 0 && <p className="text-sm text-muted-foreground">No services added yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
                <CardDescription>Highlight your key skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="e.g. Sewing, Pattern Making" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())} />
                  <Button type="button" variant="secondary" onClick={handleAddSkill}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <Badge key={i} variant="outline" className="gap-1 py-1.5 px-3">
                      {s}
                      <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle>Website & Social Links</CardTitle>
                <CardDescription>Help clients find you online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input id="website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input id="facebook" value={socialLinks.facebook || ""} onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })} placeholder="https://facebook.com/yourpage" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" value={socialLinks.instagram || ""} onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })} placeholder="https://instagram.com/yourhandle" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input id="whatsapp" value={socialLinks.whatsapp || ""} onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })} placeholder="+233XXXXXXXXX" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
