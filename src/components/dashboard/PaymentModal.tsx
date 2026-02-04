import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, ExternalLink, CheckCircle2, XCircle, AlertTriangle, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import CheckoutSdk from "@hubteljs/checkout";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount?: number;
  paymentType?: string;
}

type PaymentStep = "input" | "processing" | "success" | "failed" | "unavailable";

// Rate limiting: prevent rapid payment initiations
const MIN_PAYMENT_INTERVAL = 60000; // 1 minute between payment attempts
let lastPaymentTime = 0;

// Generate a unique client reference
function generateClientReference(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `GPAD-${timestamp}-${randomPart}`.toUpperCase();
}

// Timeout for Hubtel modal loading (15 seconds)
const HUBTEL_LOAD_TIMEOUT = 15000;

export function PaymentModal({ open, onOpenChange, amount = 100, paymentType = "membership_dues" }: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("input");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("input");
        setPhone("");
        setReference("");
        setErrorMessage("");
        setCopied(false);
      }, 300);
    }
  }, [open]);

  const handleCopyReference = async () => {
    if (reference) {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      toast.success("Reference copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

      // Fetch Hubtel config from edge function (keeps credentials secure)
      const { data: hubtelConfig, error: configError } = await supabase.functions.invoke("get-hubtel-config");
      
      if (configError || !hubtelConfig) {
        setErrorMessage("Unable to connect to the payment service. Please try again later or use the manual payment option.");
        setStep("unavailable");
        return;
      }

      if (!hubtelConfig.merchantAccount || !hubtelConfig.basicAuth) {
        setErrorMessage("Payment service is currently being configured. Please use the manual payment option below.");
        setStep("unavailable");
        return;
      }

      // Initialize checkout using the npm package
      const checkout = new CheckoutSdk();

      const purchaseInfo = {
        amount: amount,
        purchaseDescription: `GPWDEBA Membership Dues - ${paymentType}`,
        customerPhoneNumber: formattedPhone || "233000000000",
        clientReference: clientReference,
      };

      const config = {
        branding: "enabled" as const,
        callbackUrl: hubtelConfig.callbackUrl,
        merchantAccount: hubtelConfig.merchantAccount,
        basicAuth: hubtelConfig.basicAuth,
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

      // Set a timeout in case Hubtel modal doesn't load
      let loadTimeout: NodeJS.Timeout | null = null;
      let modalOpened = false;

      loadTimeout = setTimeout(() => {
        if (!modalOpened) {
          console.error("Hubtel checkout timed out");
          setErrorMessage("The payment service is taking too long to respond. This may be due to high traffic or temporary service issues.");
          setStep("unavailable");
        }
      }, HUBTEL_LOAD_TIMEOUT);

      // Open the Hubtel checkout modal
      checkout.openModal({
        purchaseInfo,
        config,
        callBacks: {
          onInit: () => {
            console.log("Hubtel checkout initialized");
            modalOpened = true;
            if (loadTimeout) clearTimeout(loadTimeout);
          },
          onPaymentSuccess: async (data: unknown) => {
            console.log("Payment succeeded, response data:", JSON.stringify(data, null, 2));
            checkout.closePopUp();
            setStep("success");
            // Refresh data
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Payment successful! Your membership is now active.");
          },
          onPaymentFailure: (error: unknown) => {
            console.error("Payment failed, error details:", JSON.stringify(error, null, 2));
            console.error("Payment failure - raw error:", error);
            checkout.closePopUp();
            const errorMsg = typeof error === 'object' && error !== null && 'message' in error 
              ? String((error as { message: string }).message) 
              : "Payment was not completed";
            setErrorMessage(errorMsg);
            setStep("failed");
            toast.error("Payment failed. Please try again.");
          },
          onLoad: () => {
            console.log("Hubtel checkout loaded");
            modalOpened = true;
            if (loadTimeout) clearTimeout(loadTimeout);
            setStep("input"); // Reset to input since modal is now handling it
          },
          onClose: () => {
            console.log("Hubtel checkout closed");
            if (loadTimeout) clearTimeout(loadTimeout);
            if (step === "processing") {
              console.log("Checkout closed while still processing - user may have cancelled or Hubtel had an error");
              setStep("input");
            }
          },
        },
      });

    } catch (error: unknown) {
      console.error("Payment error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred while initiating payment.");
      setStep("unavailable");
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
            {step === "unavailable" && "Payment Service Unavailable"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" && "Complete your payment securely with Hubtel"}
            {step === "unavailable" && "Don't worry - you can still complete your payment manually"}
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
            <div className="flex flex-col gap-2">
              <Button onClick={() => setStep("input")} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => setStep("unavailable")} className="w-full">
                Manual Payment Option
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full text-muted-foreground">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "unavailable" && (
          <div className="py-4 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">Online payment temporarily unavailable</p>
                <p className="text-muted-foreground mt-1">{errorMessage || "The payment service is currently experiencing issues."}</p>
              </div>
            </div>

            {/* Manual Payment Instructions */}
            <div className="space-y-3">
              <p className="font-medium text-sm">Complete your payment manually:</p>
              
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Amount:</span> GHS {amount.toFixed(2)}</p>
                  
                  {reference && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-medium">Reference:</span>{" "}
                        <span className="font-mono text-xs">{reference}</span>
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleCopyReference}
                        className="h-7 px-2"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium">Mobile Money Options:</p>
                  <div className="grid gap-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-foreground">MTN MoMo:</span>
                      <span>Dial *170# → Send Money → Enter merchant number</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-foreground">Vodafone Cash:</span>
                      <span>Dial *110# → Send Money → Enter merchant number</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-foreground">AirtelTigo:</span>
                      <span>Dial *501# → Send Money → Enter merchant number</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Important:</span> Use the reference number above when making payment. 
                    Contact us at <span className="font-medium">support@gpwdeba.org</span> after payment for confirmation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => setStep("input")} className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Try Online Payment Again
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

