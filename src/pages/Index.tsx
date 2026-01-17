import { Link } from "react-router-dom";
import { ArrowRight, Users, Shield, Calendar, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Member Community",
    description: "Connect with 500+ PWD entrepreneurs across Ghana's 16 regions.",
  },
  {
    icon: Shield,
    title: "Advocacy & Support",
    description: "National representation and policy advocacy for inclusive business.",
  },
  {
    icon: Calendar,
    title: "Events & Training",
    description: "Access workshops, conferences, and networking opportunities.",
  },
  {
    icon: FileText,
    title: "Business Resources",
    description: "Download guides, templates, and funding opportunity alerts.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">G</span>
            </div>
            <span className="hidden font-bold sm:inline">GPWDEBA</span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/membership" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Membership
            </Link>
            <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Events
            </Link>
            <Link to="/resources" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Resources
            </Link>
            <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="gradient-primary">
              <Link to="/register">Join Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative gradient-hero overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxYjRkM2UiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse-soft" />
              Now accepting new members for 2025
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Empowering{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                PWD Entrepreneurs
              </span>{" "}
              Across Ghana
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Ghana Persons with Disabilities Entrepreneurs and Business Association — 
              fostering unity, breaking barriers, and creating equal opportunities in business.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-8 gradient-primary">
                <Link to="/register">
                  Become a Member
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8">
                <Link to="/login">
                  Member Login
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">500+</p>
              <p className="mt-1 text-sm text-muted-foreground">Active Members</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">16</p>
              <p className="mt-1 text-sm text-muted-foreground">Regions Covered</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">50+</p>
              <p className="mt-1 text-sm text-muted-foreground">Annual Events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Why Join GPWDEBA?</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              As a member, you gain access to resources, networks, and advocacy that help your business thrive.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Ready to Join Our Community?
          </h2>
          <p className="mb-8 text-primary-foreground/80">
            Start your membership application today and connect with fellow PWD entrepreneurs.
          </p>
          <Button
            size="lg"
            asChild
            className="h-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Link to="/register">
              Apply for Membership
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">G</span>
              </div>
              <div>
                <p className="text-sm font-semibold">GPWDEBA</p>
                <p className="text-xs text-muted-foreground">
                  Ghana PWDs Entrepreneurs & Business Association
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground">About</Link>
              <Link to="/contact" className="hover:text-foreground">Contact</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2025 GPWDEBA. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
