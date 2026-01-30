import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const membershipBenefits = [
  "Access to exclusive networking events and workshops",
  "Business training and capacity building programs",
  "Connection with mentors and industry experts",
  "Advocacy support and policy representation",
  "Access to funding opportunities and grants information",
  "Business resources, templates, and guides",
  "Member directory listing for visibility",
  "Regional chapter meetings and support",
  "Annual conference participation",
  "Certificate of membership",
];

const membershipTypes = [
  {
    name: "Individual",
    description: "For PWD entrepreneurs and business owners",
    price: "GH₵ 50",
    period: "per year",
    features: [
      "Full member benefits",
      "Voting rights at AGM",
      "Member directory listing",
      "Event discounts",
    ],
  },
  {
    name: "Associate",
    description: "For supporters and allies of the PWD business community",
    price: "GH₵ 100",
    period: "per year",
    features: [
      "Network access",
      "Event invitations",
      "Newsletter subscription",
      "Supporting member recognition",
    ],
  },
  {
    name: "Corporate",
    description: "For organizations supporting PWD entrepreneurship",
    price: "GH₵ 500",
    period: "per year",
    features: [
      "Multiple representative accounts",
      "Premium event sponsorship",
      "Logo on member directory",
      "Partnership opportunities",
    ],
  },
];

export default function Membership() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Become a Member
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Join Ghana's leading network of PWD entrepreneurs and unlock opportunities 
              for growth, collaboration, and success.
            </p>
            <Button size="lg" asChild className="gradient-primary">
              <Link to="/register">
                Apply Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Member Benefits</h2>
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {membershipBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Membership Types */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Membership Types</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {membershipTypes.map((type) => (
              <div
                key={type.name}
                className="rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <h3 className="mb-2 text-xl font-bold">{type.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{type.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-primary">{type.price}</span>
                  <span className="text-muted-foreground"> {type.period}</span>
                </div>
                <ul className="mb-6 space-y-3">
                  {type.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full">
                  <Link to="/register">Apply Now</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Join */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">How to Join</h2>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Create an Account</h3>
                  <p className="text-muted-foreground">
                    Fill out the online registration form with your personal and business details.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Complete Your Profile</h3>
                  <p className="text-muted-foreground">
                    Add your business information and upload any required documents.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Pay Membership Dues</h3>
                  <p className="text-muted-foreground">
                    Complete your annual dues payment via mobile money or other available methods.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold">Start Connecting</h3>
                  <p className="text-muted-foreground">
                    Access your member dashboard and start enjoying all the benefits of membership.
                  </p>
                </div>
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
