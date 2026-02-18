import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  BookOpen,
  CreditCard,
  User,
  Calendar,
  Shield,
  Search,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const faqCategories = [
  {
    category: "Membership",
    icon: User,
    color: "text-blue-500",
    faqs: [
      {
        question: "How do I renew my membership?",
        answer:
          "You can renew your membership by navigating to the Payments & Dues section in the dashboard. Click on 'Pay Now' next to your pending dues. Renewals are processed via mobile money or bank transfer.",
      },
      {
        question: "What does an active membership include?",
        answer:
          "An active membership gives you access to all member benefits including the member directory, event registration, exclusive resources, networking opportunities, and participation in GPWDEBA programs and initiatives.",
      },
      {
        question: "How long does membership activation take?",
        answer:
          "Once your payment is confirmed, your membership is activated within 24 hours. You will receive a confirmation email once your account is active.",
      },
      {
        question: "Can I upgrade my membership type?",
        answer:
          "Yes. Contact the admin team at info@gpwdeba.org to discuss upgrading your membership tier. The difference in fees will be prorated for the remaining period.",
      },
    ],
  },
  {
    category: "Payments & Dues",
    icon: CreditCard,
    color: "text-green-500",
    faqs: [
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept mobile money payments (MTN, Vodafone, AirtelTigo) via Hubtel, as well as direct bank transfers. All payments are processed securely.",
      },
      {
        question: "How do I get a payment receipt?",
        answer:
          "Payment receipts are automatically sent to your registered email after a successful transaction. You can also view your payment history in the Payments & Dues section of your dashboard.",
      },
      {
        question: "What happens if my payment fails?",
        answer:
          "If a payment fails, no amount is deducted from your account. You can retry the payment from your dashboard. If you experience repeated failures, contact support at support@gpwdeba.org.",
      },
      {
        question: "When are annual dues due?",
        answer:
          "Annual dues are due on the anniversary of your membership start date. You will receive reminder notifications 30 days, 14 days, and 3 days before the due date.",
      },
    ],
  },
  {
    category: "Events",
    icon: Calendar,
    color: "text-purple-500",
    faqs: [
      {
        question: "How do I register for an event?",
        answer:
          "Go to the Events section in your dashboard, find the event you want to attend, and click 'Register'. You'll receive a confirmation email with event details.",
      },
      {
        question: "Can I cancel my event registration?",
        answer:
          "Yes, you can cancel your registration up to 24 hours before the event. Contact the admin team if you need assistance with cancellations closer to the event date.",
      },
      {
        question: "How will I receive event reminders?",
        answer:
          "Event reminders are sent to your registered email based on your notification preferences. You can manage these preferences in your Profile settings.",
      },
    ],
  },
  {
    category: "Account & Profile",
    icon: Shield,
    color: "text-orange-500",
    faqs: [
      {
        question: "How do I update my profile information?",
        answer:
          "Navigate to My Profile in the sidebar, then click on the relevant section to edit your personal information, business details, or contact information.",
      },
      {
        question: "How do I change my password?",
        answer:
          "Go to My Profile and scroll to the Password section. Click 'Change Password', enter your current password, and then set a new one. Passwords must be at least 8 characters long.",
      },
      {
        question: "How do I control my directory visibility?",
        answer:
          "In your Profile settings, toggle the 'Show in Member Directory' option to control whether other members can see your profile in the directory.",
      },
      {
        question: "How do I manage notification preferences?",
        answer:
          "In your Profile page, scroll to Notification Preferences to toggle email notifications for announcements, event reminders, and payment receipts.",
      },
    ],
  },
];

const quickLinks = [
  { label: "Payments & Dues", href: "/dashboard/payments", icon: CreditCard, description: "View and pay your membership dues" },
  { label: "My Profile", href: "/dashboard/profile", icon: User, description: "Update your personal information" },
  { label: "Events", href: "/dashboard/events", icon: Calendar, description: "Browse and register for events" },
  { label: "Member Directory", href: "/dashboard/directory", icon: BookOpen, description: "Connect with other members" },
];

export default function HelpSupport() {
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const { data: profile } = useProfile();

  useEffect(() => {
    document.title = "Help & Support | GPWDEBA Member Portal";
  }, []);

  const filteredCategories = faqCategories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (faq) =>
          !search ||
          faq.question.toLowerCase().includes(search.toLowerCase()) ||
          faq.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);

  const handleSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-form", {
        body: {
          firstName: profile?.full_name?.split(" ")[0] || "",
          lastName: profile?.full_name?.split(" ").slice(1).join(" ") || "",
          email: profile?.email || "",
          phone: profile?.phone || "",
          subject,
          message,
        },
      });
      if (error) throw error;
      toast.success("Support request sent! We'll get back to you within 24–48 hours.");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error("Failed to send request. Please email us directly at support@gpwdeba.org.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Help & Support"
      description="Find answers to common questions or reach out to our team."
    >
      <div className="space-y-8">
        {/* Quick Links */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Quick Links</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <a key={link.href} href={link.href}>
                <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                      <link.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium">No results found</p>
                <p className="text-sm text-muted-foreground">
                  Try a different search term or contact support below.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredCategories.map((cat) => (
                <Card key={cat.category}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <cat.icon className={`h-5 w-5 ${cat.color}`} />
                      {cat.category}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {cat.faqs.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Accordion type="single" collapsible className="w-full">
                      {cat.faqs.map((faq, idx) => (
                        <AccordionItem key={idx} value={`${cat.category}-${idx}`}>
                          <AccordionTrigger className="text-left text-sm">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Contact & Support Form */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-5 w-5 text-primary" />
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email Support</p>
                    <a
                      href="mailto:support@gpwdeba.org"
                      className="text-sm text-primary hover:underline"
                    >
                      support@gpwdeba.org
                    </a>
                    <p className="text-xs text-muted-foreground">Response within 24–48 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Mail className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">General Inquiries</p>
                    <a
                      href="mailto:info@gpwdeba.org"
                      className="text-sm text-primary hover:underline"
                    >
                      info@gpwdeba.org
                    </a>
                    <p className="text-xs text-muted-foreground">For membership and program questions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Phone className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a
                      href="tel:+233201195588"
                      className="text-sm text-primary hover:underline"
                    >
                      +233 20 119 5588
                    </a>
                    <p className="text-xs text-muted-foreground">Mon – Fri, 9 AM – 5 PM</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Regional chapters: </span>
                  Contact your regional coordinator for local support.{" "}
                  <a href="mailto:regions@gpwdeba.org" className="text-primary hover:underline">
                    regions@gpwdeba.org
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Support Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="h-5 w-5 text-primary" />
                Send a Support Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSupportRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input
                    id="support-subject"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="support-message">Message</Label>
                  <Textarea
                    id="support-message"
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={2000}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Your contact info ({profile?.email}) will be included automatically.
                </p>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Request"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
