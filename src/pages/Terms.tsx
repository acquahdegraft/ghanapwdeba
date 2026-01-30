import { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SITE_NAME = "Ghana Persons with Disability Entrepreneurs and Business Association";

export default function Terms() {
  useEffect(() => {
    document.title = `Terms of Service | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl">
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using the Ghana Persons with Disabilities Entrepreneurs and 
              Business Association (GPWDEBA) website and services, you agree to be bound by 
              these Terms of Service. If you do not agree to these terms, please do not use 
              our services.
            </p>

            <h2>Membership Eligibility</h2>
            <h3>Individual Membership</h3>
            <p>
              Individual membership is open to persons with disabilities who are entrepreneurs 
              or business owners in Ghana. Applicants must provide accurate information about 
              their disability status and business activities.
            </p>

            <h3>Associate Membership</h3>
            <p>
              Associate membership is available to supporters and allies of the PWD business 
              community who wish to contribute to our mission.
            </p>

            <h3>Corporate Membership</h3>
            <p>
              Corporate membership is available to organizations that support PWD entrepreneurship 
              and wish to partner with GPWDEBA.
            </p>

            <h2>Membership Dues</h2>
            <p>
              Members are required to pay annual membership dues to maintain active status. 
              Dues are non-refundable. Failure to pay dues may result in suspension of 
              membership benefits.
            </p>

            <h2>Member Conduct</h2>
            <p>Members agree to:</p>
            <ul>
              <li>Provide accurate and truthful information</li>
              <li>Treat other members with respect and professionalism</li>
              <li>Not engage in fraudulent or deceptive practices</li>
              <li>Not use the platform for illegal activities</li>
              <li>Not harass, discriminate against, or harm other members</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>

            <h2>Member Directory</h2>
            <p>
              Members who opt to be listed in the member directory agree to have their basic 
              business information shared with other members. GPWDEBA is not responsible for 
              how other members use publicly shared information.
            </p>

            <h2>Events and Activities</h2>
            <p>
              GPWDEBA organizes events and activities for members. Participation is voluntary. 
              Members are responsible for their own conduct at events and must comply with 
              event-specific rules and guidelines.
            </p>

            <h2>Intellectual Property</h2>
            <p>
              All content on the GPWDEBA website, including logos, text, graphics, and 
              software, is the property of GPWDEBA or its licensors and is protected by 
              intellectual property laws.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              GPWDEBA provides its services "as is" without warranties of any kind. We are 
              not liable for any indirect, incidental, or consequential damages arising from 
              your use of our services. Our total liability shall not exceed the amount of 
              membership dues paid by you in the past 12 months.
            </p>

            <h2>Termination</h2>
            <p>
              GPWDEBA reserves the right to suspend or terminate membership for violation of 
              these terms, non-payment of dues, or conduct that is harmful to the organization 
              or its members.
            </p>

            <h2>Dispute Resolution</h2>
            <p>
              Any disputes arising from these terms or membership shall be resolved through 
              negotiation and, if necessary, mediation. The laws of Ghana shall govern these 
              terms.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              GPWDEBA may modify these Terms of Service at any time. Members will be notified 
              of material changes. Continued use of services after changes constitutes 
              acceptance of the new terms.
            </p>

            <h2>Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@gpwdeba.org" className="text-primary hover:underline">
                legal@gpwdeba.org
              </a>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <LandingFooter />
      </div>
    </div>
  );
}
