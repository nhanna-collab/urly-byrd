import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CustomerLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        <h1 className="font-display font-bold text-5xl text-primary">
          Urly Byrd
        </h1>

        <p className="text-xl text-foreground/80 font-medium">
          Flash deals from local businesses
        </p>

        <div className="flex justify-center pt-4">
          <Link href="/customer-signup">
            <Button 
              size="lg"
              data-testid="button-signup"
            >
              Sign Up to See Offers
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground pt-4">
          Tip: Add this site to your home screen for quick access
        </p>
      </div>
    </div>
  );
}
