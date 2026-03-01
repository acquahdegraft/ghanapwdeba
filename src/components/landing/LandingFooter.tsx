import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/gpwdeba", label: "Facebook" },
  { icon: Twitter, href: "https://x.com/gpwdeba", label: "X (Twitter)" },
  { icon: Instagram, href: "https://instagram.com/gpwdeba", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/gpwdeba", label: "LinkedIn" },
];

export function LandingFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="GPWDEBA Logo" className="h-8 w-8 rounded-lg object-cover" />
              <div>
                <p className="text-sm font-semibold">GPWDEBA</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ghana Persons with Disability Entrepreneurs & Business Association
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/about" className="hover:text-foreground">About Us</Link>
              <Link to="/membership" className="hover:text-foreground">Membership</Link>
              <Link to="/events" className="hover:text-foreground">Events</Link>
              <Link to="/resources" className="hover:text-foreground">Resources</Link>
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/contact" className="hover:text-foreground">Contact Us</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Care of Dobro African Cola</p>
              <p>Afri City, Nama, Kobe</p>
              <p>Digital Address: EG-158-4805</p>
              <p>House No: DB*T-123D/5</p>
              <p>Reg No: CG054390824</p>
              <p>+233 20 119 5588</p>
              <a href="mailto:info@gpwdeba.org" className="block hover:text-foreground">
                info@gpwdeba.org
              </a>
              <a href="mailto:support@gpwdeba.org" className="block hover:text-foreground">
                support@gpwdeba.org
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 GPWDEBA. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered & Developed by <span className="font-medium text-foreground">The Creative Computer Solutions</span>
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
