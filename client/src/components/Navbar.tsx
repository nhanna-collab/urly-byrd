import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import birdLogo from "@assets/image_1763871339972.png";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wrench } from "lucide-react";
import { InfoSheet } from "@/components/InfoSheet";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [infoCardId, setInfoCardId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Check if creating offer by checking the route
  const isCreatingOffer = location === "/dashboard/create";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setScrollPosition(Math.min(window.scrollY, 300));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await apiRequest("POST", "/api/auth/logout");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between gap-4 py-4 relative">
            <Link href="/">
              <button
                className="shrink-0 p-2 hover:bg-accent rounded-md transition-colors"
                data-testid="nav-home-icon"
              >
                <img 
                  src={birdLogo} 
                  alt="Home" 
                  className="h-12 w-12"
                />
              </button>
            </Link>
            
            {location !== "/" && location !== "/start-campaigns" && (
              <div className="flex items-center gap-4 flex-1 justify-center">
                {(location === "/offers" || location === "/stage2") ? (
                  <>
                    <button 
                      onClick={() => setInfoCardId("convention-structure")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-convention-structure"
                    >
                      Convention Structure
                    </button>
                    <button 
                      onClick={() => setInfoCardId("hierarchy")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-hierarchy"
                    >
                      Hierarchy
                    </button>
                    <button 
                      onClick={() => setInfoCardId("automated-ordering")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-automated-ordering"
                    >
                      Automated Ordering
                    </button>
                    <button 
                      onClick={() => setInfoCardId("things-to-consider-campaigns")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-campaign-things-to-consider"
                    >
                      Things to Consider
                    </button>
                  </>
                ) : location === "/campaigns" ? (
                  <>
                    <button 
                      onClick={() => setInfoCardId("convention-structure")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-convention-structure"
                    >
                      Convention Structure
                    </button>
                    <button 
                      onClick={() => setInfoCardId("hierarchy")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-hierarchy"
                    >
                      Hierarchy
                    </button>
                    <button 
                      onClick={() => setInfoCardId("automated-ordering")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-automated-ordering"
                    >
                      Automated Ordering
                    </button>
                    <button 
                      onClick={() => setInfoCardId("things-to-consider-campaigns")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-campaign-things-to-consider"
                    >
                      Things to Consider
                    </button>
                  </>
                ) : isCreatingOffer ? (
                  <>
                    <button 
                      onClick={() => setInfoCardId("offer-strategies")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-offer-strategies"
                    >
                      Offer Strategies
                    </button>
                    <button 
                      onClick={() => setInfoCardId("best-practices")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-best-practices"
                    >
                      Best Practices
                    </button>
                    <button 
                      onClick={() => setInfoCardId("warnings")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-warnings"
                    >
                      Warnings
                    </button>
                    <button 
                      onClick={() => setInfoCardId("things-to-consider-create")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-things-to-consider"
                    >
                      Things to Consider
                    </button>
                  </>
                ) : location === "/dashboard" ? (
                  <>
                    <button 
                      onClick={() => setInfoCardId("useful-info")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-useful-info"
                    >
                      Useful Info
                    </button>
                    <button 
                      onClick={() => setInfoCardId("how-to-use-it")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-how-to-use-it"
                    >
                      How to Use It
                    </button>
                    <button 
                      onClick={() => setInfoCardId("staying-ahead")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-staying-ahead"
                    >
                      Staying Ahead
                    </button>
                    <button 
                      onClick={() => setInfoCardId("things-to-consider-dashboard")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-dashboard-things-to-consider"
                    >
                      Things to Consider
                    </button>
                  </>
                ) : location === "/reports" ? (
                  <>
                    <button 
                      onClick={() => setInfoCardId("useful-info")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-reports-useful-info"
                    >
                      Useful Info
                    </button>
                    <button 
                      onClick={() => setInfoCardId("how-to-use-it")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-reports-how-to-use"
                    >
                      How to Use It
                    </button>
                    <button 
                      onClick={() => setInfoCardId("staying-ahead")}
                      className="text-sm font-medium hover:text-primary transition-colors cursor-pointer bg-transparent border-0 p-0" 
                      data-testid="nav-reports-staying-ahead"
                    >
                      Staying Ahead
                    </button>
                  </>
                ) : null}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {user && location === "/" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/dashboard")}
                  className="shrink-0"
                  data-testid="nav-dashboard-icon"
                >
                  <Wrench className="h-6 w-6" />
                </Button>
              )}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="font-display font-semibold text-lg"
                  data-testid="button-signout"
                >
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setAuthModalOpen(true)}
                  className="font-display font-semibold text-lg"
                  data-testid="link-signin"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        defaultTab="login"
      />
      
      <InfoSheet 
        cardId={infoCardId}
        open={!!infoCardId}
        onOpenChange={(open) => !open && setInfoCardId(null)}
      />
    </>
  );
}
