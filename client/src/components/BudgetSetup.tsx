import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, MessageSquare, Users, MousePointerClick, Bell, Zap } from "lucide-react";
import { useState } from "react";

interface BudgetSetupProps {
  onApply: (config: { 
    textBudget: number; 
    ripsBudget: number;
    maxClicks: number;
    clickNotifications: boolean;
    enableRIPS: boolean;
  }) => void;
  isApplying: boolean;
  totalCount: number;
  filteredCount: number;
  hasFilters: boolean;
  compact?: boolean;
  availableTextBudget?: number;
  availableRipsBudget?: number;
  availableBank?: number;
}

export default function BudgetSetup({
  onApply,
  isApplying,
  totalCount,
  filteredCount,
  hasFilters,
  compact = false,
  availableTextBudget = 0,
  availableRipsBudget = 0,
  availableBank = 0,
}: BudgetSetupProps) {
  const [textBudget, setTextBudget] = useState<string>("");
  const [ripsBudget, setRipsBudget] = useState<string>("");
  const [maxClicks, setMaxClicks] = useState<string>("");
  const [clickNotifications, setClickNotifications] = useState(false);
  const [enableRIPS, setEnableRIPS] = useState(false);

  const handleApply = () => {
    onApply({
      textBudget: parseFloat(textBudget) || 0,
      ripsBudget: parseFloat(ripsBudget) || 0,
      maxClicks: parseInt(maxClicks) || 0,
      clickNotifications,
      enableRIPS,
    });
  };

  const hasValues = textBudget !== "" || ripsBudget !== "" || maxClicks !== "";
  const targetCount = hasFilters ? filteredCount : totalCount;

  // Calculate total budget needed per offer
  const textBudgetValue = parseFloat(textBudget) || 0;
  const ripsBudgetValue = parseFloat(ripsBudget) || 0;
  
  // Total budget needed = budget per offer * number of offers
  const totalTextNeeded = textBudgetValue * targetCount;
  const totalRipsNeeded = ripsBudgetValue * targetCount;
  
  // Check if exceeds available budgets
  const exceedsTextBudget = totalTextNeeded > availableTextBudget;
  const exceedsRipsBudget = totalRipsNeeded > availableRipsBudget;
  const exceedsBudget = exceedsTextBudget || exceedsRipsBudget;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          $ Setup
        </CardTitle>
        <CardDescription className="text-xs">
          {hasFilters 
            ? `Set $ for ${targetCount} filtered offer${targetCount !== 1 ? 's' : ''}`
            : `Set $ for all ${targetCount} offer${targetCount !== 1 ? 's' : ''}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Available Budgets Display */}
        <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded">
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground uppercase">Text Acct</div>
            <div className="text-sm font-bold">{Math.round(availableTextBudget).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground uppercase">RIPS Acct</div>
            <div className="text-sm font-bold">${availableRipsBudget.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground uppercase">Bank</div>
            <div className="text-sm font-bold">${Math.round(availableBank).toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Max Clicks */}
          <div className="space-y-1.5">
            <Label htmlFor="max-clicks" className="text-xs flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" />
              Max Clicks
            </Label>
            <Input
              id="max-clicks"
              type="number"
              min="1"
              placeholder="1000"
              value={maxClicks}
              onChange={(e) => setMaxClicks(e.target.value)}
              className="h-8 text-sm w-16"
              data-testid="input-max-clicks"
            />
          </div>

          {/* RIPS */}
          <div className="space-y-1.5">
            <Label htmlFor="rips-budget" className="text-xs flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              RIPS ($)
            </Label>
            <Input
              id="rips-budget"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={ripsBudget}
              onChange={(e) => setRipsBudget(e.target.value)}
              className={`h-8 text-sm w-16 ${exceedsRipsBudget ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              data-testid="input-rips-budget"
            />
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <Label htmlFor="text-budget" className="text-xs flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Text ($)
            </Label>
            <Input
              id="text-budget"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={textBudget}
              onChange={(e) => setTextBudget(e.target.value)}
              className={`h-8 text-sm w-16 ${exceedsTextBudget ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              data-testid="input-text-budget"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 flex flex-col justify-end pb-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="click-notifications"
                checked={clickNotifications}
                onCheckedChange={(checked) => setClickNotifications(checked as boolean)}
                data-testid="checkbox-click-notifications"
              />
              <Label htmlFor="click-notifications" className="text-xs flex items-center gap-1.5 cursor-pointer">
                <Bell className="h-3.5 w-3.5" />
                Click Notifications
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="enable-rips"
                checked={enableRIPS}
                onCheckedChange={(checked) => setEnableRIPS(checked as boolean)}
                data-testid="checkbox-enable-rips"
              />
              <Label htmlFor="enable-rips" className="text-xs flex items-center gap-1.5 cursor-pointer">
                <Zap className="h-3.5 w-3.5" />
                Enable RIPS
              </Label>
            </div>
          </div>
        </div>

        {/* Budget Error Messages */}
        {exceedsBudget && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs space-y-1">
            {exceedsTextBudget && (
              <div className="text-destructive">
                ⚠️ Text $ exceeds available: ${totalTextNeeded.toFixed(0)} needed, ${Math.round(availableTextBudget)} available
              </div>
            )}
            {exceedsRipsBudget && (
              <div className="text-destructive">
                ⚠️ RIPS $ exceeds available: ${totalRipsNeeded.toFixed(0)} needed, ${Math.round(availableRipsBudget)} available
              </div>
            )}
          </div>
        )}

        {/* Apply Button */}
        <Button
          onClick={handleApply}
          disabled={!hasValues || isApplying || targetCount === 0 || exceedsBudget}
          className="w-full h-8 text-xs"
          data-testid="button-apply-budgets"
        >
          {isApplying ? "Adding..." : "Add to"}
        </Button>
      </CardContent>
    </Card>
  );
}
