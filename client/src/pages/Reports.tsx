import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Users, TrendingUp, Eye, Share2, DollarSign, Activity, Download, BookOpen, TrendingUpIcon, FileText, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import AppHeader from "@/components/AppHeader";

interface AnalyticsData {
  overview: {
    totalOffers: number;
    activeOffers: number;
    expiredOffers: number;
    draftOffers: number;
    totalViews: number;
    totalClaims: number;
    totalShares: number;
    conversionRate: number;
    avgResponseTimeMinutes: number | null;
    avgConsiderationTimeMinutes: number | null;
  };
  topOffers: Array<{
    id: string;
    title: string;
    views: number;
    claims: number;
    shares: number;
    conversionRate: number;
  }>;
  customerAcquisition: {
    totalClicks: number;
    totalSpent: number;
    avgCostPerClick: number;
  };
  recentActivity: Array<{
    type: 'claim' | 'share';
    offerId: string;
    offerTitle: string;
    timestamp: Date;
  }>;
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function Reports() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to access reports",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, authLoading, toast, setLocation]);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { overview, topOffers, customerAcquisition, recentActivity } = analytics;

  const handleExport = () => {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urly-byrd-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Analytics data has been downloaded successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="px-6 pt-2 pb-6">
        <div className="max-w-7xl mx-auto space-y-6" data-testid="page-reports">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" data-testid="heading-reports">
              Analytics & Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into your flash offer performance
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" data-testid="button-export-report">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/information#how-to-create">
            <Button variant="outline" className="justify-start w-full" data-testid="link-how-to-create">
              <BookOpen className="mr-2 h-4 w-4" />
              How to Create
            </Button>
          </Link>
          <Link href="/information#important-metrics">
            <Button variant="outline" className="justify-start w-full" data-testid="link-important-metrics">
              <TrendingUpIcon className="mr-2 h-4 w-4" />
              Important Metrics
            </Button>
          </Link>
          <Link href="/information#methodology">
            <Button variant="outline" className="justify-start w-full" data-testid="link-methodology">
              <FileText className="mr-2 h-4 w-4" />
              Methodology
            </Button>
          </Link>
          <Link href="/information#things-to-consider-reports">
            <Button variant="outline" className="justify-start w-full" data-testid="link-things-to-consider">
              <AlertCircle className="mr-2 h-4 w-4" />
              Things to Consider
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-total-offers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-total-offers">
                {overview.totalOffers}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {overview.activeOffers} active, {overview.expiredOffers} expired, {overview.draftOffers} draft
              </div>
            </CardContent>
          </Card>

          <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-total-views">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-total-views">
                {overview.totalViews.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Across all offers
              </div>
            </CardContent>
          </Card>

          <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-total-claims">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-total-claims">
                {overview.totalClaims.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {overview.totalShares} shares
              </div>
            </CardContent>
          </Card>

          <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-conversion-rate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="metric-conversion-rate">
                {overview.conversionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Views to claims
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-customer-acquisition">
            <CardHeader>
              <CardTitle>Customer Acquisition</CardTitle>
              <CardDescription>Pay-per-click advertising performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Clicks</span>
                </div>
                <span className="text-lg font-bold" data-testid="metric-total-clicks">
                  {customerAcquisition.totalClicks.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Spent</span>
                </div>
                <span className="text-lg font-bold" data-testid="metric-total-spent">
                  {formatCurrency(customerAcquisition.totalSpent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avg Cost Per Click</span>
                </div>
                <span className="text-lg font-bold" data-testid="metric-avg-cost-per-click">
                  {formatCurrency(customerAcquisition.avgCostPerClick)}
                </span>
              </div>
            </CardContent>
        </Card>

        <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-top-offers">
          <CardHeader>
            <CardTitle>Top Performing Offers</CardTitle>
            <CardDescription>Your best campaigns by engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {topOffers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No offers available yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Claims</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topOffers.map((offer, index) => (
                    <TableRow key={offer.id} data-testid={`row-top-offer-${index}`}>
                      <TableCell className="font-medium">{offer.title}</TableCell>
                      <TableCell className="text-right">{offer.views.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{offer.claims}</TableCell>
                      <TableCell className="text-right">{offer.shares}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={offer.conversionRate > 10 ? "default" : "secondary"}>
                          {offer.conversionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-lime-100 dark:bg-lime-900/20" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest customer interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    data-testid={`activity-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      {activity.type === 'claim' ? (
                        <Users className="h-4 w-4 text-primary" />
                      ) : (
                        <Share2 className="h-4 w-4 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{activity.offerTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.type === 'claim' ? 'Claimed' : 'Shared'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
