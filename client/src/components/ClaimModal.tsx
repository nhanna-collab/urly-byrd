import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Offer } from "@shared/schema";
import { Loader2, CheckCircle, Gift, QrCode } from "lucide-react";

interface ClaimModalProps {
  offer: Offer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClaimModal({ offer, isOpen, onClose }: ClaimModalProps) {
  const [step, setStep] = useState<"claiming" | "success">("claiming");
  const [couponCode, setCouponCode] = useState<string>("");
  const { toast } = useToast();

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!offer) return;
      
      const res = await fetch(`/api/offers/${offer.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to claim offer");
      }

      const result = await res.json() as { message: string; couponCode?: string };
      return result;
    },
    onSuccess: (data) => {
      // Generate a unique coupon code if not provided by backend
      const code = data.couponCode || `${offer?.id?.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      setCouponCode(code);
      setStep("success");
      toast({
        title: "Offer Claimed!",
        description: "Your coupon details will be sent to your phone",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Claim Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleClaim = () => {
    claimMutation.mutate();
  };

  const handleClose = () => {
    setStep("claiming");
    setCouponCode("");
    onClose();
  };

  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-claim">
        <DialogHeader>
          <DialogTitle data-testid="text-claim-title">
            {step === "success" ? "Offer Claimed!" : "Claim This Offer"}
          </DialogTitle>
          <DialogDescription data-testid="text-claim-description">
            {step === "claiming" && "Your coupon will be sent to the phone number associated with your account"}
            {step === "success" && "Check your phone for your exclusive coupon!"}
          </DialogDescription>
        </DialogHeader>

        {step === "claiming" && (
          <div className="space-y-4">
            <div className="bg-primary/5 p-4 rounded-lg space-y-2">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{offer.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{offer.description}</p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleClaim}
              className="w-full"
              size="lg"
              disabled={claimMutation.isPending}
              data-testid="button-claim-offer"
            >
              {claimMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming Offer...
                </>
              ) : (
                "Claim Offer"
              )}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" data-testid="icon-success" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">Coupon Claimed!</h3>
                <p className="text-sm text-muted-foreground">
                  Show this QR code at checkout to redeem your offer
                </p>
              </div>
            </div>

            {/* QR Code Display */}
            <Card className="p-6 flex flex-col items-center gap-4 bg-white dark:bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <QrCode className="h-4 w-4" />
                <span>Your Coupon Code</span>
              </div>
              <div className="p-4 bg-white rounded-lg" data-testid="qr-code-container">
                <QRCodeSVG 
                  value={couponCode}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs text-muted-foreground">Coupon Code</p>
                <p className="font-mono font-bold text-lg tracking-wider" data-testid="text-coupon-code">
                  {couponCode}
                </p>
              </div>
            </Card>

            <div className="bg-primary/5 p-3 rounded-md">
              <p className="text-xs text-center text-muted-foreground">
                💡 A copy has been sent to your phone via SMS
              </p>
            </div>

            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full"
              data-testid="button-close"
            >
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
