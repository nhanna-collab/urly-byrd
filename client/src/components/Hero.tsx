import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap } from "lucide-react";
import restaurantImg from "@assets/image_1762142298851.png";
import dryCleanerImg from "@assets/image_1762139854827.png";
import carWashImg from "@assets/image_1762142406788.png";
import yogaStudioImg from "@assets/image_1762139980544.png";
import grocerImg from "@assets/image_1762150084592.png";

interface HeroProps {
  backgroundImage: string;
  activeDeals: number;
  activeMerchants: number;
  onBrowseDeals?: () => void;
  onMerchantSignup?: () => void;
}

const merchantImages = [restaurantImg, dryCleanerImg, carWashImg, yogaStudioImg, grocerImg];

export default function Hero({
  backgroundImage,
  activeDeals,
  activeMerchants,
  onBrowseDeals,
  onMerchantSignup,
}: HeroProps) {
  return (
    <>
      {/* Tagline above black section */}
      <div className="bg-background py-4 text-center">
        <p 
          className="text-black text-xl md:text-2xl lg:text-3xl font-semibold" 
          style={{ fontFamily: 'var(--font-cursive)' }}
          data-testid="text-tagline"
        >
          Your place for flash offers from your local merchants
        </p>
      </div>

      {/* Black Background Section - Right below navbar */}
      <div className="relative bg-black overflow-hidden">
        <div className="relative flex flex-col items-center justify-center text-center px-4 py-8 text-white">
          <Badge
            variant="secondary"
            className="mb-4 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
            data-testid="badge-live-indicator"
          >
            <Zap className="h-3 w-3 mr-1 fill-current" />
            Live Deals
          </Badge>

          <h1 className="font-display font-black text-3xl md:text-5xl lg:text-6xl mb-4 max-w-4xl">
            Time-Limited Offers
            <br />
            Don't Miss Out
          </h1>

          <p className="text-sm md:text-base mb-6 max-w-2xl text-white/90">
            Discover exclusive flash sales from top merchants. Limited time, unbeatable prices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Button
              size="default"
              variant="default"
              className="px-6"
              onClick={onBrowseDeals}
              data-testid="button-browse-deals"
            >
              Browse Active Deals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="default"
              variant="outline"
              className="px-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              onClick={onMerchantSignup}
              data-testid="button-merchant-signup"
            >
              For Merchants
            </Button>
          </div>

          <div className="flex gap-8 text-sm mb-8">
            <div className="flex flex-col" data-testid="stat-merchants">
              <span className="font-black text-2xl">{activeMerchants}</span>
              <span className="text-white/80">Active Merchants</span>
            </div>
            <div className="flex flex-col" data-testid="stat-deals">
              <span className="font-black text-2xl">{activeDeals}</span>
              <span className="text-white/80">Live Deals</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2 max-w-5xl w-full px-4">
            {merchantImages.map((image, index) => (
              <div
                key={index}
                className="aspect-square rounded-md overflow-hidden transition-opacity"
                data-testid={`merchant-image-${index}`}
              >
                <img
                  src={image}
                  alt="Merchant type"
                  className="w-full h-full object-cover brightness-110"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
