import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Award, Trophy, Clock } from "lucide-react";
import { useCustomer } from "@/hooks/use-customer";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface ReferralData {
  totalPoints: number;
  referrals: Array<{
    id: string;
    referralCode: string;
    friendPhone: string;
    offerId: string;
    status: "pending" | "claimed" | "expired";
    pointsEarned: number;
    createdAt: string;
    claimedAt: string | null;
  }>;
}

export default function ReferralPointsBadge() {
  const { customer } = useCustomer();

  const { data: referralData } = useQuery<ReferralData>({
    queryKey: [`/api/referrals/customer/${customer?.phoneNumber}`],
    enabled: !!customer?.phoneNumber,
  });

  if (!customer || !referralData) return null;

  const claimedReferrals = referralData.referrals.filter(r => r.status === "claimed");
  const pendingReferrals = referralData.referrals.filter(r => r.status === "pending");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 flex-shrink-0"
          data-testid="button-referral-points"
        >
          <Award className="h-4 w-4 text-primary" />
          <span className="font-bold">{referralData.totalPoints}</span>
          <span className="hidden sm:inline text-muted-foreground">points</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" data-testid="modal-referral-points">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Referral Points
          </DialogTitle>
          <DialogDescription>
            Earn points by sharing deals with friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-3xl font-bold text-primary" data-testid="text-total-points">
                {referralData.totalPoints}
              </p>
            </div>
            <Award className="h-12 w-12 text-primary opacity-50" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Referral Activity</span>
              <span className="text-muted-foreground">
                {claimedReferrals.length + pendingReferrals.length} total
              </span>
            </div>

            {claimedReferrals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    {claimedReferrals.length} Claimed
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    +{claimedReferrals.reduce((sum, r) => sum + r.pointsEarned, 0)} points
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-2">
                  {claimedReferrals.slice(0, 5).map((referral) => (
                    <div
                      key={referral.id}
                      className="bg-muted p-2 rounded text-xs flex justify-between items-center"
                      data-testid={`referral-${referral.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Friend: {referral.friendPhone.slice(-4)}
                        </p>
                        <p className="text-muted-foreground">
                          {referral.claimedAt &&
                            formatDistanceToNow(new Date(referral.claimedAt), {
                              addSuffix: true,
                            })}
                        </p>
                      </div>
                      <Badge variant="default" className="text-xs flex-shrink-0">
                        +{referral.pointsEarned}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingReferrals.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {pendingReferrals.length} Pending
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Waiting for friends to claim
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto space-y-2">
                  {pendingReferrals.slice(0, 3).map((referral) => (
                    <div
                      key={referral.id}
                      className="bg-muted/50 p-2 rounded text-xs flex justify-between items-center"
                      data-testid={`pending-referral-${referral.id}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="truncate">
                          {referral.friendPhone.slice(-4)}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-xs flex-shrink-0">
                        {formatDistanceToNow(new Date(referral.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {referralData.referrals.length === 0 && (
              <div className="text-center py-6">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No referrals yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share deals with friends to start earning points!
                </p>
              </div>
            )}
          </div>

          <div className="bg-accent/50 p-3 rounded-md border border-accent">
            <p className="text-xs font-medium">How it works</p>
            <p className="text-xs text-muted-foreground mt-1">
              Share deals using the <Award className="inline h-3 w-3" /> button on any offer.
              You get 3 points for each offer you share instead of redeem (friend must be local, within 10 miles). Each store has its own point bank - when you reach 10 points at a store, you get a 10% coupon good towards any purchase at that store only. Build up separate banks of points at all your favorite stores!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
