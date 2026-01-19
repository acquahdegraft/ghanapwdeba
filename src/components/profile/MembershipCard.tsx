import { useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function MembershipCard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const isActive = profile?.membership_status === "active";
  
  const generatePDF = async () => {
    if (!profile || !user) return;
    
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98], // Standard ID card size
      });

      // Card background - Ghana green gradient effect
      doc.setFillColor(27, 67, 50); // Deep forest green
      doc.rect(0, 0, 85.6, 53.98, "F");
      
      // Gold accent stripe
      doc.setFillColor(217, 164, 65); // Ghana gold
      doc.rect(0, 0, 85.6, 4, "F");
      doc.rect(0, 49.98, 85.6, 4, "F");

      // Header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("GHANA PWDs ENTREPRENEURS & BUSINESS ASSOCIATION", 42.8, 9, { align: "center" });
      
      doc.setFontSize(5);
      doc.setFont("helvetica", "normal");
      doc.text("OFFICIAL MEMBERSHIP CARD", 42.8, 13, { align: "center" });

      // Member info section
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(profile.full_name?.toUpperCase() || "MEMBER", 8, 22);

      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      
      if (profile.business_name) {
        doc.text(profile.business_name, 8, 27);
      }
      
      if (profile.region && profile.city) {
        doc.text(`${profile.city}, ${profile.region}`, 8, 31);
      } else if (profile.region) {
        doc.text(profile.region, 8, 31);
      }

      // Membership details
      doc.setTextColor(217, 164, 65);
      doc.setFontSize(5);
      doc.text("MEMBER ID", 8, 37);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text(profile.id.slice(0, 8).toUpperCase(), 8, 41);

      doc.setTextColor(217, 164, 65);
      doc.setFontSize(5);
      doc.text("STATUS", 35, 37);
      doc.setTextColor(isActive ? 34 : 220, isActive ? 197 : 38, isActive ? 94 : 38);
      doc.setFontSize(6);
      doc.text(isActive ? "ACTIVE" : "PENDING", 35, 41);

      if (profile.membership_expiry_date) {
        doc.setTextColor(217, 164, 65);
        doc.setFontSize(5);
        doc.text("VALID UNTIL", 55, 37);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(format(new Date(profile.membership_expiry_date), "MMM yyyy").toUpperCase(), 55, 41);
      }

      // Generate QR code
      const qrData = JSON.stringify({
        id: profile.id,
        name: profile.full_name,
        status: profile.membership_status,
        expiry: profile.membership_expiry_date,
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: "#1b4332",
          light: "#ffffff",
        },
      });

      // Add QR code
      doc.addImage(qrCodeDataUrl, "PNG", 66, 18, 15, 15);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(4);
      doc.text("Scan to verify", 73.5, 35, { align: "center" });

      // Footer
      doc.setTextColor(217, 164, 65);
      doc.setFontSize(4);
      doc.text("www.gpwdeba.org", 42.8, 47, { align: "center" });

      // Save the PDF
      doc.save(`GPWDEBA-Membership-${profile.full_name?.replace(/\s+/g, "-")}.pdf`);

      toast({
        title: "Card Downloaded",
        description: "Your membership card has been saved as PDF.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "M";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Membership Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Card Preview */}
        <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground shadow-lg">
          {/* Gold accents */}
          <div className="mb-3 h-1 rounded bg-accent" />
          
          <div className="mb-2 text-center">
            <p className="text-xs font-semibold tracking-wide">
              GHANA PWDs ENTREPRENEURS & BUSINESS ASSOCIATION
            </p>
            <p className="text-[10px] opacity-80">OFFICIAL MEMBERSHIP CARD</p>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-bold uppercase">
                {profile?.full_name || "Member Name"}
              </p>
              {profile?.business_name && (
                <p className="text-xs opacity-80">{profile.business_name}</p>
              )}
              {profile?.region && (
                <p className="text-xs opacity-80">
                  {profile.city ? `${profile.city}, ` : ""}{profile.region}
                </p>
              )}
              
              <div className="mt-3 flex gap-4 text-xs">
                <div>
                  <p className="text-accent">MEMBER ID</p>
                  <p className="font-mono">{profile?.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-accent">STATUS</p>
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="mt-0.5 text-[10px]"
                  >
                    {isActive ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" /> Active
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-1 h-3 w-3" /> Pending
                      </>
                    )}
                  </Badge>
                </div>
                {profile?.membership_expiry_date && (
                  <div>
                    <p className="text-accent">VALID UNTIL</p>
                    <p className="font-mono">
                      {format(new Date(profile.membership_expiry_date), "MMM yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/90 text-xl font-bold text-primary">
              {initials}
            </div>
          </div>

          <div className="mt-3 h-1 rounded bg-accent" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Download your official membership card with QR code for verification.
          </p>
          <Button onClick={generatePDF} disabled={generating || !profile}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
