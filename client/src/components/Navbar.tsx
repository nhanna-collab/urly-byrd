import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import sunriseLogo from "@assets/UBphone-icon_1762744086414.png";
import urlyByrdText from "@assets/Urly Byrd Logo Design_1762135693666.png";
import logo1 from "@assets/logo1_1764034662638.png";
import sunIcon from "@assets/image_1764035624356.png";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Sparkles } from "lucide-react";
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
            {/* Logo on left - sunrise animation only on home page, icon logo on other pages */}
            <Link href="/" className="shrink-0 relative">
              {location === "/" ? (
                <>
                  {/* Sun that rises from behind as you scroll */}
                  <img 
                    src={sunIcon} 
                    alt="Sunrise" 
                    className="absolute left-1/2 -translate-x-1/2 h-[72px] w-[72px] transition-all duration-[1200ms] rounded-full"
                    style={{
                      top: `${Math.max(48 - scrollPosition * 0.02, 42)}%`,
                      transform: 'translate(-50%, -50%)',
                      opacity: Math.min(scrollPosition / 120, 1),
                    }}
                    data-testid="nav-sunrise"
                  />
                  {/* Main logo */}
                  <img 
                    src={logo1} 
                    alt="Urly Byrd" 
                    className="h-36 relative z-10"
                    data-testid="nav-logo"
                  />
                </>
              ) : (
                <img 
                  src={sunriseLogo} 
                  alt="Urly Byrd Home" 
                  className="h-12"
                  data-testid="nav-icon-logo"
                />
              )}
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/pricing-trial")}
                className="shrink-0"
                data-testid="nav-pricing-trial-icon"
              >
                <Sparkles className="h-6 w-6" />
              </Button>
              {user && (
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
