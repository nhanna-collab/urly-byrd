import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, Calculator } from "lucide-react";
import { useState, useEffect } from "react";

interface QuickInputCardProps {
  onApply: (data: {
    maxClicksAllowed: number;
    clickBudgetDollars: number;
    zipCode: string;
    originalPrice: string;
    countdownTimerSeconds?: number;
    countdownQuantityStart?: number;
  }, scope: 'all' | 'filtered', divideEvenly: boolean) => void;
  isApplying?: boolean;
  totalCount: number;
  filteredCount?: number;
  hasFilters?: boolean;
  compact?: boolean;
}

export default function QuickInputCard({ 
  onApply, 
  isApplying = false,
  totalCount,
  filteredCount = 0,
  hasFilters = false,
  compact = false,
}: QuickInputCardProps) {
  // Total Budgets fields
  const [totalMaxClicks, setTotalMaxClicks] = useState<number>(1000);
  const [totalClickBudget, setTotalClickBudget] = useState<number>(100);
  const [zipCode, setZipCode] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [countdownTimer, setCountdownTimer] = useState<number>(30);
  const [countdownQuantity, setCountdownQuantity] = useState<number>(100);
  const [divideEvenlyTotal, setDivideEvenlyTotal] = useState<boolean>(false);

  // Filtered Group Budgets fields
  const [filteredMaxClicks, setFilteredMaxClicks] = useState<number>(0);
  const [filteredClickBudget, setFilteredClickBudget] = useState<number>(0);
  const [divideEvenlyFiltered, setDivideEvenlyFiltered] = useState<boolean>(false);

  // Calculate remaining budgets
  const remainingMaxClicks = totalMaxClicks - filteredMaxClicks;
  const remainingClickBudget = totalClickBudget - filteredClickBudget;

  // Update filtered quantity default when total changes
  useEffect(() => {
    setCountdownQuantity(totalMaxClicks);
  }, [totalMaxClicks]);

  const handleApplyToAll = () => {
    if (!zipCode.trim() || !originalPrice.trim()) {
      return;
    }

    onApply(
      {
        maxClicksAllowed: totalMaxClicks,
        clickBudgetDollars: totalClickBudget,
        zipCode: zipCode.trim(),
        originalPrice: originalPrice.trim(),
        countdownTimerSeconds: countdownTimer,
        countdownQuantityStart: countdownQuantity,
      },
      'all',
      divideEvenlyTotal
    );
  };

  const handleApplyToFiltered = () => {
    if (!zipCode.trim() || !originalPrice.trim()) {
      return;
    }

    onApply(
      {
        maxClicksAllowed: filteredMaxClicks,
        clickBudgetDollars: filteredClickBudget,
        zipCode: zipCode.trim(),
        originalPrice: originalPrice.trim(),
        countdownTimerSeconds: countdownTimer,
        countdownQuantityStart: countdownQuantity,
      },
      'filtered',
      divideEvenlyFiltered
    );
  };

  const isValidForAll = zipCode.trim() && originalPrice.trim() && totalMaxClicks > 0;
  const isValidForFiltered = zipCode.trim() && originalPrice.trim() && filteredMaxClicks > 0 && hasFilters;

  return (
    <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 ${compact ? "min-h-[400px] flex flex-col" : ""}`}>
      <CardHeader className={compact ? "pb-3" : ""}>
        <div className="flex items-center gap-2">
          <Zap className={`text-green-600 dark:text-green-400 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
          <CardTitle className={`text-green-900 dark:text-green-100 ${compact ? "text-base" : ""}`}>Quick Setup</CardTitle>
        </div>
        {!compact && (
          <CardDescription className="text-green-700 dark:text-green-300">
            Set total budgets and apply to all {totalCount} cards below
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={compact ? "space-y-3 flex-1 flex flex-col" : "space-y-6"}>
        {/* Total Budgets Section */}
        <div className={compact ? "space-y-2 flex-1" : "space-y-4"}>
          <div className={`grid gap-${compact ? "2" : "4"} ${compact ? "grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {/* Total Max Clicks */}
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              <Label htmlFor="total-max-clicks" className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
                Max Clicks *
              </Label>
              <Input
                id="total-max-clicks"
                type="number"
                min="1"
                value={totalMaxClicks}
                onChange={(e) => setTotalMaxClicks(Number(e.target.value) || 0)}
                placeholder="1000"
                className={compact ? "h-7 text-xs" : ""}
                data-testid="quick-input-total-max-clicks"
              />
            </div>

            {/* Total Click Budget */}
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              <Label htmlFor="total-click-budget" className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
                Budget ($) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="total-click-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  className={compact ? "pl-7 h-7 text-xs" : "pl-7"}
                  value={totalClickBudget}
                  onChange={(e) => setTotalClickBudget(Number(e.target.value) || 0)}
                  placeholder="100.00"
                  data-testid="quick-input-total-click-budget"
                />
              </div>
            </div>

            {/* ZIP Code */}
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              <Label htmlFor="quick-zip-code" className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
                ZIP *
              </Label>
              <Input
                id="quick-zip-code"
                type="text"
                maxLength={10}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="12345"
                className={compact ? "h-7 text-xs" : ""}
                data-testid="quick-input-zip-code"
              />
            </div>
          </div>

          <div className={`grid gap-${compact ? "2" : "4"} ${compact ? "grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {/* Original Price */}
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              <Label htmlFor="quick-original-price" className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
                Price *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="quick-original-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className={compact ? "pl-7 h-7 text-xs" : "pl-7"}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="0.00"
                  data-testid="quick-input-original-price"
                />
              </div>
            </div>

            {/* Countdown Timer */}
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              <Label htmlFor="countdown-timer" className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
                {compact ? "Timer (s)" : "Countdown Timer (seconds)"}
              </Label>
              <Input
                id="countdown-timer"
                type="number"
                min="10"
                value={countdownTimer}
                onChange={(e) => setCountdownTimer(Number(e.target.value) || 30)}
                placeholder="30"
                className={compact ? "h-7 text-xs" : ""}
                data-testid="quick-input-countdown-timer"
              />
            </div>

            {/* Countdown Quantity */}
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              <Label htmlFor="countdown-quantity" className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
                {compact ? "Qty" : "Countdown Quantity"}
              </Label>
              <Input
                id="countdown-quantity"
                type="number"
                min="1"
                value={countdownQuantity}
                onChange={(e) => setCountdownQuantity(Number(e.target.value) || 100)}
                placeholder="100"
                className={compact ? "h-7 text-xs" : ""}
                data-testid="quick-input-countdown-quantity"
              />
            </div>
          </div>

          {/* Divide Evenly Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="divide-evenly-total"
              checked={divideEvenlyTotal}
              onCheckedChange={(checked) => setDivideEvenlyTotal(checked as boolean)}
              data-testid="checkbox-divide-evenly-total"
            />
            <Label htmlFor="divide-evenly-total" className={`font-medium cursor-pointer ${compact ? "text-xs" : "text-sm"}`}>
              Divide evenly {compact ? "" : `across all ${totalCount} cards`}
            </Label>
          </div>

          {/* Apply to All Button */}
          <Button
            onClick={handleApplyToAll}
            disabled={!isValidForAll || isApplying}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            size={compact ? "default" : "lg"}
            data-testid="button-apply-to-all"
          >
            <Zap className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
            {isApplying ? "Applying..." : (compact ? `Apply (${totalCount})` : `Apply to All ${totalCount} Cards`)}
          </Button>
        </div>

        {/* Filtered Group Budgets Section (conditional) */}
        {hasFilters && filteredCount > 0 && (
          <div className={`${compact ? "space-y-2 pt-3 border-t" : "space-y-4 pt-6 border-t-2"} border-green-300 dark:border-green-700`}>
            <div className="flex items-center gap-2">
              <Calculator className={`text-amber-600 dark:text-amber-400 ${compact ? "h-4 w-4" : "h-5 w-5"}`} />
              <h3 className={`font-semibold text-amber-900 dark:text-amber-100 ${compact ? "text-sm" : "text-lg"}`}>
                {compact ? "Filtered" : "Filtered Group Budgets"}
              </h3>
            </div>
            {!compact && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Allocate budgets specifically for the {filteredCount} filtered cards
              </p>
            )}

            <div className={`grid gap-${compact ? "2" : "4"} ${compact ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
              {/* Filtered Max Clicks */}
              <div className={compact ? "space-y-0.5" : "space-y-1"}>
                <Label htmlFor="filtered-max-clicks" className={compact ? "text-[10px] font-medium" : "text-sm font-medium"}>
                  {compact ? "Clicks" : "Filtered Max Clicks"}
                </Label>
                <Input
                  id="filtered-max-clicks"
                  type="number"
                  min="0"
                  max={totalMaxClicks}
                  value={filteredMaxClicks}
                  onChange={(e) => setFilteredMaxClicks(Math.min(Number(e.target.value) || 0, totalMaxClicks))}
                  placeholder="0"
                  className={compact ? "h-7 text-xs" : ""}
                  data-testid="quick-input-filtered-max-clicks"
                />
                <p className="text-xs text-muted-foreground">
                  Remaining: {remainingMaxClicks} clicks
                </p>
              </div>

              {/* Filtered Click Budget */}
              <div className={compact ? "space-y-0.5" : "space-y-1"}>
                <Label htmlFor="filtered-click-budget" className={compact ? "text-[10px] font-medium" : "text-sm font-medium"}>
                  {compact ? "Budget ($)" : "Filtered Budget (Dollars)"}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="filtered-click-budget"
                    type="number"
                    min="0"
                    max={totalClickBudget}
                    step="0.01"
                    className={compact ? "pl-7 h-7 text-xs" : "pl-7"}
                    value={filteredClickBudget}
                    onChange={(e) => setFilteredClickBudget(Math.min(Number(e.target.value) || 0, totalClickBudget))}
                    placeholder="0.00"
                    data-testid="quick-input-filtered-click-budget"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Remaining: ${remainingClickBudget.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Divide Evenly Checkbox for Filtered */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="divide-evenly-filtered"
                checked={divideEvenlyFiltered}
                onCheckedChange={(checked) => setDivideEvenlyFiltered(checked as boolean)}
                data-testid="checkbox-divide-evenly-filtered"
              />
              <Label htmlFor="divide-evenly-filtered" className={`font-medium cursor-pointer ${compact ? "text-xs" : "text-sm"}`}>
                Divide evenly {compact ? "" : `across ${filteredCount} filtered cards`}
              </Label>
            </div>

            {/* Apply to Filtered Button */}
            <Button
              onClick={handleApplyToFiltered}
              disabled={!isValidForFiltered || isApplying}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              size={compact ? "default" : "lg"}
              data-testid="button-apply-to-filtered"
            >
              <Calculator className={`mr-2 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
              {isApplying ? "Applying..." : (compact ? `Apply Filtered (${filteredCount})` : `Apply to Filtered ${filteredCount} Cards`)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
