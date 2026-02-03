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

// Generate a unique client reference
function generateClientReference(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `GPAD-${timestamp}-${randomPart}`.toUpperCase();
}

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

  // Load Hubtel Checkout SDK
  useEffect(() => {
    // Check if script already loaded
    if (document.querySelector('script[src*="unified-pay.hubtel.com"]')) {
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://unified-pay.hubtel.com/js/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup - keep it loaded
    };
  }, []);

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
      const clientReference = generateClientReference();
      setReference(clientReference);

      // Format phone number for Ghana
      let formattedPhone = phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0");
      if (formattedPhone && !formattedPhone.startsWith("0")) {
        formattedPhone = "0" + formattedPhone;
      }
      // Convert to international format for Hubtel
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "233" + formattedPhone.substring(1);
      }

      // Check if Hubtel SDK is loaded
      const CheckoutSdk = (window as unknown as { CheckoutSdk?: new () => HubtelCheckout }).CheckoutSdk;
      if (!CheckoutSdk) {
        throw new Error("Payment system is loading. Please try again in a moment.");
      }

      // Get the callback URL for Hubtel webhook
      const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubtel-callback`;

      // Initialize checkout
      const checkout = new CheckoutSdk();

      const purchaseInfo = {
        amount: amount,
        purchaseDescription: `GPWDEBA Membership Dues - ${paymentType}`,
        customerPhoneNumber: formattedPhone || "233000000000",
        clientReference: clientReference,
      };

      // Get Hubtel credentials from environment
      const merchantAccount = import.meta.env.VITE_HUBTEL_MERCHANT_ACCOUNT;
      const basicAuth = import.meta.env.VITE_HUBTEL_BASIC_AUTH;

      if (!merchantAccount || !basicAuth) {
        throw new Error("Payment configuration is missing. Please contact support.");
      }

      const config = {
        branding: "enabled" as const,
        callbackUrl: callbackUrl,
        merchantAccount: parseInt(merchantAccount),
        basicAuth: basicAuth,
        integrationType: "External" as const,
      };

      // First, create a pending payment record
      const { error: insertError } = await supabase.functions.invoke("create-pending-payment", {
        body: {
          amount,
          payment_type: paymentType,
          reference: clientReference,
        },
      });

      if (insertError) {
        console.warn("Could not create pending payment record:", insertError);
        // Continue anyway - the callback will handle it
      }

      // Open the Hubtel checkout modal
      checkout.openModal({
        purchaseInfo,
        config,
        callBacks: {
          onInit: () => {
            console.log("Hubtel checkout initialized");
          },
          onPaymentSuccess: async () => {
            console.log("Payment succeeded");
            checkout.closePopUp();
            setStep("success");
            // Refresh data
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Payment successful! Your membership is now active.");
          },
          onPaymentFailure: () => {
            console.log("Payment failed");
            checkout.closePopUp();
            setStep("failed");
            toast.error("Payment failed. Please try again.");
          },
          onLoad: () => {
            console.log("Hubtel checkout loaded");
            setStep("input"); // Reset to input since modal is now handling it
          },
          onClose: () => {
            console.log("Hubtel checkout closed");
            if (step === "processing") {
              setStep("input");
            }
          },
        },
      });

    } catch (error: unknown) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to initiate payment");
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
            {step === "processing" && "Opening Payment"}
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
              <p className="font-medium">Opening payment window...</p>
              <p className="text-sm text-muted-foreground">Please complete your payment in the popup</p>
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

// Type definitions for Hubtel SDK
interface HubtelCheckout {
  openModal: (options: {
    purchaseInfo: {
      amount: number;
      purchaseDescription: string;
      customerPhoneNumber: string;
      clientReference: string;
    };
    config: {
      branding: "enabled" | "disabled";
      callbackUrl: string;
      merchantAccount: number;
      basicAuth: string;
      integrationType: "External" | "Internal";
    };
    callBacks: {
      onInit?: () => void;
      onPaymentSuccess?: () => void;
      onPaymentFailure?: () => void;
      onLoad?: () => void;
      onClose?: () => void;
    };
  }) => void;
  closePopUp: () => void;
}
