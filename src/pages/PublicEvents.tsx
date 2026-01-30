import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

const SITE_NAME = "Ghana Persons with Disability Entrepreneurs and Business Association";

const upcomingEvents = [
  {
    title: "Annual General Meeting 2025",
    date: "March 15, 2025",
    time: "9:00 AM - 4:00 PM",
    location: "Accra International Conference Centre",
    type: "Conference",
    description: "Join us for our annual gathering to review the year's achievements, elect new officers, and plan for the future.",
  },
  {
    title: "Entrepreneurship Workshop: Digital Marketing",
    date: "February 20, 2025",
    time: "10:00 AM - 2:00 PM",
    location: "Virtual (Zoom)",
    type: "Workshop",
    description: "Learn essential digital marketing skills to grow your business online, including social media and SEO basics.",
  },
  {
    title: "Northern Region Business Networking",
    date: "February 28, 2025",
    time: "2:00 PM - 6:00 PM",
    location: "Tamale Cultural Centre",
    type: "Networking",
    description: "Connect with fellow PWD entrepreneurs in the Northern Region. Share experiences and build partnerships.",
  },
];

const pastHighlights = [
  {
    title: "World Disability Day Celebration 2024",
    attendees: 250,
    description: "A memorable celebration with business showcases and awards ceremony.",
  },
  {
    title: "Financial Literacy Training Series",
    attendees: 180,
    description: "Four-part series on managing business finances and accessing credit.",
  },
  {
    title: "Regional Chapter Launch - Volta Region",
    attendees: 75,
    description: "Successful launch of our newest regional chapter with local stakeholders.",
  },
];

export default function PublicEvents() {
  useEffect(() => {
    document.title = `Events | ${SITE_NAME}`;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />

      {/* Hero Section */}
      <section className="gradient-hero py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
              Events & Activities
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Join our workshops, networking events, and conferences designed to empower 
              PWD entrepreneurs across Ghana.
            </p>
            <Button size="lg" asChild className="gradient-primary">
              <Link to="/register">
                Become a Member to Register <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Upcoming Events</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.title}
                className="rounded-xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {event.type}
                </div>
                <h3 className="mb-3 text-lg font-semibold">{event.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{event.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{event.date} • {event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-6 w-full" asChild>
                  <Link to="/login">Sign in to Register</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events Highlights */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Past Event Highlights</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {pastHighlights.map((event) => (
              <div
                key={event.title}
                className="rounded-xl border bg-card p-6"
              >
                <h3 className="mb-2 font-semibold">{event.title}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{event.description}</p>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Users className="h-4 w-4" />
                  <span>{event.attendees} attendees</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Don't Miss Out on Future Events
          </h2>
          <p className="mb-8 text-primary-foreground/80">
            Become a member to get early access and exclusive discounts on all GPWDEBA events.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Link to="/register">
              Join GPWDEBA Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-auto">
        <LandingFooter />
      </div>
    </div>
  );
}
