import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Copy, TrendingUp, Users, MousePointerClick, Eye, 
  DollarSign, Share2, Award, BarChart3, Clock, Target 
} from "lucide-react";
import { useLocation } from "wouter";
import type { CampaignFolder, Offer } from "@shared/schema";
import { formatDistance, format } from "date-fns";
import { useMemo } from "react";

export default function CampaignDetail({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const campaignId = params.id;

  const { data: folder } = useQuery<CampaignFolder>({
    queryKey: [`/api/campaign-folders/${campaignId}`],
  });

  const { data: allOffers } = useQuery<Offer[]>({
    queryKey: ["/api/my-offers"],
  });

  const campaignOffers = useMemo(() => {
    if (!allOffers || !folder) return [];
    return allOffers.filter(o => o.campaignFolder === folder.name);
  }, [allOffers, folder]);

  const metrics = useMemo(() => {
    // views = offer page impressions (stored as varchar in schema)
    const totalViews = campaignOffers.reduce((sum, offer) => {
      const views = parseInt(offer.views || "0", 10);
      return sum + (isNaN(views) ? 0 : views);
    }, 0);
    
    // unitsSold = confirmed redemptions/fulfilled sales
    // NOTE: For accurate click tracking, should aggregate from claims table
    const totalRedemptions = campaignOffers.reduce((sum, offer) => {
      return sum + (offer.unitsSold ?? 0);
    }, 0);
    
    // Conversion rate: redemptions / impressions
    const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
    
    // clickBudgetDollars = allocated budget in dollars (numeric, e.g., 25.50)
    const budgetSpent = campaignOffers.reduce((sum, offer) => {
      return sum + parseFloat(offer.clickBudgetDollars as any || "0");
    }, 0);
    
    return {
      totalViews,
      totalClicks: totalRedemptions, // Using redemptions as proxy (TODO: aggregate from claims table)
      totalForwards: 0, // TODO: Aggregate from referrals table
      totalRedemptions,
      ctr: conversionRate,
      conversionRate,
      budgetSpent,
      estimatedRevenue: 0, // TODO: Implement POS integration
      audienceReached: totalViews,
    };
  }, [campaignOffers]);

  const timeWindow = useMemo(() => {
    if (campaignOffers.length === 0) return null;
    
    const startDates = campaignOffers
      .filter(o => o.startDate)
      .map(o => new Date(o.startDate!));
    const endDates = campaignOffers
      .filter(o => o.endDate)
      .map(o => new Date(o.endDate!));
    
    if (startDates.length === 0 || endDates.length === 0) return null;
    
    const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
    
    return { start: earliestStart, end: latestEnd };
  }, [campaignOffers]);

  const campaignStatus = useMemo(() => {
    if (!timeWindow) return "completed";
    const now = new Date();
    if (now < timeWindow.start) return "future";
    if (now > timeWindow.end) return "completed";
    return "active";
  }, [timeWindow]);

  if (!user) {
    return null;
  }

  if (!folder) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-1 bg-background flex items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Loading Campaign...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "future": return "secondary";
      case "active": return "default";
      case "completed": return "outline";
      default: return "outline";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "future": return "Scheduled";
      case "active": return "Live";
      case "completed": return "Completed";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/campaigns")}
            className="mb-4"
            data-testid="button-back-to-campaigns"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>

          {/* Campaign Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display font-bold text-3xl">{folder.name}</h1>
                  <Badge variant={statusBadgeVariant(campaignStatus)} data-testid="campaign-status">
                    {statusLabel(campaignStatus)}
                  </Badge>
                  {folder.isLocked && (
                    <Badge variant="outline" className="text-muted-foreground">
                      <span className="mr-1">🔒</span> Immutable Snapshot
                    </Badge>
                  )}
                </div>
                {timeWindow && (
                  <p className="text-muted-foreground">
                    {format(timeWindow.start, "MMM d, yyyy 'at' h:mm a")} → {format(timeWindow.end, "MMM d, yyyy 'at' h:mm a")}
                    {' '}({formatDistance(timeWindow.start, timeWindow.end)})
                  </p>
                )}
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Implement duplicate to draft
                }}
                data-testid="button-duplicate-to-draft"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate to Draft
              </Button>
            </div>

            {/* High-Level Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Aggregated metrics from all {campaignOffers.length} offers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      Total Views
                    </div>
                    <div className="text-3xl font-bold" data-testid="metric-total-views">
                      {metrics.totalViews.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Audience Reached: {metrics.audienceReached.toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MousePointerClick className="w-4 h-4" />
                      Total Redemptions
                    </div>
                    <div className="text-3xl font-bold" data-testid="metric-total-redemptions">
                      {metrics.totalRedemptions.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fulfilled Sales
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      Conversion Rate
                    </div>
                    <div className="text-3xl font-bold" data-testid="metric-conversion-rate">
                      {metrics.conversionRate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Views → Redemptions
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      Budget Spent
                    </div>
                    <div className="text-3xl font-bold" data-testid="metric-budget">
                      ${metrics.budgetSpent.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Est. Revenue: ${metrics.estimatedRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8" />

          {/* Offer Snapshots List */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Offer Snapshots</h2>
            <p className="text-muted-foreground mb-6">
              Immutable performance records for each offer in this campaign
            </p>

            <div className="space-y-3">
              {campaignOffers
                .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
                .map((offer, idx) => {
                  const offerViews = parseInt(offer.views || "0", 10);
                  const safeViews = isNaN(offerViews) ? 0 : offerViews;
                  const offerRedemptions = offer.unitsSold ?? 0;
                  const conversionRate = safeViews > 0 ? (offerRedemptions / safeViews) * 100 : 0;

                  return (
                    <Card 
                      key={offer.id} 
                      className="hover-elevate"
                      data-testid={`offer-snapshot-${offer.id}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-2xl font-bold text-muted-foreground">#{idx + 1}</div>
                              <div>
                                <h3 className="font-semibold text-lg">{offer.title}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Badge variant="outline">{offer.offerType}</Badge>
                                  <span>•</span>
                                  <span>{offer.redemptionType}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-6 text-right">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Views</div>
                              <div className="text-xl font-bold">{safeViews.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Redemptions</div>
                              <div className="text-xl font-bold">{offerRedemptions.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Conv. Rate</div>
                              <div className="text-xl font-bold">{conversionRate.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {campaignOffers.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No offers in this campaign</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Propagation Analytics (Placeholder) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Propagation Chain Analytics (ABORIPS)</h2>
            <Card className="bg-purple-50 dark:bg-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Multi-Hop Referral Tracking
                </CardTitle>
                <CardDescription>
                  Advanced behavioral analytics and viral propagation metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Forwards</div>
                    <div className="text-2xl font-bold">{metrics.totalForwards}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Max Chain Depth</div>
                    <div className="text-2xl font-bold">—</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Branching Factor</div>
                    <div className="text-2xl font-bold">—</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Propagation chain tracking and ABORIPS behavioral analytics will be implemented in future updates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Behavioral Insights (Placeholder) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Behavioral Insights</h2>
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  ABORIPS Performance Analytics
                </CardTitle>
                <CardDescription>
                  AI-driven insights into customer engagement patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  Gaze tracking, micro-expressions, hesitation signals, and environmental performance indicators will be available in future updates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Visualization (Placeholder) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Campaign Timeline</h2>
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Activity Arc Visualization
                </CardTitle>
                <CardDescription>
                  Views, clicks, forwards, and redemptions over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  Timeline charts showing the campaign's activity arc will be implemented in future updates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Impact (Placeholder) */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Revenue Impact</h2>
            <Card className="bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  POS Integration & ROI Analysis
                </CardTitle>
                <CardDescription>
                  Incremental revenue, ticket impact, and net ROI estimates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic">
                  Revenue tracking requires POS integration and will be available in future updates
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
