import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1 text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Page Content */}
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
