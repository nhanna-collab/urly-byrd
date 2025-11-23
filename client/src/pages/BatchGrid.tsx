import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Edit, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Offer, CampaignFolder } from "@shared/schema";

export default function BatchGrid() {
  const [, params] = useRoute("/batch-grid/:folderId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const folderId = params?.folderId;
  const [selectedOfferIds, setSelectedOfferIds] = useState<Set<string>>(new Set());

  // Fetch folder details
  const { data: folder } = useQuery<CampaignFolder>({
    queryKey: ['/api/campaign-folders', folderId],
    enabled: !!folderId,
  });

  // Fetch merchant's offers (including drafts) in this batch folder
  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ['/api/my-offers'],
  });

  const batchOffers = offers.filter(offer => 
    offer.campaignFolder === folderId && offer.batchPendingSelection === true
  );
  
  // Get Section 1 data from first offer (all batch permutations share the same Section 1 data)
  const section1Data = batchOffers[0];

  // Mutation to add selected offers to Offers page
  const addSelectedMutation = useMutation({
    mutationFn: async (offerIds: string[]) => {
      // Update each selected offer to set batchPendingSelection=false
      for (const offerId of offerIds) {
        await apiRequest("PATCH", `/api/offers/${offerId}`, {
          batchPendingSelection: false,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-offers'] });
      toast({
        title: "Success!",
        description: `Added ${selectedOfferIds.size} offer${selectedOfferIds.size !== 1 ? 's' : ''} to Offers page`,
      });
      setLocation('/offers');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add offers",
      });
    },
  });

  const toggleSelection = (offerId: string) => {
    const newSelection = new Set(selectedOfferIds);
    if (newSelection.has(offerId)) {
      newSelection.delete(offerId);
    } else {
      newSelection.add(offerId);
    }
    setSelectedOfferIds(newSelection);
  };

  const selectAll = () => {
    setSelectedOfferIds(new Set(batchOffers.map(o => o.id)));
  };

  const deselectAll = () => {
    setSelectedOfferIds(new Set());
  };

  const handleAddSelected = () => {
    if (selectedOfferIds.size === 0) {
      toast({
        variant: "destructive",
        title: "No Offers Selected",
        description: "Please select at least one offer to add to Offers page",
      });
      return;
    }
    addSelectedMutation.mutate(Array.from(selectedOfferIds));
  };

  const getOfferTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      percentage: "PCT",
      dollar_amount: "DOL",
      bogo: "BOGO",
      spend_threshold: "XY",
      buy_x_get_y: "XYF",
    };
    return labels[type] || type;
  };

  const getAdTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      regular: "Regular",
      countdown: "Countdown",
      countdown_qty: "Countdown QTY",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/offers')}
            className="mb-2"
            data-testid="button-back-to-offers"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offers
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Select Batch Permutations</h1>
              {folder && (
                <p className="text-muted-foreground mt-1">
                  Folder: {folder.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Permutations</p>
              <p className="text-3xl font-bold text-primary">{batchOffers.length}</p>
            </div>
          </div>
          
          {/* Section 1 Quick Setup Summary */}
          {section1Data && (
            <Card className="mt-6 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Section 1 Quick Setup (Applied to All Permutations)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Max Clicks</p>
                    <p className="font-medium">{section1Data.maxClicksAllowed || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Click Budget</p>
                    <p className="font-medium">${section1Data.clickBudgetDollars || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Notifications</p>
                    <div className="flex gap-2 flex-wrap">
                      {section1Data.notifyOnTargetMet && <Badge variant="secondary" className="text-xs">Target</Badge>}
                      {section1Data.notifyAtMaximum && <Badge variant="secondary" className="text-xs">Max</Badge>}
                      {section1Data.notifyOnPoorPerformance && <Badge variant="secondary" className="text-xs">Poor Perf</Badge>}
                      {!section1Data.notifyOnTargetMet && !section1Data.notifyAtMaximum && !section1Data.notifyOnPoorPerformance && <span className="text-muted-foreground">None</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Redemption Type</p>
                    <p className="font-medium capitalize">{section1Data.redemptionType?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Delivery Method</p>
                    <p className="font-medium capitalize">{section1Data.couponDeliveryMethod?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  {section1Data.getNewCustomersEnabled && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Customer Acquisition</p>
                      <Badge variant="default" className="text-xs">Enabled</Badge>
                    </div>
                  )}
                  {section1Data.targetUnits && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Target Units</p>
                      <p className="font-medium">{section1Data.targetUnits}</p>
                    </div>
                  )}
                  {section1Data.videoUrl && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Video URL</p>
                      <a href={section1Data.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate block">
                        View Video
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Selection Controls */}
          <div className="flex items-center justify-between mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">{selectedOfferIds.size}</span> of {batchOffers.length} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  data-testid="button-select-all"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  data-testid="button-deselect-all"
                >
                  Deselect All
                </Button>
              </div>
            </div>
            <Button
              onClick={handleAddSelected}
              disabled={selectedOfferIds.size === 0 || addSelectedMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-add-selected"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {addSelectedMutation.isPending ? "Adding..." : `Add Selected to Offers (${selectedOfferIds.size})`}
            </Button>
          </div>
        </div>

        {/* Grid of Batch Offers */}
        {batchOffers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No permutations found in this batch folder.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {batchOffers.map((offer) => {
              const isSelected = selectedOfferIds.has(offer.id);
              return (
                <Card 
                  key={offer.id} 
                  className={cn(
                    "hover-elevate",
                    isSelected && "ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20"
                  )}
                  data-testid={`card-batch-offer-${offer.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(offer.id)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-offer-${offer.id}`}
                        className="mt-0.5"
                      />
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <CardTitle className="text-sm line-clamp-2">
                          {offer.title}
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          Draft
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                  {/* Offer Type & Ad Type */}
                  <div className="flex gap-2">
                    <Badge variant="default" className="text-xs">
                      {getOfferTypeLabel(offer.offerType)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getAdTypeLabel(offer.addType || "regular")}
                    </Badge>
                  </div>

                  {/* Product/Service */}
                  <div>
                    <p className="text-xs text-muted-foreground">Product/Service</p>
                    <p className="text-sm font-medium line-clamp-1">{offer.menuItem}</p>
                  </div>

                  {/* Redemption Type */}
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Type</p>
                    <p className="text-sm">
                      {offer.redemptionType === "coupon" ? "Regular Coupon" : "Pre-Payment Offer"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/create-offer?edit=${offer.id}`);
                      }}
                      data-testid={`button-edit-${offer.id}`}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete handler would go here
                      }}
                      data-testid={`button-delete-${offer.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
