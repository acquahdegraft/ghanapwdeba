import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type PaymentStatus = "loading" | "success" | "failed" | "cancelled" | "pending";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [reference, setReference] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Get status from URL params
      const paymentStatus = searchParams.get("payment");
      const clientReference = searchParams.get("clientReference");
      const hubtelStatus = searchParams.get("status");
      
      setReference(clientReference);

      // Hubtel sends status in the return URL
      if (hubtelStatus === "Success" || paymentStatus === "success") {
        // Verify with our backend
        if (clientReference) {
          try {
            const { data, error } = await supabase.functions.invoke("verify-payment", {
              body: { reference: clientReference },
            });

            if (error) {
              console.error("Verification error:", error);
              setStatus("pending");
              return;
            }

            if (data.status === "completed") {
              setStatus("success");
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ["payments"] });
              queryClient.invalidateQueries({ queryKey: ["profile"] });
            } else if (data.status === "failed") {
              setStatus("failed");
            } else {
              setStatus("pending");
            }
          } catch (error) {
            console.error("Verification error:", error);
            setStatus("pending");
          }
        } else {
          setStatus("success");
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        }
      } else if (hubtelStatus === "Cancelled" || paymentStatus === "cancelled") {
        setStatus("cancelled");
      } else if (hubtelStatus === "Failed" || paymentStatus === "failed") {
        setStatus("failed");
      } else {
        // Default to pending if we can't determine status
        setStatus("pending");
      }
    };

    checkPaymentStatus();
  }, [searchParams, queryClient]);

  const handleCheckStatus = async () => {
    if (!reference || isCheckingStatus) return;

    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-hubtel-status", {
        body: { clientReference: reference },
      });

      setLastChecked(new Date());

      if (error) {
        console.error("Status check error:", error);
        toast.error("Unable to check payment status. Please try again.");
        return;
      }

      if (data.status === "completed") {
        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        toast.success("Payment confirmed!");
      } else if (data.status === "failed") {
        setStatus("failed");
        toast.error("Payment failed. Please try again.");
      } else if (data.status === "pending") {
        toast.info("Payment is still being processed. Please wait a moment and try again.");
      } else {
        toast.info(data.message || "Unable to determine payment status.");
      }
    } catch (error) {
      console.error("Status check error:", error);
      toast.error("Failed to check payment status. Please try again later.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleGoToPayments = () => {
    navigate("/dashboard/payments");
  };

  const handleTryAgain = () => {
    navigate("/dashboard/payments");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {status === "loading" && (
            <div className="text-center py-8 space-y-4">
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Verifying Payment</h2>
                <p className="text-muted-foreground mt-1">Please wait while we confirm your payment...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success">Payment Successful!</h2>
                <p className="text-muted-foreground mt-2">
                  Your membership dues have been paid successfully. Your account has been activated.
                </p>
                {reference && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Reference: <span className="font-mono">{reference}</span>
                  </p>
                )}
              </div>
              <Button onClick={handleGoToPayments} className="w-full mt-4">
                View Payment History
              </Button>
            </div>
          )}

          {status === "pending" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-12 w-12 text-warning" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-warning">Payment Processing</h2>
                <p className="text-muted-foreground mt-2">
                  Your payment is being processed. This may take a few moments.
                </p>
                {reference && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Reference: <span className="font-mono">{reference}</span>
                  </p>
                )}
                {lastChecked && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  onClick={handleCheckStatus} 
                  disabled={isCheckingStatus || !reference}
                  variant="default"
                  className="w-full"
                >
                  {isCheckingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check Payment Status
                    </>
                  )}
                </Button>
                <Button onClick={handleGoToPayments} variant="outline" className="w-full">
                  Go to Payment History
                </Button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-destructive">Payment Failed</h2>
                <p className="text-muted-foreground mt-2">
                  Unfortunately, your payment could not be completed. Please try again or contact support if the issue persists.
                </p>
                {reference && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Reference: <span className="font-mono">{reference}</span>
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleGoToPayments} className="flex-1">
                  View History
                </Button>
                <Button onClick={handleTryAgain} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {status === "cancelled" && (
            <div className="text-center py-8 space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <XCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Payment Cancelled</h2>
                <p className="text-muted-foreground mt-2">
                  You cancelled the payment process. No charges have been made to your account.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleGoToPayments} className="flex-1">
                  Go Back
                </Button>
                <Button onClick={handleTryAgain} className="flex-1">
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
