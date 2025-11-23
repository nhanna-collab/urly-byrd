import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SmsBudgetData {
  allowed: boolean;
  remaining: number;
  monthlyLimit: number;
  currentUsage: number;
  costPerText: number;
  totalCost: number;
  tierName: string;
}

export default function SmsBudgetCard() {
  const { data: budget, isLoading } = useQuery<SmsBudgetData>({
    queryKey: ["/api/sms-budget"],
  });

  if (isLoading || !budget) {
    return (
      <Card data-testid="card-sms-budget">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Text Message Budget
          </CardTitle>
          <CardDescription>Loading budget information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const usagePercentage = budget.monthlyLimit > 0 
    ? (budget.currentUsage / budget.monthlyLimit) * 100 
    : 0;

  const isNearLimit = usagePercentage >= 80 && usagePercentage < 100;
  const isAtLimit = usagePercentage >= 100;

  // Format cost per text
  const formatCost = (cents: number) => {
    if (cents === 0) return "Free";
    if (cents < 1) return `${cents.toFixed(2)}¢`;
    return `${cents.toFixed(1)}¢`;
  };

  // Tier display names
  const tierDisplayNames: Record<string, string> = {
    NEST: "Nest (No SMS)",
    FREEBYRD: "Free Byrd (Pay-per-text)",
    GLIDE: "Glide",
    SOAR: "Soar",
    SOAR_PLUS: "Soar Plus",
    SOAR_PLATINUM: "Soar Platinum",
  };

  return (
    <Card data-testid="card-sms-budget">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Text Message Budget
        </CardTitle>
        <CardDescription>
          {tierDisplayNames[budget.tierName] || budget.tierName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budget.tierName === "NEST" ? (
          <Alert data-testid="alert-nest-upgrade">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Text messaging is not available on your current plan. Upgrade to Free Byrd or higher to send text coupons to customers.
            </AlertDescription>
          </Alert>
        ) : budget.tierName === "FREEBYRD" ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Texts sent this month</span>
                <span className="font-semibold" data-testid="text-usage">{budget.currentUsage}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cost per text</span>
                <span className="font-semibold" data-testid="text-cost-per-text">{formatCost(budget.costPerText)}</span>
              </div>
            </div>
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Pay-as-you-go pricing:</strong>
                <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                  <li>Texts 1-3,000: 2.1¢ each</li>
                  <li>Texts 3,001+: 1.3¢ each</li>
                </ul>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Texts used</span>
                <span className="font-semibold" data-testid="text-usage">
                  {budget.currentUsage} / {budget.monthlyLimit}
                </span>
              </div>
              <Progress 
                value={Math.min(usagePercentage, 100)} 
                className="h-2"
                data-testid="progress-sms-usage"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className={`font-semibold ${
                  isAtLimit ? 'text-destructive' : 
                  isNearLimit ? 'text-yellow-600 dark:text-yellow-500' : 
                  'text-foreground'
                }`} data-testid="text-remaining">
                  {budget.remaining} texts
                </span>
              </div>
            </div>

            {isAtLimit && (
              <Alert variant="destructive" data-testid="alert-budget-exceeded">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've reached your monthly text limit. Customers trying to claim offers will see a message to contact you directly. Upgrade to a higher tier for more texts.
                </AlertDescription>
              </Alert>
            )}

            {isNearLimit && !isAtLimit && (
              <Alert data-testid="alert-budget-warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You're approaching your monthly text limit. Consider upgrading if you need more texts.
                </AlertDescription>
              </Alert>
            )}

            <div className="pt-2 border-t">
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Included texts/month</span>
                  <span className="font-medium">{budget.monthlyLimit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cost per text</span>
                  <span className="font-medium" data-testid="text-cost-per-text">{formatCost(budget.costPerText)}</span>
                </div>
                {budget.remaining === 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Additional texts</span>
                    <span className="font-medium">{formatCost(budget.costPerText)} each</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
