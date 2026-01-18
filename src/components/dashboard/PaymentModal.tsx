import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, XCircle, Phone, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  paymentType?: string;
}

type PaymentStep = "input" | "processing" | "pending" | "success" | "failed";
type Provider = "mtn" | "vodafone" | "airteltigo";

const providerConfig = {
  mtn: {
    name: "MTN Mobile Money",
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  vodafone: {
    name: "Vodafone Cash",
    color: "bg-red-500",
    textColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  airteltigo: {
    name: "AirtelTigo Money",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

export function PaymentModal({ open, onOpenChange, amount = 100, paymentType = "membership_dues" }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("input");
  const [provider, setProvider] = useState<Provider>("mtn");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [displayText, setDisplayText] = useState("");
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("input");
        setPhone("");
        setReference("");
        setDisplayText("");
      }, 300);
    }
  }, [open]);

  const handleInitiatePayment = async () => {
    if (!phone || phone.length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!session?.access_token) {
      toast.error("Please log in to make a payment");
      return;
    }

    setStep("processing");

    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          amount,
          email: user?.email,
          phone,
          provider,
          payment_type: paymentType,
        },
      });

      if (error) throw error;

      if (data.success) {
        setReference(data.reference);
        setDisplayText(data.display_text);
        setStep("pending");
        
        // Start polling for verification
        pollPaymentStatus(data.reference);
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setStep("failed");
    }
  };

  const pollPaymentStatus = async (ref: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    const checkStatus = async () => {
      attempts++;
      
      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { reference: ref },
        });

        if (error) throw error;

        if (data.status === "completed") {
          setStep("success");
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          toast.success("Payment successful! Your membership is now active.");
          return;
        } else if (data.status === "failed") {
          setStep("failed");
          toast.error("Payment failed. Please try again.");
          return;
        }

        // Still pending, continue polling
        if (attempts < maxAttempts) {
          setTimeout(() => checkStatus(), 5000);
        } else {
          toast.info("Payment is still processing. Check your payment history later.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        if (attempts < maxAttempts) {
          setTimeout(() => checkStatus(), 5000);
        }
      }
    };

    // Start checking after 10 seconds (give user time to authorize)
    setTimeout(() => checkStatus(), 10000);
  };

  const handleClose = () => {
    if (step === "processing" || step === "pending") {
      toast.info("Payment is being processed. You can close this and check your payment history.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "input" && "Pay Membership Dues"}
            {step === "processing" && "Processing Payment"}
            {step === "pending" && "Authorize Payment"}
            {step === "success" && "Payment Successful"}
            {step === "failed" && "Payment Failed"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Choose your mobile money provider and enter your phone number"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-6">
            {/* Amount Display */}
            <div className="rounded-xl bg-primary/5 p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount to Pay</p>
              <p className="text-3xl font-bold text-primary">GHS {amount.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Annual Membership Dues</p>
            </div>

            {/* Provider Selection */}
            <div className="space-y-3">
              <Label>Select Mobile Money Provider</Label>
              <RadioGroup value={provider} onValueChange={(v) => setProvider(v as Provider)} className="space-y-2">
                {(Object.keys(providerConfig) as Provider[]).map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                      provider === p 
                        ? `${providerConfig[p].borderColor} ${providerConfig[p].bgColor}` 
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={p} />
                    <div className={`h-8 w-8 rounded-lg ${providerConfig[p].color} flex items-center justify-center`}>
                      <Smartphone className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">{providerConfig[p].name}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Phone Input */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="024 XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the phone number linked to your {providerConfig[provider].name} account
              </p>
            </div>

            <Button onClick={handleInitiatePayment} className="w-full gradient-primary" size="lg">
              Pay GHS {amount.toFixed(2)}
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Initiating payment...</p>
              <p className="text-sm text-muted-foreground">Please wait while we connect to {providerConfig[provider].name}</p>
            </div>
          </div>
        )}

        {step === "pending" && (
          <div className="py-6 text-center space-y-4">
            <div className={`h-16 w-16 rounded-full ${providerConfig[provider].bgColor} flex items-center justify-center mx-auto`}>
              <Smartphone className={`h-8 w-8 ${providerConfig[provider].textColor}`} />
            </div>
            <div>
              <p className="font-semibold text-lg">Check Your Phone</p>
              <p className="text-muted-foreground mt-1">{displayText || "A payment prompt has been sent to your phone"}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
              <p><strong>Amount:</strong> GHS {amount.toFixed(2)}</p>
              <p><strong>Reference:</strong> {reference}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for authorization...
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <p className="font-semibold text-lg">Payment Successful!</p>
              <p className="text-muted-foreground">Your membership has been activated</p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}

        {step === "failed" && (
          <div className="py-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-lg">Payment Failed</p>
              <p className="text-muted-foreground">Please try again or use a different payment method</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setStep("input")} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
