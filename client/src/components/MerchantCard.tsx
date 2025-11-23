import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MerchantCardProps {
  id: string;
  name: string;
  logo?: string;
  activeOffers: number;
  onViewOffers?: () => void;
}

export default function MerchantCard({
  name,
  logo,
  activeOffers,
  onViewOffers,
}: MerchantCardProps) {
  return (
    <Card className="p-6 flex flex-col items-center gap-4 hover-elevate" data-testid={`card-merchant-${name}`}>
      <Avatar className="h-20 w-20">
        <AvatarImage src={logo} alt={name} />
        <AvatarFallback className="text-2xl font-bold">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="text-center">
        <h3 className="font-bold text-lg" data-testid="text-merchant-name">
          {name}
        </h3>
        <Badge variant="secondary" className="mt-2" data-testid="badge-offer-count">
          {activeOffers} Active {activeOffers === 1 ? "Offer" : "Offers"}
        </Badge>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={onViewOffers}
        data-testid="button-view-offers"
      >
        View Offers
      </Button>
    </Card>
  );
}
