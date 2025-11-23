import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, Star, ArrowLeft, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import birdIcon from "@assets/image_1762741204393.png";

export default function CustomerRewards() {
  const [, setLocation] = useLocation();
  const { customer, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (!isLoading && !customer) {
      setLocation('/customer-landing');
    }
  }, [customer, isLoading, setLocation]);

  // MVP: Mock rewards data - will be replaced with real data from backend
  const totalPoints = 12;
  const availableCoupons = 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <p className="text-muted-foreground">Loading your rewards...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/merchant/test-full-access-001">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Offers
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">
            Your Rewards
          </h1>
          <p className="text-muted-foreground">
            Track your points and claim your coupons
          </p>
        </div>

        {customer && (!customer.dateOfBirth || !customer.sex) && (
          <Alert className="mb-6 border-primary/20 bg-primary/5" data-testid="alert-double-rewards">
            <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
              <img src={birdIcon} alt="Urly Byrd" className="w-12 h-12" />
            </div>
            <AlertDescription className="ml-2">
              <span className="font-semibold">Get Double Rewards!</span> Provide your date of birth and sex to earn 2x points on every share.
              <Link href="/customer-profile">
                <span className="ml-1 text-primary underline underline-offset-4 hover:no-underline cursor-pointer" data-testid="button-complete-profile">
                  Complete your profile →
                </span>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {customer && customer.dateOfBirth && customer.sex && (
          <Alert className="mb-6 border-primary bg-primary/10" data-testid="alert-double-rewards-active">
            <div className="flex items-center justify-center w-12 h-12 flex-shrink-0">
              <img src={birdIcon} alt="Urly Byrd" className="w-12 h-12" />
            </div>
            <AlertDescription className="ml-2 font-semibold text-primary">
              <Sparkles className="h-4 w-4 inline mr-1" /> Double Rewards Active! You're earning 2x points on every share.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle>Points Balance</CardTitle>
              </div>
              <CardDescription>
                Earn 3 points for each offer you share
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {totalPoints}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {10 - (totalPoints % 10)} more points until your next coupon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <CardTitle>Available Coupons</CardTitle>
              </div>
              <CardDescription>
                10 points = 10% off coupon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {availableCoupons}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Ready to redeem at checkout
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Rewards Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                1
              </div>
              <div>
                <p className="font-medium">Share Offers</p>
                <p className="text-muted-foreground">
                  When you see an offer, choose "Share" instead of "Claim" to earn 3 points
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                2
              </div>
              <div>
                <p className="font-medium">Collect Points</p>
                <p className="text-muted-foreground">
                  Points are specific to each merchant - build up your points bank at your favorite stores
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                3
              </div>
              <div>
                <p className="font-medium">Redeem Coupons</p>
                <p className="text-muted-foreground">
                  Every 10 points = 10% off coupon valid at that merchant's store
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
