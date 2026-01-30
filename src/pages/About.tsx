import { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Users, Target, Eye, Heart } from "lucide-react";

const SITE_NAME = "Ghana Persons with Disability Entrepreneurs and Business Association";

const values = [
  {
    icon: Heart,
    title: "Inclusivity",
    description: "We believe every person, regardless of disability, deserves equal opportunity to succeed in business.",
  },
  {
    icon: Users,
    title: "Unity",
    description: "Together we are stronger. We foster collaboration and mutual support among our members.",
  },
  {
    icon: Target,
    title: "Empowerment",
    description: "We equip our members with skills, resources, and networks to thrive as entrepreneurs.",
  },
  {
    icon: Eye,
    title: "Advocacy",
    description: "We champion policies and practices that create accessible business environments.",
  },
];

export default function About() {
  useEffect(() => {
    document.title = `About | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              About GPWDEBA
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Ghana Persons with Disabilities Entrepreneurs and Business Association is dedicated to 
              empowering PWD entrepreneurs across all 16 regions of Ghana.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mb-4 text-2xl font-bold">Our Mission</h2>
              <p className="text-muted-foreground">
                To foster a supportive environment where persons with disabilities can develop their 
                entrepreneurial potential, access resources, and build sustainable businesses that 
                contribute to Ghana's economic growth.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mb-4 text-2xl font-bold">Our Vision</h2>
              <p className="text-muted-foreground">
                A Ghana where persons with disabilities are recognized as valuable contributors to 
                the economy, with equal access to business opportunities, financial services, and 
                entrepreneurial support systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-6 text-center text-3xl font-bold">Our Story</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                GPWDEBA was founded with a simple but powerful vision: to unite persons with 
                disabilities who are entrepreneurs and business owners across Ghana, providing 
                them with a collective voice and shared resources.
              </p>
              <p>
                Over the years, we have grown from a small group of passionate advocates to a 
                nationwide network spanning all 16 regions of Ghana. Our members represent diverse 
                business sectors, from agriculture and manufacturing to technology and services.
              </p>
              <p>
                Today, GPWDEBA continues to break barriers, challenge stereotypes, and create 
                opportunities for PWD entrepreneurs. Through training programs, networking events, 
                advocacy initiatives, and resource sharing, we are building a more inclusive 
                business environment for all Ghanaians.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Our Core Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border bg-card p-6 text-center transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <LandingFooter />
      </div>
    </div>
  );
}
