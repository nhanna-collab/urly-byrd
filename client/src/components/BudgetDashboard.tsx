import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, MessageSquare, Users, Save, MousePointerClick, Bell, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import type { Offer } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BudgetDashboardProps {
  offers: Offer[];
  onSave: (config: Record<string, { 
    textBudget: number; 
    ripsBudget: number;
    maxClicks: number;
    clickNotifications: boolean;
    enableRIPS: boolean;
  }>) => void;
  isSaving: boolean;
}

interface OfferConfig {
  textBudget: string;
  ripsBudget: string;
  maxClicks: string;
  clickNotifications: boolean;
  enableRIPS: boolean;
}

export default function BudgetDashboard({
  offers,
  onSave,
  isSaving,
}: BudgetDashboardProps) {
  const [configs, setConfigs] = useState<Record<string, OfferConfig>>({});

  // Initialize configs from existing offers
  useEffect(() => {
    const initialConfigs: Record<string, OfferConfig> = {};
    offers.forEach(offer => {
      initialConfigs[offer.id] = {
        textBudget: offer.textBudgetDollars?.toString() || "",
        ripsBudget: offer.ripsBudgetDollars?.toString() || "",
        maxClicks: offer.maxClicksAllowed?.toString() || "",
        clickNotifications: offer.notifyAtMaximum || false,
        enableRIPS: offer.getNewCustomersEnabled || false,
      };
    });
    setConfigs(initialConfigs);
  }, [offers]);

  const updateConfig = (offerId: string, field: keyof OfferConfig, value: string | boolean) => {
    setConfigs(prev => ({
      ...prev,
      [offerId]: {
        ...prev[offerId],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    const parsedConfigs: Record<string, { 
      textBudget: number; 
      ripsBudget: number;
      maxClicks: number;
      clickNotifications: boolean;
      enableRIPS: boolean;
    }> = {};
    Object.entries(configs).forEach(([offerId, config]) => {
      parsedConfigs[offerId] = {
        textBudget: parseFloat(config.textBudget) || 0,
        ripsBudget: parseFloat(config.ripsBudget) || 0,
        maxClicks: parseInt(config.maxClicks) || 0,
        clickNotifications: config.clickNotifications,
        enableRIPS: config.enableRIPS,
      };
    });
    onSave(parsedConfigs);
  };

  const hasChanges = Object.keys(configs).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          $ Dashboard
        </CardTitle>
        <CardDescription className="text-xs">
          Allocate $ to each of the {offers.length} offer{offers.length !== 1 ? 's' : ''} in this batch
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {offers.map((offer, index) => (
              <div key={offer.id} className="border rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  #{index + 1} - {offer.title}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* Text Budget */}
                  <div className="space-y-1">
                    <Label htmlFor={`text-${offer.id}`} className="text-xs flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Text ($)
                    </Label>
                    <Input
                      id={`text-${offer.id}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={configs[offer.id]?.textBudget || ""}
                      onChange={(e) => updateConfig(offer.id, 'textBudget', e.target.value)}
                      className="h-7 text-xs"
                      data-testid={`input-text-budget-${index}`}
                    />
                  </div>

                  {/* RIPS Budget */}
                  <div className="space-y-1">
                    <Label htmlFor={`rips-${offer.id}`} className="text-xs flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      RIPS ($)
                    </Label>
                    <Input
                      id={`rips-${offer.id}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={configs[offer.id]?.ripsBudget || ""}
                      onChange={(e) => updateConfig(offer.id, 'ripsBudget', e.target.value)}
                      className="h-7 text-xs"
                      data-testid={`input-rips-budget-${index}`}
                    />
                  </div>

                  {/* Max Clicks */}
                  <div className="space-y-1">
                    <Label htmlFor={`max-clicks-${offer.id}`} className="text-xs flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      Max Clicks
                    </Label>
                    <Input
                      id={`max-clicks-${offer.id}`}
                      type="number"
                      min="1"
                      placeholder="1000"
                      value={configs[offer.id]?.maxClicks || ""}
                      onChange={(e) => updateConfig(offer.id, 'maxClicks', e.target.value)}
                      className="h-7 text-xs"
                      data-testid={`input-max-clicks-${index}`}
                    />
                  </div>
                </div>

                {/* Checkboxes Row */}
                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`notify-${offer.id}`}
                      checked={configs[offer.id]?.clickNotifications || false}
                      onCheckedChange={(checked) => updateConfig(offer.id, 'clickNotifications', checked as boolean)}
                      data-testid={`checkbox-notifications-${index}`}
                    />
                    <Label htmlFor={`notify-${offer.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                      <Bell className="h-3 w-3" />
                      Notifications
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`rips-enabled-${offer.id}`}
                      checked={configs[offer.id]?.enableRIPS || false}
                      onCheckedChange={(checked) => updateConfig(offer.id, 'enableRIPS', checked as boolean)}
                      data-testid={`checkbox-rips-${index}`}
                    />
                    <Label htmlFor={`rips-enabled-${offer.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                      <Zap className="h-3 w-3" />
                      Enable RIPS
                    </Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || offers.length === 0}
          className="w-full mt-4 h-8 text-xs"
          data-testid="button-save-budgets"
        >
          <Save className="h-3.5 w-3.5 mr-2" />
          {isSaving ? "Saving..." : `Save Budgets for ${offers.length} Offer${offers.length !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
}
