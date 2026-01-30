import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowRight, BookOpen, Briefcase, Scale, Wallet, ExternalLink, Loader2 } from "lucide-react";
import { useResources, getResourceSignedUrl } from "@/hooks/useResources";
import { toast } from "sonner";

const SITE_NAME = "Ghana Persons with Disability Entrepreneurs and Business Association";

const resourceCategories = [
  {
    icon: BookOpen,
    title: "Business Guides",
    description: "Step-by-step guides on starting and growing your business.",
    category: "guides",
  },
  {
    icon: Briefcase,
    title: "Templates & Tools",
    description: "Business plan templates, financial calculators, and more.",
    category: "templates",
  },
  {
    icon: Scale,
    title: "Legal Resources",
    description: "Information on business registration, contracts, and regulations.",
    category: "policies",
  },
  {
    icon: Wallet,
    title: "Funding Opportunities",
    description: "Grants, loans, and funding programs for PWD entrepreneurs.",
    category: "general",
  },
];

export default function PublicResources() {
  const { data: resources, isLoading } = useResources();

  useEffect(() => {
    document.title = `Resources | ${SITE_NAME}`;
  }, []);

  const handleDownload = async (fileUrl: string | null, externalUrl: string | null) => {
    try {
      if (externalUrl) {
        window.open(externalUrl, "_blank");
        return;
      }

      if (fileUrl) {
        const signedUrl = await getResourceSignedUrl(fileUrl);
        if (signedUrl) {
          window.open(signedUrl, "_blank");
        } else {
          toast.error("Unable to access the file. Please try again.");
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download the resource.");
    }
  };

  // Get count of resources per category
  const getCategoryCount = (category: string) => {
    return resources?.filter(r => r.category === category).length || 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Business Resources
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Access guides, templates, and tools to help you start, grow, and manage 
              your business successfully.
            </p>
            <Button size="lg" asChild className="gradient-primary">
              <Link to="/register">
                Get Full Access <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Resource Categories</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {resourceCategories.map((category) => (
              <div
                key={category.title}
                className="rounded-xl border bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{category.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{category.description}</p>
                <p className="text-sm font-medium text-primary">
                  {getCategoryCount(category.category)} resources
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Resources */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Featured Resources</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : resources && resources.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resources.slice(0, 6).map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-xl border bg-card p-6"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                      {resource.category}
                    </span>
                    {resource.file_type && (
                      <span className="text-xs text-muted-foreground uppercase">
                        {resource.file_type}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold">{resource.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {resource.description || "No description available."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(resource.file_url, resource.external_url)}
                  >
                    {resource.external_url ? (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        View
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Resources are coming soon. Become a member to get notified!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold">Member Resource Benefits</h2>
            <div className="mb-8 grid gap-4 text-left sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Exclusive Business Resources</p>
                  <p className="text-sm text-muted-foreground">Templates, guides, and tools</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <Download className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Unlimited Downloads</p>
                  <p className="text-sm text-muted-foreground">Access all resources anytime</p>
                </div>
              </div>
            </div>
            <Button size="lg" asChild className="gradient-primary">
              <Link to="/register">
                Become a Member
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <LandingFooter />
      </div>
    </div>
  );
}
