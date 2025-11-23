import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin } from "lucide-react";

type Merchant = {
  id: string;
  businessName: string;
  businessCity: string;
  businessState: string;
  zipCode: string;
  activeOfferCount: number;
};

export default function MerchantsList() {
  const { data: merchants, isLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/merchants"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="max-w-7xl mx-auto pt-8">
          <h1 className="font-display font-bold text-3xl mb-6">Browse Merchants</h1>
          <p className="text-muted-foreground">Loading merchants...</p>
        </div>
      </div>
    );
  }

  if (!merchants || merchants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="max-w-7xl mx-auto pt-8">
          <h1 className="font-display font-bold text-3xl mb-6">Browse Merchants</h1>
          <p className="text-muted-foreground">No merchants with active offers at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-7xl mx-auto pt-8 pb-12">
        <h1 className="font-display font-bold text-3xl mb-2">Browse Merchants</h1>
        <p className="text-muted-foreground mb-6">
          Tap on a merchant to see their exclusive flash offers
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {merchants.map((merchant) => (
            <Link key={merchant.id} href={`/merchant/${merchant.id}`}>
              <Card 
                className="hover-elevate cursor-pointer"
                data-testid={`card-merchant-${merchant.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-semibold text-lg mb-1 truncate"
                        data-testid={`text-merchant-name-${merchant.id}`}
                      >
                        {merchant.businessName}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {merchant.businessCity}, {merchant.businessState}
                        </span>
                      </div>
                      
                      <div className="text-sm text-primary font-medium">
                        {merchant.activeOfferCount} {merchant.activeOfferCount === 1 ? 'offer' : 'offers'} available
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
