import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TrendingUp, Users, MousePointerClick, Eye, DollarSign, Copy, BarChart3, Clock, Target } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import type { CampaignFolder, Offer } from "@shared/schema";
import { formatDistance } from "date-fns";
import CampaignObjectivePriority from "@/components/CampaignObjectivePriority";

type CampaignViewMode = "all" | "future" | "active" | "completed" | "objectives";

interface CampaignMetrics {
  totalViews: number;
  totalClicks: number;
  totalForwards: number;
  totalRedemptions: number;
  ctr: number;
  conversionRate: number;
  budgetSpent: number;
  estimatedRevenue: number;
  offersCount: number;
  audienceReached: number;
}

interface CampaignWithMetrics extends CampaignFolder {
  offers: Offer[];
  metrics: CampaignMetrics;
  startDate: Date;
  endDate: Date;
  status: "future" | "active" | "completed";
}

function calculateCampaignMetrics(offers: Offer[]): CampaignMetrics {
  // views = offer page impressions (stored as varchar in schema)
  const totalViews = offers.reduce((sum, offer) => {
    const views = parseInt(offer.views || "0", 10);
    return sum + (isNaN(views) ? 0 : views);
  }, 0);
  
  // unitsSold = confirmed redemptions/fulfilled sales
  // NOTE: This does NOT include raw clicks. For accurate click tracking,
  // we should aggregate from claims and customerAcquisitionClicks tables.
  // Current implementation uses redemptions as proxy for clicks.
  const totalRedemptions = offers.reduce((sum, offer) => {
    return sum + (offer.unitsSold ?? 0);
  }, 0);
  
  // Conversion rate: redemptions / impressions
  const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0;
  
  // clickBudgetDollars = allocated budget in dollars (integer)
  const budgetSpent = offers.reduce((sum, offer) => {
    return sum + (offer.clickBudgetDollars ?? 0);
  }, 0);
  
  return {
    totalViews,
    totalClicks: totalRedemptions, // Using redemptions as proxy (TODO: aggregate from claims table)
    totalForwards: 0, // TODO: Aggregate from referrals table
    totalRedemptions,
    ctr: conversionRate, // CTR = conversion rate in this context
    conversionRate,
    budgetSpent,
    estimatedRevenue: 0, // TODO: Implement POS integration
    offersCount: offers.length,
    audienceReached: totalViews, // Using impressions as proxy for unique users
  };
}

function getCampaignStatus(offers: Offer[]): "future" | "active" | "completed" {
  if (offers.length === 0) return "completed";
  
  const now = new Date();
  
  // Check offer status field first (canonical state)
  const hasActiveOffers = offers.some(o => o.status === "active");
  const hasExpiredOffers = offers.some(o => o.status === "expired");
  const hasDraftOffers = offers.some(o => o.status === "draft");
  
  // If all offers are expired, campaign is completed
  if (offers.every(o => o.status === "expired")) {
    return "completed";
  }
  
  // If any offers are active, campaign is active
  if (hasActiveOffers) {
    return "active";
  }
  
  // Fallback to date-based calculation
  const startDates = offers
    .filter(o => o.startDate)
    .map(o => new Date(o.startDate!));
  const endDates = offers
    .filter(o => o.endDate)
    .map(o => new Date(o.endDate!));
  
  if (startDates.length === 0 || endDates.length === 0) {
    // No dates available - use status
    return hasDraftOffers ? "future" : "completed";
  }
  
  const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
  const latestEnd = new Date(Math.max(...endDates.map(d => d.getTime())));
  
  // Account for auto-extensions
  const hasAutoExtended = offers.some(o => o.lastAutoExtendedAt);
  
  if (now < earliestStart) return "future";
  if (now > latestEnd && !hasAutoExtended) return "completed";
  return "active";
}

export default function Campaigns() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<CampaignViewMode>("all");
  const [campaignObjectives, setCampaignObjectives] = useState<string[]>([]);

  const { data: folders, isLoading: foldersLoading } = useQuery<CampaignFolder[]>({
    queryKey: ["/api/campaign-folders"],
  });

  const { data: offers, isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ["/api/my-offers"],
  });

  // Get only campaigns (folders with status='campaign')
  const campaigns = useMemo(() => {
    if (!folders || !offers) return [];
    
    const campaignFolders = folders.filter(f => f.status === "campaign");
    
    return campaignFolders.map(folder => {
      const folderOffers = offers.filter(o => o.campaignFolder === folder.name);
      const metrics = calculateCampaignMetrics(folderOffers);
      const status = getCampaignStatus(folderOffers);
      
      const startDates = folderOffers
        .filter(o => o.startDate)
        .map(o => new Date(o.startDate!));
      const endDates = folderOffers
        .filter(o => o.endDate)
        .map(o => new Date(o.endDate!));
      const startDate = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : new Date();
      const endDate = endDates.length > 0 ? new Date(Math.max(...endDates.map(d => d.getTime()))) : new Date();
      
      return {
        ...folder,
        offers: folderOffers,
        metrics,
        startDate,
        endDate,
        status,
      } as CampaignWithMetrics;
    });
  }, [folders, offers]);

  // Filter campaigns by view mode
  const filteredCampaigns = useMemo(() => {
    if (activeView === "all") return campaigns;
    return campaigns.filter(c => c.status === activeView);
  }, [campaigns, activeView]);

  // Sort campaigns by start date (newest first)
  const sortedCampaigns = useMemo(() => {
    return [...filteredCampaigns].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }, [filteredCampaigns]);

  // Calculate counts once for badges
  const counts = useMemo(() => ({
    total: campaigns.length,
    future: campaigns.filter(c => c.status === "future").length,
    active: campaigns.filter(c => c.status === "active").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  }), [campaigns]);

  // Show loading state
  const isLoading = foldersLoading || offersLoading;

  if (!user) {
    return null;
  }

  const statusBadgeVariant = (status: "future" | "active" | "completed") => {
    switch (status) {
      case "future": return "secondary";
      case "active": return "default";
      case "completed": return "outline";
    }
  };

  const statusLabel = (status: "future" | "active" | "completed") => {
    switch (status) {
      case "future": return "Scheduled";
      case "active": return "Live";
      case "completed": return "Completed";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display font-bold text-2xl mb-2">
              Campaign Analytics
            </h1>
            <p className="text-muted-foreground">
              Performance insights for your launched campaigns
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <ToggleGroup
              type="single"
              value={activeView}
              onValueChange={(value) => value && setActiveView(value as CampaignViewMode)}
              className="justify-start flex-wrap gap-2"
              data-testid="toggle-campaign-view"
            >
              <ToggleGroupItem value="all" data-testid="tab-all-campaigns">
                All Campaigns
                <Badge variant="secondary" className="ml-2">{counts.total}</Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="future" data-testid="tab-future-campaigns">
                Future
                <Badge variant="secondary" className="ml-2">{counts.future}</Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="active" data-testid="tab-active-campaigns">
                Active
                <Badge variant="secondary" className="ml-2">{counts.active}</Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="completed" data-testid="tab-completed-campaigns">
                Completed
                <Badge variant="secondary" className="ml-2">{counts.completed}</Badge>
              </ToggleGroupItem>
              <ToggleGroupItem value="objectives" data-testid="tab-objectives">
                <Target className="h-3.5 w-3.5 mr-1" />
                Objectives
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Objectives View */}
          {activeView === "objectives" ? (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Objectives</CardTitle>
                <CardDescription>
                  Define and prioritize your marketing objectives to guide campaign strategy
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <CampaignObjectivePriority
                  value={campaignObjectives}
                  onChange={setCampaignObjectives}
                />
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-center">
                  <div className="text-muted-foreground">Loading campaigns...</div>
                </div>
              </CardContent>
            </Card>
          ) : sortedCampaigns.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Campaigns Yet</CardTitle>
                <CardDescription>
                  {activeView === "all" 
                    ? "Launch a campaign from your Drafts to see analytics here"
                    : `No ${activeView} campaigns at this time`
                  }
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedCampaigns.map((campaign) => (
                <Card 
                  key={campaign.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/campaigns/${campaign.id}`)}
                  data-testid={`campaign-card-${campaign.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{campaign.name}</CardTitle>
                          <Badge variant={statusBadgeVariant(campaign.status)} data-testid={`campaign-status-${campaign.id}`}>
                            {statusLabel(campaign.status)}
                          </Badge>
                          {campaign.isLocked && (
                            <Badge variant="outline" className="text-muted-foreground">
                              <span className="mr-1">🔒</span> Immutable
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {campaign.metrics.offersCount} offer{campaign.metrics.offersCount !== 1 ? 's' : ''} • 
                          {' '}{formatDistance(campaign.startDate, campaign.endDate)} duration •
                          {' '}{campaign.status === "active" ? "Ends" : campaign.status === "future" ? "Starts" : "Ended"}{' '}
                          {formatDistance(campaign.status === "future" ? campaign.startDate : campaign.endDate, new Date(), { addSuffix: true })}
                        </CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Implement duplicate to draft
                        }}
                        data-testid={`button-duplicate-campaign-${campaign.id}`}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate to Draft
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Performance Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          Views
                        </div>
                        <div className="text-2xl font-bold" data-testid={`campaign-views-${campaign.id}`}>
                          {campaign.metrics.totalViews.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MousePointerClick className="w-4 h-4" />
                          Redemptions
                        </div>
                        <div className="text-2xl font-bold" data-testid={`campaign-redemptions-${campaign.id}`}>
                          {campaign.metrics.totalRedemptions.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          Conv. Rate
                        </div>
                        <div className="text-2xl font-bold" data-testid={`campaign-conversion-rate-${campaign.id}`}>
                          {campaign.metrics.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          Budget
                        </div>
                        <div className="text-2xl font-bold" data-testid={`campaign-budget-${campaign.id}`}>
                          ${campaign.metrics.budgetSpent.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Top Offers Preview */}
                    {campaign.offers.length > 0 && (
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium text-muted-foreground mb-2">Top Performing Offers:</div>
                        <div className="space-y-1">
                          {campaign.offers
                            .sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0))
                            .slice(0, 3)
                            .map((offer, idx) => (
                              <div key={offer.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {idx + 1}. {offer.title}
                                </span>
                                <span className="font-medium">{offer.unitsSold || 0} redemptions</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
