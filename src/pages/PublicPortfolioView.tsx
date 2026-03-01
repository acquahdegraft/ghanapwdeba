import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePublicPortfolioBySlug } from "@/hooks/usePortfolio";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  MapPin, Briefcase, Globe, Clock, ArrowLeft, Loader2,
  Mail, Phone, Send, ExternalLink, ImageIcon,
} from "lucide-react";

export default function PublicPortfolioView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: portfolio, isLoading } = usePublicPortfolioBySlug(slug || "");

  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-portfolio-contact", {
        body: {
          portfolioSlug: slug,
          memberName: portfolio?.full_name,
          senderName: contactName,
          senderEmail: contactEmail,
          message: contactMessage,
        },
      });
      if (error) throw error;
      toast.success("Your message has been sent successfully!");
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <LandingHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <LandingFooter />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <LandingHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
          <h2 className="text-2xl font-bold">Portfolio Not Found</h2>
          <p className="text-muted-foreground">This portfolio may have been removed or unpublished.</p>
          <Button asChild variant="outline">
            <Link to="/portfolios"><ArrowLeft className="mr-2 h-4 w-4" />Browse Portfolios</Link>
          </Button>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const initials = portfolio.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="gradient-primary py-12">
          <div className="container mx-auto px-4">
            <Button variant="ghost" size="sm" asChild className="mb-6 text-primary-foreground/80 hover:text-primary-foreground">
              <Link to="/portfolios"><ArrowLeft className="mr-1.5 h-4 w-4" />All Portfolios</Link>
            </Button>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-primary-foreground/20">
                <AvatarImage src={portfolio.avatar_url || undefined} />
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground">{portfolio.full_name}</h1>
                <p className="mt-1 text-lg text-primary-foreground/80">{portfolio.headline}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-primary-foreground/70">
                  {portfolio.business_name && (
                    <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{portfolio.business_name}</span>
                  )}
                  {(portfolio.city || portfolio.region) && (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[portfolio.city, portfolio.region].filter(Boolean).join(", ")}</span>
                  )}
                  {portfolio.years_of_experience && (
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{portfolio.years_of_experience}+ years experience</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {portfolio.bio && (
                <Card>
                  <CardHeader><CardTitle>About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">{portfolio.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Services */}
              {portfolio.services?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Services Offered</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {portfolio.services.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border p-3">
                          <Briefcase className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium">{s}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {portfolio.skills?.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Skills & Expertise</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {portfolio.skills.map((s, i) => (
                        <Badge key={i} variant="secondary" className="py-1.5 px-3">{s}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Work Samples Gallery */}
              {portfolio.portfolio_images?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" /> Work Samples
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {portfolio.portfolio_images.map((img, i) => (
                        <a
                          key={i}
                          href={img}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group aspect-square overflow-hidden rounded-lg border bg-muted"
                        >
                          <img
                            src={img}
                            alt={`Work sample ${i + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {/* Links */}
              {(portfolio.website_url || Object.values(portfolio.social_links || {}).some(Boolean)) && (
                <Card>
                  <CardHeader><CardTitle>Find Me Online</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {portfolio.website_url && (
                      <a href={portfolio.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Globe className="h-4 w-4" /> Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {portfolio.social_links?.facebook && (
                      <a href={portfolio.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        Facebook <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {portfolio.social_links?.instagram && (
                      <a href={portfolio.social_links.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        Instagram <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {portfolio.social_links?.whatsapp && (
                      <a href={`https://wa.me/${portfolio.social_links.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <Phone className="h-4 w-4" /> WhatsApp <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" /> Contact {portfolio.full_name?.split(" ")[0]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContact} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Your Name</Label>
                      <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Your Email</Label>
                      <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactMsg">Message</Label>
                      <Textarea id="contactMsg" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} rows={4} placeholder="Describe the service you need..." required />
                    </div>
                    <Button type="submit" className="w-full" disabled={sending}>
                      {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
