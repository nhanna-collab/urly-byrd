import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, ExternalLink, Calendar, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CountdownTimer from "./CountdownTimer";
import type { Offer } from "@shared/schema";
import { formatOfferDiscount, formatOfferDetails } from "@/lib/offerUtils";

interface CouponModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  claimResponse?: any;
}

export default function CouponModal({ offer, isOpen, onClose, claimResponse }: CouponModalProps) {
  const [copied, setCopied] = useState(false);
  const [claimedAt] = useState(new Date());
  const { toast } = useToast();

  if (!offer) return null;

  const isMustPayDuringPromo = offer.redemptionType === "prepayment_offer";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyNow = () => {
    if (offer.purchaseUrl) {
      window.open(offer.purchaseUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-coupon">
        <DialogHeader>
          <DialogTitle>Coupon Sent to Your Phone!</DialogTitle>
          <DialogDescription>
            Your exclusive coupon has been delivered via SMS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="bg-primary/10 rounded-full p-6">
              <Check className="h-12 w-12 text-primary" />
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">Check Your Phone!</h3>
            <p className="text-muted-foreground">
              We've sent your coupon to{" "}
              <span className="font-medium">{claimResponse?.phoneNumber}</span>
            </p>
          </div>
          {/* Offer Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-center font-medium text-sm">
              {offer.title}
            </p>
            <p className="text-center text-xs text-muted-foreground mt-1">
              {formatOfferDiscount(offer)}
            </p>
          </div>

          {/* Dev Mode - Show SMS Content */}
          {claimResponse?.devMessage && (
            <div className="bg-muted p-4 rounded-lg border-2 border-dashed border-primary">
              <p className="text-xs font-medium text-center mb-2 text-primary">
                DEV MODE - SMS Message:
              </p>
              <div className="bg-background p-3 rounded font-mono text-xs whitespace-pre-wrap">
                {claimResponse.devMessage}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => handleCopy(claimResponse.devMessage)}
              >
                {copied ? <Check className="h-3 w-3 mr-2" /> : <Copy className="h-3 w-3 mr-2" />}
                Copy Message
              </Button>
            </div>
          )}

          {/* Expiration Countdown */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm font-medium text-center mb-2">
              Offer expires in:
            </p>
            <CountdownTimer endDate={new Date(offer.endDate)} size="md" />
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full" data-testid="button-close-modal">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
