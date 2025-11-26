import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ClaimModal from "@/components/ClaimModal";
import ShareDealModal from "@/components/ShareDealModal";
import CountdownTimer from "@/components/CountdownTimer";
import CountdownQty from "@/components/CountdownQty";
import ReferralPointsBadge from "@/components/ReferralPointsBadge";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { AddToPhone } from "@/components/AddToPhone";
import { useCustomer } from "@/hooks/use-customer";
import { formatOfferDiscount } from "@/lib/offerUtils";
import type { Offer, User } from "@shared/schema";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Share2,
  Store,
  Package,
  AlertCircle,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function OfferDetailPage() {
  const { offerId } = useParams();
  const [, setLocation] = useLocation();
  const { customer } = useCustomer();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: offer, isLoading: offerLoading } = useQuery<Offer>({
    queryKey: [`/api/offers/${offerId}`],
    enabled: !!offerId,
  });

  const { data: merchantUser, isLoading: merchantLoading } = useQuery<User>({
    queryKey: [`/api/users/${offer?.merchantId}`],
    enabled: !!offer?.merchantId,
  });

  if (offerLoading || merchantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Offer Not Found</h1>
        <p className="text-muted-foreground text-center max-w-md">
          This offer may have expired or been removed.
        </p>
        <Button onClick={() => setLocation("/customer-landing")} data-testid="button-browse-offers">
          Browse Active Offers
        </Button>
      </div>
    );
  }

  const merchantName = merchantUser
    ? `${merchantUser.firstName} ${merchantUser.lastName}`
    : "Merchant";
  const discountText = formatOfferDiscount(offer);

  const handleClaimClick = () => {
    if (!customer) {
      setLocation("/customer-signup");
      return;
    }
    setIsClaimModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/customer-landing")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Offers</span>
          </Button>
          <ReferralPointsBadge />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="overflow-hidden" data-testid="card-offer-detail">
            {/* Offer Image */}
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <img
                src={
                  offer.imageUrl ||
                  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800"
                }
                alt={offer.title}
                className="w-full h-full object-cover"
              />
              <Badge
                variant="destructive"
                className="absolute top-4 right-4 text-2xl font-bold px-4 py-2"
                data-testid="badge-discount"
              >
                {discountText}
              </Badge>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {/* Merchant Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={merchantUser?.profileImageUrl}
                    alt={merchantName}
                  />
                  <AvatarFallback>
                    {merchantName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium" data-testid="text-merchant-name">
                    {merchantName}
                  </p>
                  {merchantUser?.businessCity && merchantUser?.businessState && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span data-testid="text-merchant-location">
                        {merchantUser.businessCity}, {merchantUser.businessState}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Offer Title & Description */}
              <div className="space-y-3">
                <h1
                  className="text-3xl md:text-4xl font-bold font-display"
                  data-testid="text-offer-title"
                >
                  {offer.title}
                </h1>
                <p
                  className="text-lg text-muted-foreground"
                  data-testid="text-offer-description"
                >
                  {offer.description}
                </p>
              </div>

              {/* Price Info */}
              {offer.originalPrice && (
                <div className="flex items-center gap-3">
                  <span className="text-xl text-muted-foreground line-through">
                    ${parseFloat(offer.originalPrice as any).toFixed(2)}
                  </span>
                  <Badge variant="secondary" className="text-sm">
                    {discountText}
                  </Badge>
                </div>
              )}

              <Separator />

              {/* Countdown / Inventory */}
              <div className="space-y-3">
                {offer.addType === "countdown_qty" ? (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        Limited Inventory:
                      </span>
                    </div>
                    <CountdownQty
                      maxClicksAllowed={offer.maxClicksAllowed || 0}
                      currentClicks={offer.unitsSold || 0}
                      size="lg"
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span className="text-sm font-medium">Time Remaining:</span>
                    </div>
                    {offer.endDate && (
                      <CountdownTimer endDate={new Date(offer.endDate)} size="lg" />
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleClaimClick}
                  data-testid="button-claim-offer"
                >
                  <Store className="h-5 w-5" />
                  Claim This Deal
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setIsShareModalOpen(true)}
                  data-testid="button-share-offer"
                >
                  <Share2 className="h-5 w-5" />
                  Share with Friend
                </Button>
              </div>

              {/* Redemption Type Badge */}
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-xs">
                  {offer.redemptionType === "prepayment_offer"
                    ? "Pre-Payment Required"
                    : "Pay at Redemption"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <ClaimModal
        offer={offer}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

      <ShareDealModal
        offer={offer}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        customerPhone={customer?.phoneNumber || null}
        customerZip={customer?.zipCode || null}
      />

      <LocationPermissionPrompt />
      <AddToPhone />
    </div>
  );
}
