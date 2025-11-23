import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import OfferCard from "@/components/OfferCard";
import ClaimModal from "@/components/ClaimModal";
import ReferralPointsBadge from "@/components/ReferralPointsBadge";
import { AddToPhone } from "@/components/AddToPhone";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { Loader2, Store, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import type { Offer, User } from "@shared/schema";

export default function MerchantPage() {
  const { merchantId } = useParams();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { customer, isLoading: customerAuthLoading } = useCustomerAuth();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const { data: offers = [], isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ["/api/offers"],
  });

  const { data: merchantUser } = useQuery<User>({
    queryKey: [`/api/users/${merchantId}`],
    enabled: !!merchantId,
  });

  const merchantOffers = offers.filter(offer => offer.merchantId === merchantId);
  const merchantName = merchantUser ? `${merchantUser.firstName} ${merchantUser.lastName}` : "Merchant";

  const handleClaimClick = (offer: Offer) => {
    // Check if customer is signed up before allowing claim
    // Merchants must also sign up as customers to claim offers
    if (!customer) {
      setLocation('/customer-signup');
      return;
    }
    setSelectedOffer(offer);
    setIsClaimModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsClaimModalOpen(false);
    setSelectedOffer(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex items-center gap-2">
              {user && (
                <Button
                  variant="outline"
                  onClick={() => setLocation('/offers')}
                  data-testid="button-back-dashboard"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              )}
              {customer && (
                <Button
                  variant="outline"
                  onClick={() => setLocation('/customer-rewards')}
                  data-testid="button-my-rewards"
                >
                  <Store className="h-4 w-4 mr-2" />
                  My Rewards
                </Button>
              )}
            </div>
            <div className="ml-auto">
              <ReferralPointsBadge />
            </div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display font-bold text-xl mb-4">
              {merchantName}'s Deals
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Exclusive flash sales and limited-time offers
            </p>
          </div>
        </div>
      </section>

      <section className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg mb-2">
              Active Offers
            </h2>
            <p className="text-muted-foreground">
              {merchantOffers.length} {merchantOffers.length === 1 ? 'offer' : 'offers'} available now
            </p>
          </div>

          {offersLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : merchantOffers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {merchantOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  merchantName={merchantName}
                  merchantLogo={merchantUser?.profileImageUrl || undefined}
                  onClaimClick={handleClaimClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No active offers at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 FlashDeals. All rights reserved.</p>
        </div>
      </footer>

      <ClaimModal
        offer={selectedOffer}
        isOpen={isClaimModalOpen}
        onClose={handleCloseModal}
      />

      <LocationPermissionPrompt />
      <AddToPhone />
    </div>
  );
}
