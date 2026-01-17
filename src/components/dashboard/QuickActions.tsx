import { CreditCard, Calendar, FileText, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "Pay Membership Dues",
    description: "Renew your annual membership",
    icon: CreditCard,
    href: "/dashboard/payments",
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "View Upcoming Events",
    description: "RSVP for association events",
    icon: Calendar,
    href: "/dashboard/events",
    color: "bg-accent text-accent-foreground",
  },
  {
    title: "Access Resources",
    description: "Download guides and templates",
    icon: FileText,
    href: "/dashboard/resources",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    title: "Member Directory",
    description: "Connect with other members",
    icon: Users,
    href: "/dashboard/directory",
    color: "bg-muted text-foreground",
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 font-semibold">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="group flex items-center gap-4 rounded-lg border p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/50"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${action.color}`}
            >
              <action.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{action.title}</p>
              <p className="text-sm text-muted-foreground">
                {action.description}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
