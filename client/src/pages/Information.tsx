import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, Folder, Wrench, HelpCircle, Glasses, BookOpen, FileText, TrendingUpIcon, AlertCircle, Lightbulb, Target, Shield, Info, ChevronDown, ArrowLeft, LucideIcon } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

type InfoCard = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  content: React.ReactNode;
};

export default function Information() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  // Handle hash navigation to auto-expand cards
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (hash) {
        setExpandedCard(hash);
      }
    };
    
    // Check hash on mount
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  const sections: { title: string; icon: LucideIcon; cards: InfoCard[] }[] = [
    {
      title: "Create Offer",
      icon: Rocket,
      cards: [
        {
          id: "offer-strategies",
          title: "Offer Strategies",
          description: "Learn effective strategies for creating compelling offers that drive customer engagement and conversions.",
          icon: Target,
          content: (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Match Goal to Offer Type</p>
                <p>Overstock → BOGO/% Off | Foot traffic → Countdown | Clear inventory → $ Off | Loyalty → Codes | New customers → Acquisition</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Title & Description</p>
                <p>Simple + urgent. Example: "25% Off Gyros — First 60!"</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Set Limits</p>
                <p>Max clicks = inventory | Budget = spend cap | Always notify at max</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Redemption Type</p>
                <p>MP = instant action | RC = use later</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Delivery</p>
                <p>Text = fast | Codes = POS | Link = shareable | MMS = visual | Wallet = retention</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Monitor</p>
                <p>Enable notifications to pivot fast</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Visuals</p>
                <p>Images boost clicks 40-70%</p>
              </div>
            </div>
          ),
        },
        {
          id: "best-practices",
          title: "Best Practices",
          description: "Follow proven best practices to maximize the impact of your flash marketing offers.",
          icon: Lightbulb,
          content: (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Align With Real Capacity</p>
                <p>Never promote more than you can fulfill that day. Check inventory, appointments, staff, and space before launch.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Brief Team First</p>
                <p>Review details pre-shift. Post one-sheet summary near POS. Clarify who qualifies.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Time to Business Flow</p>
                <p>Launch during off-peak to fill quiet hours. Avoid deep discounts during natural traffic—use lighter loyalty instead.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Simplify Redemption</p>
                <p>Train staff to verify codes in under 10 seconds. Keep visible success indicator.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Consistent Communication</p>
                <p>Uniform signage, messaging, and staff phrases. Maintain brand tone even when discounting.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Track Daily</p>
                <p>Check redemptions vs. inventory/bookings. Note which times and types perform best. Capture staff insights.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Protect Margins</p>
                <p>Set max clicks = real capacity. Pause when limits reached. Review profitability weekly.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Blend Marketing + Operations</p>
                <p>Shared calendar for promos. Pilot in one location before expanding.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Use Feedback Loops</p>
                <p>Record customer comments. Feed into next campaign. Let system learn from redemptions.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">End Gracefully</p>
                <p>Remove signage, update POS, confirm "ended" in system. Offer late arrivals 10% loyalty coupon for goodwill.</p>
              </div>
            </div>
          ),
        },
        {
          id: "warnings",
          title: "Warnings",
          description: "Important warnings and considerations to avoid common pitfalls when creating offers.",
          icon: Shield,
          content: (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Launching Without Inventory or Capacity</p>
                <p>Check stock, prep time, appointments, and space before publishing. Unfulfillable offers destroy trust and waste budget.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Overlapping or Conflicting Offers</p>
                <p>Close previous campaign before launching new one. Avoid double-stacking on same product/service window.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Forgetting to Notify or Train Staff</p>
                <p>Brief front line before shift. Post or announce live offers to prevent "What coupon?" moments.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Misaligned Click Budget and Inventory</p>
                <p>Cap clicks at real stock/capacity. Budget must match expected traffic or offer shuts off mid-rush.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Ignoring Geo Radius Accuracy</p>
                <p>Too wide (beyond 10-15 miles) attracts clicks from people who never visit. Tighten to real trade area.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Using Wrong Redemption Type</p>
                <p>RC = flexible redemption, not for flash. MP = ends immediately, not for multi-day campaigns.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Not Setting or Monitoring Click Caps</p>
                <p>Always enable Max Clicks and notifications. Uncapped campaigns overspend fast, especially with viral sharing.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Poor Offer Wording or Ambiguous Terms</p>
                <p>Specify exact product and minimum purchase. Include clear conditions to prevent checkout disputes.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Neglecting Image Quality or Brand Tone</p>
                <p>Low-res or irrelevant images reduce clicks by 60%. Use bright, professional visuals consistent with brand.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Forgetting to End or Clean Up Offers</p>
                <p>Confirm "inactive" in dashboard. Remove in-store signage to prevent customer confusion and mistrust.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Mismanaging Timing and Duration</p>
                <p>Minimum 2 hours for urgency + redemption time. Avoid shift changes or meal rushes.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Ignoring Analytics Afterward</p>
                <p>Always review CTR, redemptions, and cost per new customer to improve next campaign.</p>
              </div>
            </div>
          ),
        },
        {
          id: "things-to-consider-create",
          title: "Things to Consider",
          description: "Key factors to think about before launching your offer to ensure success.",
          icon: AlertCircle,
          content: (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">Inventory vs. Expected Demand</p>
                <p>Can you fulfill strong engagement? Enough margin to support discount? Won't deplete stock for full-price customers?</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Timing and Duration</p>
                <p>Align with slow periods. Staff ready at start/end times. Check for competing events nearby.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Staffing and Workflow</p>
                <p>Enough team for surges. Redemptions won't slow regular flow. Staff know how to confirm coupons.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Customer Experience</p>
                <p>First impression on-brand and professional. Redemption feels quick, clear, and fair.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Target Audience Fit</p>
                <p>Best-fit local audience within 10 miles. Right for new vs. returning customers. Best offer type for goal.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Pricing and Profitability</p>
                <p>True cost per sale after discount and ad spend. Bundle add-ons to preserve margin.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Visual and Message Alignment</p>
                <p>Image crisp, well-lit, relevant. Headline states benefit. Logo visible for recognition.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Notification and Monitoring Setup</p>
                <p>All notifications enabled. Team knows who receives alerts and can act quickly.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Post-Offer Follow-Up</p>
                <p>Collect feedback and repeat-visit data. Retarget redeemers with loyalty rewards. Define success metrics.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Legal and Policy Consistency</p>
                <p>Terms clearly stated (expiry, limits, exclusions). Comply with local regulations. Refund policy aligned.</p>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: "Campaigns",
      icon: Folder,
      cards: [
        {
          id: "convention-structure",
          title: "Convention Structure",
          description: "Understand how to organize and structure your campaigns for optimal management.",
          icon: FileText,
          content: "Content coming soon...",
        },
        {
          id: "hierarchy",
          title: "Hierarchy",
          description: "Learn about campaign hierarchy and how to organize offers into meaningful groups.",
          icon: TrendingUpIcon,
          content: "Content coming soon...",
        },
        {
          id: "automated-ordering",
          title: "Automated Ordering",
          description: "Discover how automated ordering can streamline your campaign management process.",
          icon: Rocket,
          content: "Content coming soon...",
        },
        {
          id: "things-to-consider-campaigns",
          title: "Things to Consider",
          description: "Important considerations for planning and executing successful campaigns.",
          icon: AlertCircle,
          content: "Content coming soon...",
        },
      ],
    },
    {
      title: "Dashboard",
      icon: Wrench,
      cards: [
        {
          id: "useful-info",
          title: "Useful Info",
          description: "Essential information and tips to help you make the most of your dashboard.",
          icon: Info,
          content: "Content coming soon...",
        },
        {
          id: "how-to-use-it",
          title: "How to Use It",
          description: "Step-by-step guidance on navigating and using the dashboard effectively.",
          icon: BookOpen,
          content: "Content coming soon...",
        },
        {
          id: "staying-ahead",
          title: "Staying Ahead",
          description: "Strategies and insights to stay ahead of the competition and maximize your results.",
          icon: TrendingUpIcon,
          content: "Content coming soon...",
        },
        {
          id: "things-to-consider-dashboard",
          title: "Things to Consider",
          description: "Key factors to monitor and consider when managing your business through the dashboard.",
          icon: AlertCircle,
          content: "Content coming soon...",
        },
      ],
    },
    {
      title: "Create Reports",
      icon: HelpCircle,
      cards: [
        {
          id: "how-to",
          title: "How To",
          description: "Learn how to generate comprehensive reports that provide valuable insights.",
          icon: BookOpen,
          content: "Content coming soon...",
        },
        {
          id: "important-metrics",
          title: "Important Metrics",
          description: "Understand the key metrics that matter most for your business success.",
          icon: TrendingUpIcon,
          content: "Content coming soon...",
        },
        {
          id: "using-the-data",
          title: "Using the Data",
          description: "Discover how to effectively use your data to make informed business decisions.",
          icon: FileText,
          content: "Content coming soon...",
        },
        {
          id: "things-to-consider-create-reports",
          title: "Things to Consider",
          description: "Important factors to keep in mind when creating and interpreting reports.",
          icon: AlertCircle,
          content: "Content coming soon...",
        },
      ],
    },
    {
      title: "Reports",
      icon: Glasses,
      cards: [
        {
          id: "how-to-create",
          title: "How to Create",
          description: "Learn how to generate comprehensive reports that provide valuable insights.",
          icon: BookOpen,
          content: "Content coming soon...",
        },
        {
          id: "important-metrics-reports",
          title: "Important Metrics",
          description: "Understand the key metrics that matter most for your business success.",
          icon: TrendingUpIcon,
          content: "Content coming soon...",
        },
        {
          id: "methodology",
          title: "Methodology",
          description: "Discover the methodology behind our analytics and how data is collected and calculated.",
          icon: FileText,
          content: "Content coming soon...",
        },
        {
          id: "things-to-consider-reports",
          title: "Things to Consider",
          description: "Important factors to keep in mind when interpreting and acting on your reports.",
          icon: AlertCircle,
          content: "Content coming soon...",
        },
      ],
    },
  ];

  const expandedCardData = sections
    .flatMap(section => section.cards)
    .find(card => card.id === expandedCard) as InfoCard | undefined;

  const getPageLinkForCard = (cardId: string) => {
    // Create Offer section cards
    if (['offer-strategies', 'best-practices', 'warnings', 'things-to-consider-create'].includes(cardId)) {
      return { path: '/dashboard?create=true', label: 'Create Offer', icon: Rocket };
    }
    // Campaigns section cards
    if (['convention-structure', 'hierarchy', 'automated-ordering', 'things-to-consider-campaigns'].includes(cardId)) {
      return { path: '/campaigns', label: 'Campaigns', icon: Folder };
    }
    // Dashboard section cards
    if (['useful-info', 'how-to-use-it', 'staying-ahead', 'things-to-consider-dashboard'].includes(cardId)) {
      return { path: '/dashboard', label: 'Dashboard', icon: Wrench };
    }
    // Create Reports section cards
    if (['how-to', 'important-metrics', 'using-the-data', 'things-to-consider-create-reports'].includes(cardId)) {
      return { path: '/reports', label: 'Create Reports', icon: HelpCircle };
    }
    // Reports section cards
    if (['how-to-create', 'important-metrics-reports', 'methodology', 'things-to-consider-reports'].includes(cardId)) {
      return { path: '/reports', label: 'Reports', icon: Glasses };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8" data-testid="page-information">
          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-information">
              Information & Resources
            </h1>
            <p className="text-muted-foreground mt-1">
              Everything you need to know to succeed with Urly Byrd
            </p>
          </div>

          {sections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.title} className="space-y-4">
                <div className="flex items-center gap-2">
                  <SectionIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.cards.map((card) => {
                    const CardIcon = card.icon;
                    return (
                      <Card 
                        key={card.id}
                        id={card.id}
                        className="scroll-mt-24 transition-all cursor-pointer hover-elevate"
                        onClick={() => setExpandedCard(card.id)}
                        data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <CardIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{card.title}</CardTitle>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCard(card.id);
                              }}
                              aria-label={`Expand ${card.title} details`}
                              data-testid={`button-toggle-${card.id}`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm">
                            {card.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Page Overlay for Expanded Card */}
      {expandedCardData && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="bg-background border-b px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              {expandedCardData.icon && <expandedCardData.icon className="h-6 w-6 text-primary" />}
              <h2 className="text-xl font-bold">{expandedCardData.title}</h2>
            </div>
          </div>
          <div className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <p className="text-muted-foreground mb-6">{expandedCardData.description}</p>
              <div className="bg-card rounded-lg border p-6 relative">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {(() => {
                    const pageLink = getPageLinkForCard(expandedCardData.id);
                    if (pageLink) {
                      const LinkIcon = pageLink.icon;
                      return (
                        <Button
                          variant="default"
                          onClick={() => setLocation(pageLink.path)}
                          aria-label={`Go to ${pageLink.label}`}
                          data-testid={`button-go-to-${pageLink.label.toLowerCase().replace(/\s+/g, '-')}`}
                          className="font-bold"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          {pageLink.label}
                        </Button>
                      );
                    }
                    return null;
                  })()}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setExpandedCard(null)}
                    aria-label="Back to Information"
                    data-testid="button-back"
                    className="font-bold"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                {expandedCardData.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
