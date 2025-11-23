import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { AuthModal } from "@/components/AuthModal";
import type { MembershipTier } from "@shared/schema";
import { TIER_LIMITS } from "@shared/tierLimits";

export default function StartCampaigns() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [lpDialogOpen, setLpDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier>("NEST");
  const tiers: Array<{
    name: string;
    price: string;
    description: string;
    banner?: string;
    features: string[];
    cta: string;
    testId: string;
    popular?: boolean;
    tier: MembershipTier;
  }> = [
    {
      name: "NEST",
      price: "Free",
      description: "Try before you buy - test flash marketing basics",
      features: [
        "1 active offer at a time",
        "200 texts to practice live offers",
        "Basic offer types (% off, $ off)",
        "Coupon codes delivery only",
        "Perfect for testing the platform"
      ],
      cta: "Start Free with NEST",
      testId: "nest-beginner",
      tier: "NEST"
    },
    {
      name: "FREEBYRD",
      price: "2.1¢ per text, drops to 1.3¢ after 3000",
      description: "Pay as you grow with flexible text pricing",
      features: [
        "3 active offers at same time",
        "Unlimited text allocation (pay per text sent)",
        "All offer types (BOGO, spend thresholds)",
        "Product images & promotional videos",
        "Must delete/deactivate to create new offers",
        "Perfect for seasonal businesses"
      ],
      cta: "Fly Free with FREEBYRD",
      testId: "freebyrd-payg",
      popular: true,
      tier: "FREEBYRD"
    },
    {
      name: "GLIDE",
      price: "$15.95/month",
      description: "Professional tools for organized marketing",
      features: [
        "5 active offers at same time",
        "1,600 texts per month included",
        "Countdown timers for urgency",
        "Campaign folders for organization",
        "SMS notifications & auto-extend",
        "Product images & videos",
        "Perfect for regular promotions"
      ],
      cta: "Upgrade to GLIDE",
      testId: "glide-advanced",
      popular: true,
      tier: "GLIDE"
    },
    {
      name: "SOAR",
      price: "$24.95/month",
      description: "Enterprise features for serious growth",
      features: [
        "20 active offers at same time",
        "2,500 texts per month included",
        "All GLIDE features included",
        "Customer acquisition ($1.65/new customer)",
        "Mobile wallet passes",
        "Comprehensive analytics & reports",
        "Perfect for high-volume merchants"
      ],
      cta: "Scale with SOAR",
      testId: "soar-pro",
      tier: "SOAR"
    },
    {
      name: "SOAR PLUS",
      price: "$75.50/month",
      description: "Maximum capacity for enterprise operations",
      features: [
        "50 active offers at same time",
        "7,700 texts per month included",
        "All SOAR features included",
        "Customer acquisition ($1.65/new customer)",
        "Mobile wallet passes",
        "Comprehensive analytics & reports",
        "Perfect for very high-volume merchants"
      ],
      cta: "Go BIG with SOAR PLUS",
      testId: "soar-plus-enterprise",
      tier: "SOAR_PLUS"
    },
    {
      name: "SOAR PLATINUM",
      price: "$125.00/month",
      description: "Ultimate power for multi-location enterprises",
      features: [
        "100 active offers at same time",
        "14,000 texts per month included",
        "All SOAR PLUS features included",
        "Customer acquisition ($1.65/new customer)",
        "Mobile wallet passes",
        "Comprehensive analytics & reports",
        "Perfect for enterprise-scale operations"
      ],
      cta: "Dominate with SOAR PLATINUM",
      testId: "soar-platinum-ultimate",
      tier: "SOAR_PLATINUM"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader hideFeedback />
      <div className="mx-auto px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-xl font-display font-bold text-foreground mb-4" data-testid="heading-start-campaigns">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-subtitle">
            All plans come with{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLpDialogOpen(true)}
                  className="text-primary underline hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit"
                  data-testid="link-lp-filtering"
                >
                  LP Filtering
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" data-testid="tooltip-lp-filtering">
                Urly Byrd proprietary technology. filtering low probability of engagement for that customer with your offer, a savings of 30% in text costs at a minumum. For us to be succesfful, you have to be...
              </TooltipContent>
            </Tooltip>
            {" "}at no additional cost.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div key={tier.testId} className="flex flex-col">
              <Card 
                className="border-primary border-2 flex-1 flex flex-col max-h-[550px]"
                data-testid={`card-${tier.testId}`}
              >
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-xl font-display" data-testid={`title-${tier.testId}`}>
                    {tier.name}
                  </CardTitle>
                  {tier.tier === "FREEBYRD" && (
                    <div className="text-sm text-muted-foreground font-bold mt-1" data-testid="text-payg-subtitle">
                      (Pay as you go)
                    </div>
                  )}
                  <div className="text-2xl font-bold text-primary my-3" data-testid={`price-${tier.testId}`}>
                    {tier.price}
                  </div>
                  {tier.tier === "FREEBYRD" && (
                    <div className="mb-2">
                      <span className="font-bold text-foreground">No monthly fee</span>
                    </div>
                  )}
                  <CardDescription data-testid={`description-${tier.testId}`}>
                    {tier.description}
                  </CardDescription>
                  {tier.banner && (
                    <div className="mt-4 bg-primary/10 border border-primary rounded-md px-4 py-3 text-center" data-testid={`banner-${tier.testId}`}>
                      <span className="text-sm font-semibold text-primary">{tier.banner}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden">
                  <div className="overflow-y-auto flex-1 mb-6">
                    <ul className="space-y-3">
                      {tier.features.map((feature, index) => {
                        const isFreeWorkshops = feature.toLowerCase().includes('free workshops');
                        return (
                          <li key={index} className="flex items-start gap-2" data-testid={`feature-${tier.testId}-${index}`}>
                            {!isFreeWorkshops && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            )}
                            <span className={isFreeWorkshops ? "text-sm font-bold ml-6" : "text-sm"}>{feature}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div className="flex-shrink-0">
                    {tier.tier === "FREEBYRD" && (
                      <p className="text-center text-sm text-muted-foreground mb-4" data-testid="text-payg-label">
                        Minimum $5.00 to start
                      </p>
                    )}
                    <Button 
                      className="w-full" 
                      variant="default"
                      onClick={() => {
                        setSelectedTier(tier.tier);
                        if (tier.tier === "NEST") {
                          setUpsellModalOpen(true);
                        } else {
                          setAuthModalOpen(true);
                        }
                      }}
                      data-testid={`button-${tier.testId}`}
                    >
                      {tier.cta}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mb-12" data-testid="banner-customer-acquisition">
          <span className="text-lg font-semibold text-primary" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Add New Customers with SOAR - Pay only $1.65 per new customer{' '}
            <a 
              href="#guarantee-details" 
              className="text-blue-600 underline decoration-blue-600 hover:text-blue-500 hover:decoration-blue-500 transition-colors"
              data-testid="link-guaranteed"
            >
              guaranteed.
            </a>
          </span>
        </div>

        <div id="guarantee-details" className="text-center bg-primary/5 border border-primary rounded-lg p-8 max-w-7xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-foreground mb-4" data-testid="heading-guarantee">
            Our Guarantee
          </h2>
          <p className="text-lg text-foreground" data-testid="text-guarantee-details">
            We will refund up to 500 "add customers" clicks if you are not completely satisfied. If for any reason, you are unhappy with the system we will refund any unused spend in your plan.
          </p>
        </div>
      </div>

      <Dialog open={upsellModalOpen} onOpenChange={setUpsellModalOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="dialog-nest-upsell">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl" data-testid="title-upsell">
              <Zap className="h-6 w-6 text-primary" />
              Boost Your Free Start!
            </DialogTitle>
            <DialogDescription data-testid="description-upsell">
              Get more power for your first offers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="bg-primary/5 border border-primary rounded-lg p-6">
              <div className="text-center mb-4">
                <div className="text-xl font-bold text-primary mb-2">$2.95</div>
                <div className="text-sm text-muted-foreground">One-time add-on</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">200 Additional SMS Texts</div>
                    <div className="text-sm text-muted-foreground">Total: 300 texts (100 free + 200 bonus)</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">5 Additional Offers</div>
                    <div className="text-sm text-muted-foreground">Total: 10 offers (5 free + 5 bonus)</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground text-center">
                  Perfect for testing multiple flash sale strategies
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              This one-time boost helps you run more offers and reach more customers while learning the platform.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUpsellModalOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full sm:w-auto"
              data-testid="button-decline-upsell"
            >
              No Thanks, Stay Free
            </Button>
            <Button
              onClick={() => {
                setUpsellModalOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full sm:w-auto"
              data-testid="button-accept-upsell"
            >
              Add for $2.95
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lpDialogOpen} onOpenChange={setLpDialogOpen}>
        <DialogContent data-testid="dialog-lp-filtering">
          <DialogHeader>
            <DialogTitle data-testid="title-lp-filtering">What is LP Filtering?</DialogTitle>
            <DialogDescription data-testid="description-lp-filtering">
              LP Filtering (Local Proximity Filtering) is our advanced location-based technology that ensures your offers only reach customers within your 10-mile service radius.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4" data-testid="content-lp-filtering">
            <div>
              <h4 className="font-semibold mb-2">How it works:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Automatically validates customer ZIP codes before showing offers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Uses precise geolocation to calculate distances</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Prevents wasted marketing spend on out-of-range customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Included free on all plans - no additional fees</span>
                </li>
              </ul>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <p className="text-sm">
                <strong>Why this matters:</strong> Only customers who can actually reach your business will see your offers, maximizing your conversion rate and ROI.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setLpDialogOpen(false)}
              data-testid="button-close-lp-filtering"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab="register"
        selectedTier={selectedTier}
      />
      <div id="plans-bottom"></div>
    </div>
  );
}
