import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const benefits = [
  "Access to business development resources",
  "Networking with 500+ PWD entrepreneurs",
  "Advocacy representation at national level",
  "Training workshops and capacity building",
  "Funding opportunity notifications",
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-2/5 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-12 text-primary-foreground">
          <div className="max-w-sm">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            
            <h2 className="mb-4 text-3xl font-bold">
              Join GPWDEBA Today
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Become part of Ghana's leading association for entrepreneurs and business persons with disabilities.
            </p>

            <div className="space-y-4">
              <p className="text-sm font-medium text-primary-foreground/70 uppercase tracking-wider">
                Member Benefits
              </p>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile back link */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Logo */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">G</span>
            </div>
            <span className="text-lg font-bold">GPWDEBA</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-muted-foreground">
              Complete your membership application
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" placeholder="Kwame" required className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" placeholder="Asante" required className="h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+233 XX XXX XXXX"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater-accra">Greater Accra</SelectItem>
                  <SelectItem value="ashanti">Ashanti</SelectItem>
                  <SelectItem value="western">Western</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="eastern">Eastern</SelectItem>
                  <SelectItem value="northern">Northern</SelectItem>
                  <SelectItem value="upper-east">Upper East</SelectItem>
                  <SelectItem value="upper-west">Upper West</SelectItem>
                  <SelectItem value="volta">Volta</SelectItem>
                  <SelectItem value="bono">Bono</SelectItem>
                  <SelectItem value="bono-east">Bono East</SelectItem>
                  <SelectItem value="ahafo">Ahafo</SelectItem>
                  <SelectItem value="north-east">North East</SelectItem>
                  <SelectItem value="savannah">Savannah</SelectItem>
                  <SelectItem value="oti">Oti</SelectItem>
                  <SelectItem value="western-north">Western North</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Type of business</Label>
              <Input
                id="businessType"
                placeholder="e.g., Retail, Agriculture, Services"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                  className="h-10 pr-10"
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
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="h-11 w-full gradient-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Creating account..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create account
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
