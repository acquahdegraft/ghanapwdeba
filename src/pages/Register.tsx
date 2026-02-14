import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useMembershipTypes } from "@/hooks/useMembershipTypes";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { toast } from "sonner";
import { z } from "zod";
import { disabilityTypeOptions, genderOptions } from "@/lib/ghanaRegions";
import { supabase } from "@/integrations/supabase/client";

const benefits = [
  "Access to business development resources",
  "Networking with 500+ PWD entrepreneurs",
  "Advocacy representation at national level",
  "Training workshops and capacity building",
  "Funding opportunity notifications",
];

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [disabilityType, setDisabilityType] = useState("");
  const [membershipTypeId, setMembershipTypeId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const { data: membershipTypes } = useMembershipTypes();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = registerSchema.safeParse({ 
      firstName, 
      lastName, 
      email, 
      phone, 
      password 
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUp(email, password, {
      full_name: `${firstName} ${lastName}`,
      phone,
      gender: gender || undefined,
      disability_type: disabilityType || undefined,
      membership_type_id: membershipTypeId || undefined,
    });
    
    if (error) {
      setIsLoading(false);
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    
    // Initiate registration payment via Hubtel
    toast.info("Registration successful! Redirecting to payment...", { duration: 5000 });
    
    try {
      // Small delay to allow the profile trigger to create the profile record
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const { data, error: fnError } = await supabase.functions.invoke(
        "initiate-registration-payment",
        {
          body: {
            email,
            fullName: `${firstName} ${lastName}`,
            phone,
          },
        }
      );

      if (fnError || !data?.checkoutUrl) {
        console.error("Registration payment error:", fnError || data);
        toast.warning(
          "Account created! Please check your email to verify, then log in to complete payment.",
          { duration: 8000 }
        );
        navigate("/login");
        return;
      }

      // Redirect to Hubtel checkout
      toast.success("Redirecting to payment gateway...", { duration: 3000 });
      window.location.href = data.checkoutUrl;
    } catch (paymentError) {
      console.error("Payment initiation failed:", paymentError);
      toast.warning(
        "Account created! Please check your email to verify, then log in to complete payment.",
        { duration: 8000 }
      );
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
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
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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
                    <Check className="h-3 w-3" aria-hidden="true" />
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
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
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
          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Registration form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name *</Label>
                <Input 
                  id="firstName" 
                  placeholder="Kwame" 
                  required 
                  className="h-10"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name *</Label>
                <Input 
                  id="lastName" 
                  placeholder="Asante" 
                  required 
                  className="h-10"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+233 XX XXX XXXX"
                required
                className="h-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="h-10" id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disabilityType">Disability type</Label>
                <Select value={disabilityType} onValueChange={setDisabilityType}>
                  <SelectTrigger className="h-10" id="disabilityType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {disabilityTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="membershipType">Membership type</Label>
              <Select value={membershipTypeId} onValueChange={setMembershipTypeId}>
                <SelectTrigger className="h-10" id="membershipType">
                  <SelectValue placeholder="Select membership type" />
                </SelectTrigger>
                <SelectContent>
                  {membershipTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} — GHS {type.annual_dues.toFixed(2)}/yr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  required
                  className="h-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="h-11 w-full gradient-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create account & Pay Registration Fee
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
