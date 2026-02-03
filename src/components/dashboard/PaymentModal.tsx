import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  paymentType?: string;
}

type PaymentStep = "input" | "processing";

// Rate limiting: prevent rapid payment initiations
const MIN_PAYMENT_INTERVAL = 60000; // 1 minute between payment attempts
let lastPaymentTime = 0;

export function PaymentModal({ open, onOpenChange, amount = 100, paymentType = "membership_dues" }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("input");
  const [phone, setPhone] = useState("");
  const { user, session } = useAuth();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("input");
        setPhone("");
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
      // Build return URL - user will be redirected here after payment
      const returnUrl = `${window.location.origin}/dashboard/payments?payment=success`;

      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          amount,
          email: user?.email,
          phone: phone || "",
          payment_type: paymentType,
          customer_name: user?.user_metadata?.full_name || "Member",
          return_url: returnUrl,
        },
      });

      if (error) throw error;

      if (data.success && data.checkout_url) {
        toast.success("Redirecting to payment page...");
        // Redirect to Hubtel checkout page
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setStep("input");
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
            {step === "processing" && "Redirecting to Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "You'll be redirected to Hubtel's secure payment page"}
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

            {/* Phone Input (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
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
                Pre-fill your mobile money number for faster checkout
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
              <p className="font-medium">Preparing checkout...</p>
              <p className="text-sm text-muted-foreground">You'll be redirected to Hubtel's secure payment page</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
