import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signIn, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please confirm your email before signing in.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-xl font-bold text-primary-foreground">G</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">GPWDEBA</h2>
              <p className="text-xs text-muted-foreground">Member Portal</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your member portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="h-11 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Not a member yet?{" "}
            <Link
              to="/register"
              className="inline-flex items-center font-medium text-primary hover:underline"
            >
              Apply for membership
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel - Hero */}
      <div className="hidden lg:flex lg:flex-1 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="max-w-md">
            <h2 className="mb-6 text-4xl font-bold leading-tight">
              Empowering PWD Entrepreneurs Across Ghana
            </h2>
            <p className="mb-8 text-lg text-primary-foreground/80">
              Join a community of over 500+ entrepreneurs with disabilities
              building successful businesses and advocating for inclusive
              economic opportunities.
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
  );
}
