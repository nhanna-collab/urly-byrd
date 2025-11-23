import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import type { User } from "@shared/schema";
import AppHeader from "@/components/AppHeader";

export default function QuickStart() {
  const [, navigate] = useLocation();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-2">Quick Start Guide</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to launch successful flash sale campaigns and grow your business with Urly Byrd.
          </p>
        </div>

        <OnboardingChecklist 
          onboardingProgress={(user.onboardingProgress || {}) as Record<string, boolean>}
          onNavigateToCustomers={() => navigate('/dashboard?tab=customers')}
          onNavigateToCreateOffer={() => navigate('/dashboard?create=true')}
        />
      </div>
    </div>
  );
}
