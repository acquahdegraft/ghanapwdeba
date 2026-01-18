import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentModal } from "./PaymentModal";

export function DashboardHeader() {
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-6">
        {/* Mobile menu button */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        {/* Search */}
        <div className="hidden flex-1 md:block md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources, events..."
              className="pl-9 bg-secondary/50"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Quick action */}
          <Button 
            size="sm" 
            className="hidden sm:inline-flex"
            onClick={() => setPaymentModalOpen(true)}
          >
            Pay Dues
          </Button>
        </div>
      </header>

      <PaymentModal 
        open={paymentModalOpen} 
        onOpenChange={setPaymentModalOpen}
        amount={100}
        paymentType="membership_dues"
      />
    </>
  );
}
