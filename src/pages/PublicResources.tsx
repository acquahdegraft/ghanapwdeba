import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock, ArrowRight, BookOpen, Briefcase, Scale, Wallet } from "lucide-react";

const resourceCategories = [
  {
    icon: BookOpen,
    title: "Business Guides",
    description: "Step-by-step guides on starting and growing your business.",
    count: 12,
  },
  {
    icon: Briefcase,
    title: "Templates & Tools",
    description: "Business plan templates, financial calculators, and more.",
    count: 8,
  },
  {
    icon: Scale,
    title: "Legal Resources",
    description: "Information on business registration, contracts, and regulations.",
    count: 6,
  },
  {
    icon: Wallet,
    title: "Funding Opportunities",
    description: "Grants, loans, and funding programs for PWD entrepreneurs.",
    count: 15,
  },
];

const sampleResources = [
  {
    title: "Getting Started: A Guide for PWD Entrepreneurs",
    category: "Business Guide",
    description: "Comprehensive guide covering business registration, accessibility considerations, and support programs.",
    isPublic: true,
  },
  {
    title: "Business Plan Template",
    category: "Template",
    description: "Professional business plan template tailored for PWD-owned businesses.",
    isPublic: false,
  },
  {
    title: "Funding Directory 2025",
    category: "Funding",
    description: "Updated list of grants, microfinance, and funding programs available to PWD entrepreneurs.",
    isPublic: false,
  },
  {
    title: "Disability Rights in Business",
    category: "Legal",
    description: "Know your rights as a PWD business owner under Ghanaian law.",
    isPublic: true,
  },
];

export default function PublicResources() {
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
                <p className="text-sm font-medium text-primary">{category.count} resources</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Resources */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Featured Resources</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {sampleResources.map((resource) => (
              <div
                key={resource.title}
                className="rounded-xl border bg-card p-6"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {resource.category}
                  </span>
                  {!resource.isPublic && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      Members Only
                    </span>
                  )}
                </div>
                <h3 className="mb-2 font-semibold">{resource.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{resource.description}</p>
                {resource.isPublic ? (
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/login">Sign in to Access</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
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
                  <p className="font-medium">40+ Business Resources</p>
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
