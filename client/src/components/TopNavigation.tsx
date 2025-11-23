import { Link, useLocation } from "wouter";
import { Rocket, Folder, FolderOpen, Wrench, HelpCircle, Glasses, Briefcase, Egg, Settings } from "lucide-react";
import NotificationCenter from "@/components/NotificationCenter";
import { Button } from "@/components/ui/button";

export default function TopNavigation() {
  const [, setLocation] = useLocation();

  const navItems = [
    {
      icon: Rocket,
      label: "Create Offer",
      href: "/dashboard/create",
      testId: "nav-create-offer"
    },
    {
      icon: Folder,
      label: "Offers",
      href: "/offers",
      testId: "nav-offers"
    },
    {
      icon: FolderOpen,
      label: "Campaigns",
      href: "/campaigns",
      testId: "nav-campaigns"
    },
    {
      icon: Wrench,
      label: "Dashboard",
      href: "/dashboard",
      testId: "nav-dashboard"
    },
    {
      icon: HelpCircle,
      label: "Create Reports",
      href: "/reports",
      testId: "nav-create-reports"
    },
    {
      icon: Glasses,
      label: "Reports",
      href: "/reports",
      testId: "nav-reports"
    },
    {
      icon: Briefcase,
      label: "Customer Collateral",
      href: "/merchant-collateral",
      testId: "nav-collateral"
    },
    {
      icon: Egg,
      label: "Quick Start",
      href: "/quick-start",
      testId: "nav-quick-start"
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-800 border-b">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.testId}
                  href={item.href}
                  data-testid={item.testId}
                >
                  <div className="flex flex-col items-center gap-1 bg-white dark:bg-white hover-elevate active-elevate-2 p-2 rounded-md transition-all group">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors hidden md:block">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/settings/notifications">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <NotificationCenter />
          </div>
        </div>
      </div>
    </div>
  );
}
