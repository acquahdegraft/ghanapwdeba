import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">G</span>
          </div>
          <span className="hidden font-bold sm:inline">GPWDEBA</span>
        </Link>

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
  );
}
