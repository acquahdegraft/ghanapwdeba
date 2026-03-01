import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Check URL params for verification status
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (error || errorDescription) {
      setStatus("error");
    } else {
      // If no error params, assume success (Supabase redirects here after verification)
      setStatus("success");
    }
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col">
    <div className="flex flex-1">
      {/* Left Panel - Content */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <img src={logo} alt="GPWDEBA Logo" className="h-12 w-12 rounded-xl object-cover" />
            <div className="text-left">
              <h2 className="text-lg font-bold">GPWDEBA</h2>
              <p className="text-xs text-muted-foreground">Member Portal</p>
            </div>
          </div>

          {status === "loading" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Email Verified!</h1>
                <p className="text-muted-foreground">
                  Your email has been successfully verified. You can now sign in to your account and start exploring the member portal.
                </p>
              </div>
              <Button asChild className="h-11 w-full gradient-primary">
                <Link to="/login">
                  Sign in to your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Verification Failed</h1>
                <p className="text-muted-foreground">
                  We couldn't verify your email. The link may have expired or already been used.
                </p>
              </div>
              <div className="space-y-3">
                <Button asChild className="h-11 w-full gradient-primary">
                  <Link to="/register">
                    Try registering again
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 w-full">
                  <Link to="/login">Back to login</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="hidden lg:flex lg:flex-1 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="max-w-md">
            <h2 className="mb-6 text-4xl font-bold leading-tight">
              Welcome to the GPWDEBA Community
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Thank you for verifying your email. You're now ready to connect with fellow entrepreneurs, access resources, and participate in events.
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-primary-foreground/70">Active Members</p>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <p className="text-3xl font-bold">16</p>
                <p className="text-sm text-primary-foreground/70">Regions</p>
              </div>
              <div className="h-12 w-px bg-primary-foreground/20" />
              <div>
                <p className="text-3xl font-bold">50+</p>
                <p className="text-sm text-primary-foreground/70">Events/Year</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <LandingFooter />
    </div>
  );
}
