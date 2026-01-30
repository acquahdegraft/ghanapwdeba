import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Address",
    details: ["P.O. Box GP 1234", "Accra, Ghana"],
  },
  {
    icon: Phone,
    title: "Phone",
    details: ["+233 XX XXX XXXX", "+233 XX XXX XXXX"],
  },
  {
    icon: Mail,
    title: "Email",
    details: ["info@gpwdeba.org", "support@gpwdeba.org"],
  },
  {
    icon: Clock,
    title: "Office Hours",
    details: ["Monday - Friday", "9:00 AM - 5:00 PM"],
  },
];

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Contact Us
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Have questions? We'd love to hear from you. Reach out to us through any of the 
              channels below or send us a message.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <h2 className="mb-6 text-2xl font-bold">Send us a Message</h2>
              <form className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" type="tel" placeholder="+233 XX XXX XXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help you?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    rows={5}
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary">
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="mb-6 text-2xl font-bold">Get in Touch</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {contactInfo.map((info) => (
                  <div
                    key={info.title}
                    className="rounded-xl border bg-card p-6"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <info.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{info.title}</h3>
                    {info.details.map((detail, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {detail}
                      </p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Regional Offices */}
              <div className="mt-8 rounded-xl border bg-card p-6">
                <h3 className="mb-4 font-semibold">Regional Chapters</h3>
                <p className="text-sm text-muted-foreground">
                  GPWDEBA has regional chapters across all 16 regions of Ghana. Contact your 
                  regional coordinator for local support and activities.
                </p>
                <p className="mt-4 text-sm">
                  <span className="font-medium">Find your regional chapter:</span>{" "}
                  <a href="mailto:regions@gpwdeba.org" className="text-primary hover:underline">
                    regions@gpwdeba.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <LandingFooter />
      </div>
    </div>
  );
}
