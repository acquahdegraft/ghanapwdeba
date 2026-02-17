import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpeg";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const navLinks = [
  { to: "/about", label: "About" },
  { to: "/membership", label: "Membership" },
  { to: "/events", label: "Events" },
  { to: "/resources", label: "Resources" },
  { to: "/contact", label: "Contact" },
];

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="GPWDEBA Logo" className="h-10 w-10 rounded-lg object-cover" />
          <span className="hidden font-bold sm:inline">GPWDEBA</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="gradient-primary">
              <Link to="/register">Join Now</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2" />
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary"
                >
                  Sign In
                </Link>
                <Button asChild className="gradient-primary mt-2">
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    Join Now
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
