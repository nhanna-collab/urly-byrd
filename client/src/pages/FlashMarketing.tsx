import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Zap, TrendingUp, Users, ShoppingCart, Target, BarChart3, Package } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function FlashMarketing() {
  const benefits = [
    {
      icon: Package,
      title: "Proven Way to Reduce Excess Inventory",
      description: "Quickly clear out old, seasonal, or excess inventory to make room for new products, lowering storage and operating costs."
    },
    {
      icon: TrendingUp,
      title: "Generates Immediate Revenue Spikes",
      description: "The urgency of a flash sale compels immediate purchases, leading to a quick influx of cash and a short-term boost in sales volume."
    },
    {
      icon: ShoppingCart,
      title: "Efficient Inventory Management",
      description: "Clear out old, seasonal, or excess inventory to make room for new products, which lowers storage and operating costs."
    },
    {
      icon: Users,
      title: "Attracts New Customers",
      description: "Deep discounts attract first-time buyers who may not have otherwise considered your brand. Flash sales can also lead to increased social media shares and word-of-mouth marketing."
    },
    {
      icon: Zap,
      title: "Drives Impulse Purchases",
      description: "By tapping into the Fear Of Missing Out (FOMO), the limited-time nature of these deals encourages customers to make spontaneous decisions."
    },
    {
      icon: Target,
      title: "Increases Customer Engagement and Loyalty",
      description: "Create a sense of excitement and exclusivity. A positive experience can turn a one-time buyer into a repeat customer."
    },
    {
      icon: BarChart3,
      title: "Provides a Testing Ground",
      description: "Use flash sales to test new products, pricing strategies, or to gauge demand for specific items with minimal risk."
    },
    {
      icon: TrendingUp,
      title: "Boosts Website Traffic",
      description: "A well-promoted flash sale can cause significant traffic spikes, providing opportunities for cross-selling and upselling other products."
    }
  ];

  const stats = [
    { value: "35%", label: "Increase in Transaction Rates" },
    { value: "20-30%", label: "Increase in Average Order Value" },
    { value: "195%", label: "Increase in Conversion Rate" },
    { value: "56%", label: "Higher Email Engagement" },
    { value: "50%", label: "Of Sales in First Hour" },
    { value: "$1M", label: "Made in ONE Minute (Fendi x SKIMS)" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-xl font-display font-bold text-foreground mb-4" data-testid="heading-flash-marketing">
            Flash Marketing That Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-subtitle">
            Create urgency. Drive sales. Clear inventory. All with time-limited offers that convert. Your customers can grow your business for you when you leverage demographic segmentation with flash marketing.
          </p>
        </div>

        <div className="mb-20">
          <h2 className="text-lg font-display font-bold text-foreground mb-8 text-center" data-testid="heading-benefits">
            Benefits for Merchants
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} data-testid={`card-benefit-${index}`}>
                <CardContent className="p-6">
                  <benefit.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-sans font-bold text-lg text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mb-20 bg-primary/5 rounded-lg p-8 md:p-12">
          <h2 className="text-lg font-display font-bold text-foreground mb-8 text-center" data-testid="heading-stats">
            Proven Statistics
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-xl font-display font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-lg font-display font-bold text-foreground mb-4" data-testid="heading-cta">
            Ready to Start Your Flash Marketing?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose your plan and launch your first campaign today
          </p>
          <Link href="/start-campaigns">
            <Button size="lg" className="text-lg px-8" data-testid="button-start-campaigns">
              Start Your Campaigns
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
