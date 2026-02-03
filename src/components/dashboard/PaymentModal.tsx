import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
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

type PaymentStep = "input" | "processing" | "success" | "failed";

// Rate limiting: prevent rapid payment initiations
const MIN_PAYMENT_INTERVAL = 60000; // 1 minute between payment attempts
let lastPaymentTime = 0;

export function PaymentModal({ open, onOpenChange, amount = 100, paymentType = "membership_dues" }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("input");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("input");
        setPhone("");
        setReference("");
      }, 300);
    }
  }, [open]);

  const handleInitiatePayment = async () => {
    if (!session?.access_token) {
      toast.error("Please log in to make a payment");
      return;
    }

    // Rate limiting: prevent rapid payment initiations
    const now = Date.now();
    if (now - lastPaymentTime < MIN_PAYMENT_INTERVAL) {
      const waitSeconds = Math.ceil((MIN_PAYMENT_INTERVAL - (now - lastPaymentTime)) / 1000);
      toast.error(`Please wait ${waitSeconds} seconds before initiating another payment`);
      return;
    }
    lastPaymentTime = now;

    setStep("processing");

    try {
      // Format phone number for Ghana
      let formattedPhone = phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0");
      if (formattedPhone && !formattedPhone.startsWith("0")) {
        formattedPhone = "0" + formattedPhone;
      }

      // Build return URL for callback
      const returnUrl = `${window.location.origin}/dashboard/payment-callback?status=success`;

      // Call the process-payment edge function (server-side Hubtel API)
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          amount,
          email: session.user.email,
          phone: formattedPhone,
          payment_type: paymentType,
          customer_name: session.user.user_metadata?.full_name || "Member",
          return_url: returnUrl,
        },
      });

      if (error) {
        throw new Error(error.message || "Payment initiation failed");
      }

      if (!data?.success || !data?.checkout_url) {
        throw new Error(data?.error || "Failed to create checkout session");
      }

      setReference(data.reference);
      
      toast.success("Redirecting to payment page...");
      
      // Redirect to Hubtel checkout
      window.location.href = data.checkout_url;

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setStep("failed");
    }
  };

  const handleClose = () => {
    if (step === "processing") {
      return; // Don't close while processing
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
            {step === "success" && "Payment Successful"}
            {step === "failed" && "Payment Failed"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Complete your payment securely with Hubtel"}
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
                Enter your mobile money number for faster checkout
              </p>
            </div>

            {/* Supported Payment Methods */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <p className="text-sm font-medium mb-2">Supported Payment Methods</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-600">
                  MTN MoMo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600">
                  Vodafone Cash
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-600">
                  AirtelTigo
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-600">
                  Bank Cards
                </span>
              </div>
            </div>

            <Button onClick={handleInitiatePayment} className="w-full gradient-primary" size="lg">
              <ExternalLink className="mr-2 h-4 w-4" />
              Proceed to Pay GHS {amount.toFixed(2)}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Powered by Hubtel • Secure payment processing
            </p>
          </div>
        )}

        {step === "processing" && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Creating payment session...</p>
              <p className="text-sm text-muted-foreground">You'll be redirected to complete payment</p>
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
              {reference && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reference: <span className="font-mono">{reference}</span>
                </p>
              )}
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
              <p className="text-muted-foreground">Please try again or contact support</p>
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
