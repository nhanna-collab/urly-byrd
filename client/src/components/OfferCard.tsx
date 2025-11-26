import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CountdownTimer from "./CountdownTimer";
import CountdownQty from "./CountdownQty";
import ShareDealModal from "./ShareDealModal";
import { Clock, UserPlus, UserCheck, Users, Share2, Package } from "lucide-react";
import type { Offer } from "@shared/schema";
import { formatOfferDiscount } from "@/lib/offerUtils";
import { useCustomer, useFollowMerchant, useUnfollowMerchant } from "@/hooks/use-customer";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface OfferCardProps {
  offer: Offer;
  merchantName: string;
  merchantLogo?: string;
  onClaimClick?: (offer: Offer) => void;
}

export default function OfferCard({
  offer,
  merchantName,
  merchantLogo,
  onClaimClick,
}: OfferCardProps) {
  const { customer } = useCustomer();
  const followMerchant = useFollowMerchant();
  const unfollowMerchant = useUnfollowMerchant();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const storageKey = `offer-viewed-${offer.id}`;
    if (!sessionStorage.getItem(storageKey)) {
      sessionStorage.setItem(storageKey, new Date().toISOString());
    }
  }, [offer.id]);

  const { data: followerData } = useQuery<{ count: number }>({
    queryKey: [`/api/merchants/${offer.merchantId}/followers`],
  });

  const isFollowing = customer?.following?.includes(offer.merchantId) || false;
  const discountText = formatOfferDiscount(offer);

  const handleFollowClick = async () => {
    if (!customer) {
      toast({
        title: "Sign Up Required",
        description: "Please sign up to follow merchants and receive text alerts",
      });
      return;
    }

    try {
      if (isFollowing) {
        await unfollowMerchant.mutateAsync(offer.merchantId);
        toast({
          title: "Unfollowed",
          description: `You'll no longer receive alerts from ${merchantName}`,
        });
      } else {
        await followMerchant.mutateAsync(offer.merchantId);
        toast({
          title: "Following!",
          description: `You'll get text alerts when ${merchantName} posts new offers`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update following status",
        variant: "destructive",
      });
    }
  };

  const handleClaimOffer = () => {
    if (onClaimClick) {
      onClaimClick(offer);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover-elevate flex flex-col" data-testid={`card-offer-${offer.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={offer.imageUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"}
            alt={offer.title}
            className="w-full h-full object-cover"
          />
          <Badge
            variant="destructive"
            className="absolute top-3 right-3 text-base md:text-lg font-bold px-3 py-1"
            data-testid="badge-discount"
          >
            {discountText}
          </Badge>
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-6 w-6 flex-shrink-0">
                <AvatarImage src={merchantLogo} alt={merchantName} />
                <AvatarFallback className="text-xs">
                  {merchantName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground font-medium truncate" data-testid="text-merchant">
                {merchantName}
              </span>
            </div>
            <Button
              variant={isFollowing ? "secondary" : "outline"}
              size="sm"
              onClick={handleFollowClick}
              disabled={followMerchant.isPending || unfollowMerchant.isPending}
              className="gap-1 flex-shrink-0"
              data-testid={`button-follow-${offer.merchantId}`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3" />
                  <span className="hidden sm:inline">Follow</span>
                </>
              )}
            </Button>
          </div>

          {followerData && followerData.count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span data-testid="text-follower-count">
                {followerData.count} {followerData.count === 1 ? 'follower' : 'followers'}
              </span>
            </div>
          )}

          <h3 className="font-bold text-lg md:text-xl line-clamp-2" data-testid="text-offer-title">
            {offer.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-description">
            {offer.description}
          </p>

          {offer.originalPrice && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                ${parseFloat(offer.originalPrice as any).toFixed(2)}
              </span>
            </div>
          )}

          <div className="mt-auto pt-3 border-t flex flex-col gap-3">
            {offer.addType === "countdown_qty" ? (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="text-xs font-medium">Inventory:</span>
                </div>
                <CountdownQty 
                  maxClicksAllowed={offer.maxClicksAllowed || 0} 
                  currentClicks={offer.unitsSold || 0} 
                  size="sm" 
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-medium">Ending in:</span>
                </div>
                <CountdownTimer endDate={new Date(offer.endDate)} size="sm" />
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShareModalOpen(true)}
              data-testid="button-share-deal"
              className="flex-1 gap-2"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share Deal</span>
            </Button>
            <Button
              className="flex-1"
              onClick={handleClaimOffer}
              data-testid="button-claim-offer"
            >
              Claim This Deal
            </Button>
          </div>
        </div>
      </Card>

      <ShareDealModal
        offer={offer}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        customerPhone={customer?.phoneNumber || null}
        customerZip={customer?.zipCode || null}
      />
    </>
  );
}
