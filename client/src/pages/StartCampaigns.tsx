import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Zap, HelpCircle, LayoutGrid } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { AuthModal } from "@/components/AuthModal";
import type { MembershipTier } from "@shared/schema";
import { TIER_LIMITS } from "@shared/tierLimits";

export default function StartCampaigns() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [upsellModalOpen, setUpsellModalOpen] = useState(false);
  const [lpDialogOpen, setLpDialogOpen] = useState(false);
  const [ripsDialogOpen, setRipsDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier>("NEST");
  const tiers: Array<{
    name: string;
    price: string;
    description: string;
    banner?: string;
    features: string[];
    ripsRate: string;
    cta: string;
    testId: string;
    popular?: boolean;
    tier: MembershipTier;
  }> = [
    {
      name: "NEST",
      price: "$0 - Free Trial",
      description: "Try Before You Buy - Test Flash Marketing Basics",
      features: [
        "One-time 200 text credits",
        "Core offer types (% off, $ off)",
        "Coupon-code delivery only",
        "Perfect for learning Flash Marketing quickly",
        "Real experience with launching live offers, no commitment"
      ],
      ripsRate: "$2.77 per new customer",
      cta: "Get Started",
      testId: "nest-beginner",
      tier: "NEST"
    },
    {
      name: "FREEBYRD",
      price: "No Monthly Fee",
      description: "Pay As You Go - Full Flexibility, No Monthly Fee",
      features: [
        "Up to 3 active offers at one time",
        "All offer types (BOGO, thresholds, bundles)",
        "Product images & promotional videos",
        "Access to the Urly Byrd marketplace",
        "Create offers as needed - ideal for seasonal or occasional use",
        "First 1,500 texts each month: 2.1¢",
        "After that: 1.1¢ per text"
      ],
      ripsRate: "$2.77 per new customer",
      cta: "Get Started",
      testId: "freebyrd-payg",
      popular: true,
      tier: "FREEBYRD"
    },
    {
      name: "ASCEND",
      price: "$24.95/month",
      description: "Grow Consistently - Advanced Tools + Lower Costs",
      features: [
        "Up to 5 active offers",
        "Countdown timers for urgency & automatic time extensions",
        "Full suite of offer types",
        "Product images & promotional videos",
        "Coupon card-style delivery suite",
        "Advanced analytics suite",
        "Batch offer-setup tools",
        "Included 1,000 texts per month",
        "Additional texts: 1.03¢ each",
        "Marketplace Access: Standard inclusion"
      ],
      ripsRate: "$2.15 per new customer",
      cta: "Get Started",
      testId: "ascend-advanced",
      popular: true,
      tier: "ASCEND"
    },
    {
      name: "SOAR",
      price: "$38.95/month",
      description: "Maximum Performance - AI-Driven Optimization + ABORIPS",
      features: [
        "Up to 10 active offers",
        "Dual countdown timers + time-bomb triggers (premium feature)",
        "SMS notifications & auto-extend",
        "Full suite of offer types",
        "Advanced analytics powered by ABORIPS behavioral intelligence",
        "Full coupon card suite",
        "AI-enhanced batch-offer creation tools",
        "Included 2,000 texts per month",
        "Additional texts: 0.89¢ each",
        "Marketplace: Full participation + priority placement"
      ],
      ripsRate: "$1.65 per new customer",
      cta: "Get Started",
      testId: "soar-pro",
      tier: "SOAR"
    },
    {
      name: "SOAR PLUS",
      price: "$75.50/month",
      description: "Maximum capacity for enterprise operations",
      features: [
        "50 active offers at same time",
        "8,000 texts per month included",
        "All SOAR features included",
        "Customer acquisition ($1.65/new customer)",
        "Mobile wallet passes",
        "Comprehensive analytics & reports",
        "Perfect for very high-volume merchants"
      ],
      ripsRate: "$1.65 per new customer",
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
      ripsRate: "$1.65 per new customer",
      cta: "Dominate with SOAR PLATINUM",
      testId: "soar-platinum-ultimate",
      tier: "SOAR_PLATINUM"
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <AppHeader hideFeedback />
      <div className="mx-auto px-8 py-12">
        <div className="flex justify-center gap-8 mb-6 py-3 bg-primary/10 border-b border-primary/20">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setComparisonDialogOpen(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none p-2 font-semibold text-base"
                data-testid="link-compare-plans"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="underline">Compare Plans</span>
              </button>
            </TooltipTrigger>
            <TooltipContent data-testid="tooltip-compare-plans">
              View a side-by-side comparison of all plan features
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setRipsDialogOpen(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer bg-transparent border-none p-2 font-semibold text-base"
                data-testid="link-what-is-rips"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="underline">What is RIPS?</span>
              </button>
            </TooltipTrigger>
            <TooltipContent data-testid="tooltip-what-is-rips">
              Learn about our customer acquisition pricing
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="text-center mb-16">
          <h1 className="text-5xl font-display font-bold text-white mb-4" data-testid="heading-start-campaigns">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto" data-testid="text-subtitle">
            All plans come with{" "}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLpDialogOpen(true)}
                  className="text-white underline hover:text-gray-300 transition-colors cursor-pointer bg-transparent border-none p-0 font-inherit"
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
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground" data-testid={`rips-rate-${tier.testId}`}>
                        <span className="font-semibold">RIPS rate:</span> {tier.ripsRate}
                      </p>
                      {tier.tier !== "NEST" && tier.tier !== "FREEBYRD" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Higher tiers unlock lower RIPS rates.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
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

      <Dialog open={ripsDialogOpen} onOpenChange={setRipsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-rips">
          <DialogHeader>
            <DialogTitle data-testid="title-rips">What is RIPS?</DialogTitle>
            <DialogDescription data-testid="description-rips">
              RIPS (Referral Incentive Pricing System) is our customer acquisition program that helps you grow your customer base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4" data-testid="content-rips">
            <div>
              <h4 className="font-semibold mb-2">How RIPS Works:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Pay only when new customers claim your offers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>Higher tiers unlock lower per-customer rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>No upfront fees - pay as you acquire customers</span>
                </li>
              </ul>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4">
              <h4 className="font-semibold mb-3">RIPS Rates by Tier:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NEST & FREEBYRD</span>
                  <span className="font-semibold">$2.77 per new customer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ASCEND</span>
                  <span className="font-semibold">$2.15 per new customer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SOAR & above</span>
                  <span className="font-semibold text-primary">$1.65 per new customer</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The more you grow with Urly Byrd, the less you pay to acquire each new customer.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setRipsDialogOpen(false)}
              data-testid="button-close-rips"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={comparisonDialogOpen} onOpenChange={setComparisonDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto" data-testid="dialog-comparison">
          <DialogHeader>
            <DialogTitle data-testid="title-comparison">Plan Comparison</DialogTitle>
            <DialogDescription data-testid="description-comparison">
              Compare features across all Urly Byrd plans
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto" data-testid="content-comparison">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-semibold">Feature</th>
                  <th className="text-center py-3 px-2 font-semibold">NEST</th>
                  <th className="text-center py-3 px-2 font-semibold">FREEBYRD</th>
                  <th className="text-center py-3 px-2 font-semibold">ASCEND</th>
                  <th className="text-center py-3 px-2 font-semibold">SOAR</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Price</td>
                  <td className="text-center py-3 px-2">Free</td>
                  <td className="text-center py-3 px-2">No monthly fee</td>
                  <td className="text-center py-3 px-2">$24.95/mo</td>
                  <td className="text-center py-3 px-2">$38.95/mo</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Active Offers</td>
                  <td className="text-center py-3 px-2">1</td>
                  <td className="text-center py-3 px-2">Up to 3</td>
                  <td className="text-center py-3 px-2">Up to 5</td>
                  <td className="text-center py-3 px-2">Up to 10</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Texts Included</td>
                  <td className="text-center py-3 px-2">200 (one-time)</td>
                  <td className="text-center py-3 px-2">Pay per text</td>
                  <td className="text-center py-3 px-2">1,000/mo</td>
                  <td className="text-center py-3 px-2">2,000/mo</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Text Rate (after included)</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2">2.1¢ / 1.1¢</td>
                  <td className="text-center py-3 px-2">1.03¢</td>
                  <td className="text-center py-3 px-2">0.89¢</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Offer Types</td>
                  <td className="text-center py-3 px-2">% off, $ off</td>
                  <td className="text-center py-3 px-2">All types</td>
                  <td className="text-center py-3 px-2">All types</td>
                  <td className="text-center py-3 px-2">All types</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Product Images & Videos</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Countdown Timers</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                  <td className="text-center py-3 px-2">Dual timers</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Auto-Extend</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Analytics</td>
                  <td className="text-center py-3 px-2">Basic</td>
                  <td className="text-center py-3 px-2">Basic</td>
                  <td className="text-center py-3 px-2">Advanced</td>
                  <td className="text-center py-3 px-2">ABORIPS AI</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Marketplace Access</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 text-primary mx-auto" /></td>
                  <td className="text-center py-3 px-2">Standard</td>
                  <td className="text-center py-3 px-2">Priority</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-foreground">RIPS Rate</td>
                  <td className="text-center py-3 px-2">$2.77</td>
                  <td className="text-center py-3 px-2">$2.77</td>
                  <td className="text-center py-3 px-2">$2.15</td>
                  <td className="text-center py-3 px-2 text-primary font-semibold">$1.65</td>
                </tr>
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setComparisonDialogOpen(false)}
              data-testid="button-close-comparison"
            >
              Close
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
