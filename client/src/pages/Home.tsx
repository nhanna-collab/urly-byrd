import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import ScrollingTicker from "@/components/ScrollingTicker";
import { Link } from "wouter";
import { Zap, TrendingUp, Users, Target, Package, Menu } from "lucide-react";
import targetingDiagram from "@assets/image_1762807554110.png";
import { useState, useEffect } from "react";

export default function Home() {
  const flashMessages = [
    "What do they like?",
    "Who were they with?",
    "What did they buy?",
    "Were they doing something that is an opportunity for an offer?",
    "What was their mood like?",
    "Do they like rewards?",
    "It makes a difference.",
    "It will make a difference for you."
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % flashMessages.length);
      setKey((prev) => prev + 1);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [flashMessages.length]);
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 relative">
      <div className="sticky top-0 z-50">
        <Navbar />
      </div>
      <ScrollingTicker />

      <section className="flex items-center justify-center px-4 pt-8 pb-1 bg-black relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-xl md:text-3xl font-display font-bold text-white mb-0" data-testid="heading-hero">
            Power Your Business with Highly Targeted Flash Marketing Employing Proprietary Metrics and Behavior Analytics
          </h1>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-white mt-6 mb-0" data-testid="text-hero-tagline">
            Target the right customers. Leverage the right offers.
          </h2>
          
          <div className="relative mx-8 mt-8 mb-8">
            <div className="absolute top-0 -left-32 flex justify-start">
              <img 
                src={targetingDiagram} 
                alt="Targeted Customer Segmentation Left" 
                className="w-full max-w-md"
                data-testid="img-targeting-diagram-left"
              />
            </div>
            
            <div className="flex justify-center">
              <div 
                className="bg-black rounded-lg shadow-2xl p-8 w-full max-w-sm min-h-[400px] flex items-start justify-center pt-16"
                data-testid="video-screen"
              >
                <p 
                  key={key} 
                  className={`text-white text-2xl md:text-3xl font-display font-bold text-center ${
                    currentMessageIndex >= 6 ? 'animate-zoom-slow' : 'animate-zoom-out'
                  }`}
                  data-testid="text-flash-message"
                >
                  {flashMessages[currentMessageIndex]}
                </p>
              </div>
            </div>
            
            <div className="absolute top-0 right-0 flex justify-end">
              <img 
                src={targetingDiagram} 
                alt="Targeted Customer Segmentation Right" 
                className="w-full max-w-md"
                data-testid="img-targeting-diagram-right"
              />
            </div>
          </div>
          
          <div className="-mb-32"></div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12" data-testid="heading-why-flash">
            Why Flash Marketing?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card data-testid="card-benefit-0">
              <CardContent className="p-6">
                <Package className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-sans font-bold text-xl mb-3">Reduce Excess Inventory</h3>
                <p className="text-muted-foreground">
                  Proven way to quickly clear old, seasonal, or excess inventory. Lower storage costs and make room for new products.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-1">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-sans font-bold text-xl mb-3">Immediate Revenue Spikes</h3>
                <p className="text-muted-foreground">
                  Flash sales generate quick cash flow with up to 35% increase in transaction rates. 50% of sales happen in the first hour.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-2">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-sans font-bold text-xl mb-3">Attract New Customers</h3>
                <p className="text-muted-foreground">
                  56% of consumers will try a new brand for a flash sale. Turn first-time buyers into loyal customers.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-3">
              <CardContent className="p-6">
                <Zap className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-sans font-bold text-xl mb-3">Drive Impulse Purchases</h3>
                <p className="text-muted-foreground">
                  Create FOMO (Fear Of Missing Out) with limited-time offers. Customers make spontaneous decisions instead of delaying purchases.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-4">
              <CardContent className="p-6">
                <Target className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-sans font-bold text-xl mb-3">195% Conversion Increase</h3>
                <p className="text-muted-foreground">
                  Merchants report up to 195% increase in website conversion rates with well-executed flash sale campaigns.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-benefit-5">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-sans font-bold text-xl mb-3">20-30% Higher Order Value</h3>
                <p className="text-muted-foreground">
                  Customers add more items to maximize savings during limited-time offers, boosting your average order value.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6" data-testid="heading-cta">
            Ready to Launch Your First Campaign?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Free Trial Available - No Credit Needed
          </p>
          <Link href="/start-campaigns">
            <Button size="lg" className="text-lg px-12" data-testid="button-start-now">
              Start Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
