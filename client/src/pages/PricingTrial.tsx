import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, Egg, TreePalm, Bird, Home, LayoutGrid, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import type { MembershipTier } from "@shared/schema";
import crowdImage from "@assets/image_1764046831418.png";
import soarBirdImage from "@assets/image_1764053242059.png";
import sunIcon from "@assets/image_1764098850383.png";

export default function PricingTrial() {
  const [ripsDialogOpen, setRipsDialogOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MembershipTier>("NEST");
  const plans = [
    {
      name: "NEST",
      price: "$0",
      priceSubtext: "Free For Trial",
      paymentType: "",
      subtitle: "Try before you buy - test flash marketing basics",
      showEggIcon: true,
      features: [],
      bottomFeatures: [
        "200 one-time texts to practice live offers",
        "Basic offer types (% off, $ off)",
        "Coupon codes delivery only",
        "Perfect for testing the platform"
      ],
      bulletNotes: [
        "Learn why Flash Marketing can be so effective even at a small scale",
        "Learn principles of Flash Marketing...fast"
      ],
      gradient: "from-[#0b1c4a] to-[#0e2c85]",
      ctaNote: "RIPS access: $2.77 per new customer",
      ctaSubNote: "Higher tiers = lower RIPS rates",
      cta: "Get Started",
      testId: "nest"
    },
    {
      name: "FREEBYRD",
      price: "",
      priceSubtext: "",
      paymentType: "No monthly fee",
      subtitle: "(Pay as you go)",
      subtitleNote: "Text Credit Price Basis",
      showIslandIcon: true,
      features: [],
      bulletNotes: [
        "Use it when you need it",
        "Get access to Urly Byrd marketplace",
        "Pay 2.1¢ for first 1500 texts, 1.1¢ after within calendar month"
      ],
      bottomFeatures: [
        "Three active offers at same time",
        "Unlimited text allocation (pay per text sent)",
        "All offer types (BOGO, spend thresholds)",
        "Product images & promotional videos",
        "Must delete/deactivate to create new offers",
        "Perfect for seasonal businesses"
      ],
      gradient: "from-[#28004a] to-[#5933ff]",
      ctaNote: "RIPS access: $2.77 per new customer",
      ctaSubNote: "Higher tiers = lower RIPS rates",
      cta: "Get Started",
      testId: "freebyrd"
    },
    {
      name: "ASCEND",
      price: "$24.95",
      priceSubtext: "",
      paymentType: "per month",
      showBirdIcon: true,
      features: [],
      bulletNotes: [
        "1,000 texts per month, 1.03¢ each after spent",
        "Urly Byrd marketplace access"
      ],
      bottomFeatures: [
        "5 active offers at same time",
        "Countdown timers for urgency",
        "SMS notifications & auto-extend",
        "Product images & videos",
        "Full suite of offer types",
        "Coupon card-type suite",
        "Advanced analytics suite",
        "Batch offer setup controls"
      ],
      gradient: "from-[#003a1f] to-[#00a85a]",
      ctaNote: "RIPS access: $2.15 per new customer",
      ctaSubNote: "Lower rate unlocked at this tier",
      cta: "Get Started",
      testId: "ascend"
    },
    {
      name: "SOAR",
      price: "$38.95",
      priceSubtext: "",
      paymentType: "per month",
      showCloudIcon: true,
      features: [],
      bulletNotes: [
        "2,000 texts per month, 0.89¢ each after spent",
        "Priority placement in Urly Byrd marketplace"
      ],
      bottomFeatures: [
        "Dual countdown timers + time bombs (SOAR exclusive)",
        "10 active offers at same time",
        "SMS notifications & auto-extend",
        "Product images & videos",
        "Full suite of offer types w/advanced analytics",
        "Full coupon card-type suite",
        "Advanced analytics with ABORIPS technology",
        "Batch offer setup controls with AI"
      ],
      gradient: "from-[#4a1c0b] to-[#b85c0e]",
      ctaNote: "RIPS access: $1.65 per new customer",
      ctaSubNote: "Lowest rate — only in SOAR",
      cta: "Get Started",
      testId: "soar"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white py-12 px-6 relative overflow-hidden">
      <img src={crowdImage} alt="" className="absolute top-20 left-10 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[280px] left-[100px] w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-40 right-20 w-[550px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[400px] left-20 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[500px] right-10 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[800px] left-5 w-[550px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[900px] right-32 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[1100px] left-40 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[1200px] right-5 w-[550px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[1400px] left-10 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[1500px] right-40 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[1700px] left-32 w-[550px] opacity-80 z-0 brightness-125 saturate-150" />
      <img src={crowdImage} alt="" className="absolute top-[1800px] right-20 w-[500px] opacity-80 z-0 brightness-125 saturate-150" />
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-center gap-8 mb-6 py-3 bg-white/10 rounded-lg border border-white/20">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setComparisonDialogOpen(true)}
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors cursor-pointer bg-transparent border-none p-2 font-semibold text-base"
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
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors cursor-pointer bg-transparent border-none p-2 font-semibold text-base"
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

        <Link href="/">
          <button className="flex items-center gap-2 text-white hover:text-white/80 mb-8 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-display font-bold mb-3" data-testid="heading-pricing-trial">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white font-display font-bold" data-testid="text-subtitle">
            Unlock endless marketing opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.testId}
              className={`relative flex flex-col bg-gradient-to-br ${plan.gradient} p-8 pt-8 pb-6 rounded-2xl w-full border border-white/10 min-h-[675px]`}
              data-testid={`card-${plan.testId}`}
            >
              <div className="h-[180px]">
                <h3 className="text-3xl font-semibold mb-2 flex items-center gap-2" data-testid={`title-${plan.testId}`}>
                  {plan.name}
                  {plan.showEggIcon && <Egg className="w-8 h-8 text-white" strokeWidth={1} />}
                  {plan.showIslandIcon && (
                    <div className="flex items-center ml-4 gap-2">
                      <img 
                        src={soarBirdImage} 
                        alt="" 
                        className="w-16 h-16 invert mix-blend-screen"
                      />
                    </div>
                  )}
                  {plan.showBirdIcon && (
                    <div className="flex items-center ml-2 gap-1">
                      <img 
                        src={soarBirdImage} 
                        alt="" 
                        className="w-16 h-16 invert mix-blend-screen"
                      />
                      <Home className="w-8 h-8 text-white -mr-2" strokeWidth={1} />
                      <TreePalm className="w-10 h-10 text-white" strokeWidth={1} />
                      <Home className="w-8 h-8 text-white -ml-2" strokeWidth={1} />
                    </div>
                  )}
                  {plan.showCloudIcon && (
                    <div className="relative ml-2">
                      <img 
                        src={soarBirdImage} 
                        alt="" 
                        className="w-14 h-14 invert mix-blend-screen"
                      />
                      <img 
                        src={sunIcon} 
                        alt="" 
                        className="absolute top-0 left-10 w-12 h-12 mix-blend-screen"
                      />
                    </div>
                  )}
                </h3>

                {plan.subtitle && (
                  <p className="text-white mb-1">
                    {plan.subtitle}
                  </p>
                )}
                {plan.subtitleNote && (
                  <p className="text-white text-sm mb-3">
                    {plan.subtitleNote}
                  </p>
                )}
                
                <div className="text-4xl font-bold mb-1 flex items-baseline gap-2" data-testid={`price-${plan.testId}`}>
                  {plan.price}
                  {plan.priceSubtext && (
                    <span className="text-xl font-normal">{plan.priceSubtext}</span>
                  )}
                </div>
                
                {plan.paymentType && (
                  <p className="text-white mb-5">
                    {plan.paymentType}
                  </p>
                )}

                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-white text-base">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.bottomFeatures && plan.bottomFeatures.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {plan.bottomFeatures.map((feature, idx) => (
                    <li key={idx} className="text-white text-base flex items-center gap-2">
                      <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              {plan.bulletNotes && plan.bulletNotes.length > 0 && (
                <div className="space-y-2 mb-6 mt-4">
                  {plan.bulletNotes.map((note, idx) => (
                    <p key={idx} className="text-white text-base flex items-start gap-2">
                      <span className="text-orange-500 flex-shrink-0">•</span>
                      <span>{note}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="mt-auto">
                {plan.ctaNote && (
                  <p className="text-white text-sm mb-1 font-bold">{plan.ctaNote}</p>
                )}
                {plan.ctaSubNote && (
                  <p className="text-white/70 text-xs mb-3 italic">{plan.ctaSubNote}</p>
                )}

                <button 
                  className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-opacity"
                  data-testid={`button-${plan.testId}`}
                  onClick={() => {
                    setSelectedTier(plan.name as MembershipTier);
                    setAuthModalOpen(true);
                  }}
                >
                  {plan.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={ripsDialogOpen} onOpenChange={setRipsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 border-0 max-h-[85vh] overflow-y-auto top-[50%]" data-testid="dialog-rips">
          <div className="bg-gradient-to-br from-[#0c0c0f] via-[#1a1a2e] to-[#16213e] text-white">
            <div className="relative p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
              
              <DialogHeader className="relative z-10 mb-6">
                <DialogTitle className="text-3xl font-bold text-white" data-testid="title-rips">
                  What is RIPS?
                </DialogTitle>
              </DialogHeader>

              <div className="relative z-10 space-y-5" data-testid="content-rips">
                <p className="text-white/90 text-lg italic">
                  We could tell you how RIPS works… but we'd have to bill you.
                </p>
                <p className="text-white/70">
                  And honestly, that would be more painful than the mystery.
                </p>

                <div className="border-l-2 border-orange-500 pl-4 py-2">
                  <p className="text-white/90 font-medium mb-2">
                    Here's the short, safe-for-public-consumption version:
                  </p>
                  <p className="text-white/80">
                    RIPS is our customer-acquisition engine — powered by tech we can't fully disclose.
                  </p>
                  <p className="text-white/60 text-sm mt-2">
                    Partly because it's patent-pending.<br />
                    Partly because it's trade secret.<br />
                    And partly because our lawyer starts sweating every time we get too descriptive.
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <p className="text-white font-semibold mb-3">Each plan comes with its own guaranteed price per new customer.</p>
                  <p className="text-orange-400 mb-4">You pick the plan. The plan picks the price. RIPS goes out and gets the customers.</p>
                  <div className="space-y-2 text-sm border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-white/70">NEST & FREEBYRD</span>
                      <span className="text-white font-medium">$2.77 per new customer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">ASCEND</span>
                      <span className="text-white font-medium">$2.15 per new customer</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">SOAR</span>
                      <span className="text-red-500 font-bold text-base">$1.65 per new customer</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-white/80 font-medium mb-2">How does it work?</p>
                  <p className="text-white/70 text-sm">
                    A blend of our ecosystem, social sharing, micro-behavioral signals, and a few metrics the rest of the industry hasn't even discovered yet.
                  </p>
                  <p className="text-white/50 text-sm italic mt-2">
                    (One of our algorithms may or may not be sentient. Legal won't let us check.)
                  </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/10 rounded-xl p-5 border border-orange-500/30">
                  <p className="text-white font-bold text-lg mb-2">Try it for 90 days.</p>
                  <p className="text-white/90">
                    If you're not absolutely delighted — not "kind of happy," but <span className="text-orange-400 font-semibold">delighted</span> — we refund every penny of your RIPS budget.
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    No drama, no excuses, no "processing fees."
                  </p>
                </div>

                <div className="text-center pt-2">
                  <p className="text-white/80 font-medium">Because it works.</p>
                  <p className="text-white/60 italic">And some things are better left… unbilled.</p>
                </div>
              </div>

              <DialogFooter className="relative z-10 mt-6">
                <Button 
                  onClick={() => setRipsDialogOpen(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                  data-testid="button-close-rips"
                >
                  Got it
                </Button>
              </DialogFooter>
            </div>
          </div>
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
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
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
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Countdown Timers</td>
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
                  <td className="text-center py-3 px-2">Dual timers</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-2 font-medium text-foreground">Auto-Extend</td>
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
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
                  <td className="text-center py-3 px-2"><span className="text-2xl font-bold text-foreground">—</span></td>
                  <td className="text-center py-3 px-2"><Check className="h-6 w-6 text-orange-500 mx-auto stroke-[3]" /></td>
                  <td className="text-center py-3 px-2">Standard</td>
                  <td className="text-center py-3 px-2">Priority</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-foreground">RIPS Rate</td>
                  <td className="text-center py-3 px-2">$2.77</td>
                  <td className="text-center py-3 px-2">$2.77</td>
                  <td className="text-center py-3 px-2">$2.15</td>
                  <td className="text-center py-3 px-2 text-orange-500 font-semibold">$1.65</td>
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
    </div>
  );
}
