import { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

const SITE_NAME = "Ghana Persons with Disability Entrepreneurs and Business Association";

export default function Privacy() {
  useEffect(() => {
    document.title = `Privacy Policy | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Privacy Policy
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
            <h2>Introduction</h2>
            <p>
              Ghana Persons with Disabilities Entrepreneurs and Business Association (GPWDEBA) 
              is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our website and services.
            </p>

            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul>
              <li>Name and contact information (email, phone number, address)</li>
              <li>Business information (business name, type, location)</li>
              <li>Disability type (for membership eligibility verification)</li>
              <li>Payment information for membership dues</li>
              <li>Profile photos and business descriptions</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>
              When you access our website, we may automatically collect certain information about 
              your device and usage patterns, including IP address, browser type, and pages visited.
            </p>

            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process membership applications and manage member accounts</li>
              <li>Facilitate networking and connections between members</li>
              <li>Send notifications about events, announcements, and updates</li>
              <li>Process payments for membership dues</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>Member Directory</h2>
            <p>
              Members may choose to be listed in our public member directory. If you opt in, 
              your name, business name, region, and business type will be visible to other 
              members. You can change your directory visibility settings at any time.
            </p>

            <h2>Information Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            <ul>
              <li>Other members (only information you choose to share publicly)</li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your 
              personal information. However, no method of transmission over the Internet is 
              100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
              <li>Update your privacy preferences</li>
            </ul>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@gpwdeba.org" className="text-primary hover:underline">
                privacy@gpwdeba.org
              </a>
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify members of 
              any material changes through email or a notice on our website.
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
