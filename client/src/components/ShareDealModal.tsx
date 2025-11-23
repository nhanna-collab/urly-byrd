import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import type { Offer } from "@shared/schema";
import { Share2, CheckCircle } from "lucide-react";
import { formatOfferDiscount } from "@/lib/offerUtils";

interface ShareDealModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
  customerPhone: string | null;
  customerZip: string | null;
}

export default function ShareDealModal({
  offer,
  isOpen,
  onClose,
  customerPhone,
  customerZip,
}: ShareDealModalProps) {
  const [friendPhone, setFriendPhone] = useState("");
  const [friendZip, setFriendZip] = useState("");
  const [step, setStep] = useState<"input" | "success">("input");
  const [referralUrl, setReferralUrl] = useState("");
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!offer || !customerPhone || !customerZip) {
        throw new Error("Missing required information");
      }

      const viewedAt = sessionStorage.getItem(`offer-viewed-${offer.id}`);

      const res = await fetch("/api/referrals/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          referrerPhone: customerPhone,
          referrerZip: customerZip,
          friendPhone,
          friendZip,
          offerId: offer.id,
          viewedAt,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to share deal");
      }

      const result = await res.json();
      return result;
    },
    onSuccess: (data) => {
      setReferralUrl(data.referralUrl);
      setStep("success");
      toast({
        title: "Deal Shared!",
        description: "Your friend will receive a text with the deal link",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Share Failed",
        description: error.message || "Could not share deal",
        variant: "destructive",
      });
    },
  });

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerPhone || !customerZip) {
      toast({
        title: "Sign Up Required",
        description: "Please verify your phone to share deals",
        variant: "destructive",
      });
      return;
    }

    if (!friendPhone) {
      toast({
        title: "Phone Required",
        description: "Please enter your friend's phone number",
        variant: "destructive",
      });
      return;
    }

    if (!friendZip) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter your friend's ZIP code",
        variant: "destructive",
      });
      return;
    }

    shareMutation.mutate();
  };

  const handleClose = () => {
    setFriendPhone("");
    setFriendZip("");
    setStep("input");
    setReferralUrl("");
    onClose();
  };

  if (!offer) return null;

  const discountText = formatOfferDiscount(offer);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-share-deal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share This Deal
          </DialogTitle>
          <DialogDescription>
            Share this {discountText} deal with a local friend and earn 3 points!
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <form onSubmit={handleShare} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friend-phone">Friend's Phone Number</Label>
              <Input
                id="friend-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                required
                data-testid="input-friend-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="friend-zip">Friend's ZIP Code</Label>
              <Input
                id="friend-zip"
                type="text"
                placeholder="12345"
                value={friendZip}
                onChange={(e) => setFriendZip(e.target.value)}
                required
                maxLength={5}
                data-testid="input-friend-zip"
              />
              <p className="text-xs text-muted-foreground">
                Friend must be local (within 10 miles) to receive this deal
              </p>
            </div>

            <div className="bg-muted p-3 rounded-md space-y-1">
              <p className="text-sm font-medium">Deal: {offer.title}</p>
              <p className="text-xs text-muted-foreground">
                Earn 3 points when you share this offer
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancel-share"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={shareMutation.isPending}
                className="flex-1"
                data-testid="button-send-share"
              >
                {shareMutation.isPending ? "Sending..." : "Send to Friend"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium">Deal Sent Successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Your friend received a text message with the deal link
                </p>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="bg-muted p-3 rounded-md space-y-1">
                <p className="text-xs font-medium">Dev Mode - Referral Link:</p>
                <p className="text-xs font-mono break-all text-muted-foreground">
                  {referralUrl}
                </p>
              </div>
            )}

            <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
              <p className="text-sm font-medium text-primary">Earn 10 Points!</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll automatically receive points when your friend claims this deal
              </p>
            </div>

            <Button
              onClick={handleClose}
              className="w-full"
              data-testid="button-close-share"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
