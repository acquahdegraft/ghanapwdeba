import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
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
  );
}
