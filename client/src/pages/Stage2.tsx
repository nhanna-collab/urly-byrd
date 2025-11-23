import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Folder, Clock, Trash2, Filter, GitBranch, Copy, Lock, Search, Rocket, Flame, Microscope, Calendar, CheckCircle, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo, useEffect, useRef } from "react";
import OffersToolbar from "@/components/OffersToolbar";
import QuickInputCard from "@/components/QuickInputCard";
import BudgetDashboard from "@/components/BudgetDashboard";
import type { CampaignFolder, Offer } from "@shared/schema";
import { useLocation } from "wouter";
import CountdownTimer from "@/components/CountdownTimer";
import { useOffersData } from "@/hooks/useOffersData";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";

type SortKey = "maxClicks" | "date" | "duration" | "bank" | "textBudget" | "ripsBudget" | "ctr" | "viewed";
type SortDirection = "asc" | "desc";
type ViewMode = "folder1" | "folder2" | "drafts" | "active" | "expired" | "future" | "archived";

interface FolderWithMetrics extends CampaignFolder {
  totalViews: number;
  totalClicks: number;
  totalMaxClicks: number;
  ctr: number;
  totalBudget: number;
  avgDuration: number;
  shortestTimeRemaining: number;
  primaryMenuItem: string;
  offersCount: number;
}

function generateOfferCode(offer: Offer): string {
  // TYPE codes mapping
  const typeCodeMap: Record<string, string> = {
    'percentage': 'PCT',
    'dollar_amount': 'DOL',
    'bogo': 'BOGO',
    'spend_threshold': 'XY',
    'buy_x_get_y': 'XYF'
  };
  
  // AD TYPE codes mapping
  const adTypeCodeMap: Record<string, string> = {
    'regular': 'REG',
    'countdown': 'CT',
    'countdown_qty': 'CQ'
  };
  
  // REDEMPTION codes mapping
  const redemptionCodeMap: Record<string, string> = {
    'prepayment_offer': 'PPO',
    'regular_coupon': 'RC'
  };
  
  // Get codes
  const typeCode = typeCodeMap[offer.offerType] || 'PCT';
  const adTypeCode = adTypeCodeMap[offer.addType] || 'REG';
  const redemptionCode = redemptionCodeMap[offer.redemptionType] || 'RC';
  const deliveryCode = '1';
  
  // Format date as MM_D_YYYY
  const createdDate = offer.createdAt ? new Date(offer.createdAt) : new Date();
  const month = createdDate.getMonth() + 1;
  const day = createdDate.getDate();
  const year = createdDate.getFullYear();
  const dateCode = `${month}_${day}_${year}`;
  
  return `${typeCode}-${adTypeCode}-${redemptionCode}-${deliveryCode}-${dateCode}`;
}

function calculateFolderMetrics(folder: CampaignFolder, folderOffers: Offer[]): FolderWithMetrics {
  const totalViews = folderOffers.reduce((sum, offer) => sum + parseInt(offer.views || "0"), 0);
  const totalClicks = folderOffers.reduce((sum, offer) => sum + (offer.unitsSold || 0), 0);
  const totalMaxClicks = folderOffers.reduce((sum, offer) => sum + (offer.maxClicksAllowed || 0), 0);
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const totalBudget = folderOffers.reduce((sum, offer) => sum + (offer.clickBudgetDollars || 0), 0);
  
  const now = Date.now();
  const durations = folderOffers
    .filter(offer => offer.endDate != null)
    .map(offer => {
      const endTime = new Date(offer.endDate!).getTime();
      return Math.max(0, endTime - now);
    });
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const shortestTimeRemaining = durations.length > 0 ? Math.min(...durations) : Number.MAX_SAFE_INTEGER;
  
  // Extract base product name from first offer's menuItem
  const primaryMenuItem = folderOffers.length > 0 ? folderOffers[0].menuItem || "" : "";

  return {
    ...folder,
    totalViews,
    totalClicks,
    totalMaxClicks,
    ctr,
    totalBudget,
    avgDuration,
    shortestTimeRemaining,
    primaryMenuItem,
    offersCount: folderOffers.length
  };
}

interface FolderListProps {
  folders: FolderWithMetrics[];
  offersByFolder: Record<string, Offer[]>;
  offersWithoutFolder: Offer[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  searchQuery: string;
  onDeleteFolder: (folder: FolderWithMetrics) => void;
  onNavigate: (path: string) => void;
  viewMode: ViewMode;
  onResurrectOffer?: (offerId: string) => void;
  onPermanentDeleteOffer?: (offerId: string) => void;
  onReintegrateOffer?: (offerId: string) => void;
  onDuplicateOffer?: (offerId: string) => void;
  onCompleteDraft?: (offer: Offer) => void;
  onDeleteDraft?: (offerId: string) => void;
}

function FolderList({
  folders,
  offersByFolder,
  offersWithoutFolder,
  sortKey,
  sortDirection,
  searchQuery,
  onDeleteFolder,
  onNavigate,
  viewMode,
  onResurrectOffer,
  onPermanentDeleteOffer,
  onReintegrateOffer,
  onDuplicateOffer,
  onCompleteDraft,
  onDeleteDraft,
}: FolderListProps) {
  const sortedFolders = useMemo(() => {
    // Use the precomputed folder metrics passed from parent
    const filteredFolders = searchQuery.trim() === "" 
      ? folders 
      : folders.filter(folder => {
          const query = searchQuery.toLowerCase();
          const folderName = folder.name.toLowerCase();
          const folderOffers = offersByFolder[folder.id] || [];
          const offerTitles = folderOffers.map(o => o.title.toLowerCase()).join(" ");
          const offerDescriptions = folderOffers.map(o => (o.description || "").toLowerCase()).join(" ");
          
          return folderName.includes(query) || 
                 offerTitles.includes(query) || 
                 offerDescriptions.includes(query);
        });

    return filteredFolders.sort((a, b) => {
      if (a.offersCount === 0 && b.offersCount > 0) return 1;
      if (a.offersCount > 0 && b.offersCount === 0) return -1;
      
      let comparison = 0;
      
      switch (sortKey) {
        case "date":
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
        case "maxClicks":
          comparison = a.totalMaxClicks - b.totalMaxClicks;
          break;
        case "budget":
          comparison = a.totalBudget - b.totalBudget;
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [folders, offersByFolder, sortKey, sortDirection, searchQuery]);

  // Check if this view is completely empty
  const isEmpty = sortedFolders.length === 0 && offersWithoutFolder.length === 0;

  return (
    <div className="space-y-4">
      {isEmpty ? (
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6 text-center py-12">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Offers in This Category</h3>
            <p className="text-muted-foreground">
              There are currently no offers in this status
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
      {sortedFolders.map((folder) => {
        const folderOffers = offersByFolder[folder.id] || [];
        return (
          <Card key={folder.id} data-testid={`folder-${folder.id}`} className="bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Folder className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        TEMPLATE
                      </Badge>
                      {folder.name}
                    </CardTitle>
                    {folder.primaryMenuItem && (
                      <div className="text-sm font-medium text-foreground mt-1">
                        {folder.primaryMenuItem}
                      </div>
                    )}
                    <CardDescription>
                      {folder.offersCount} {folder.offersCount === 1 ? 'offer' : 'offers'}
                      {viewMode !== 'drafts' && (
                        <>
                          {' • '}
                          CTR: {folder.ctr.toFixed(2)}% • 
                          Views: {folder.totalViews}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteFolder(folder)}
                    data-testid={`button-delete-${folder.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 pl-4">
                  {folderOffers.length > 1 && (
                    <div 
                      className="absolute left-0 w-1 bg-gradient-to-b from-primary/50 via-primary/70 to-primary/50 rounded-full"
                      style={{
                        top: '2rem',
                        bottom: '2rem',
                        zIndex: 0
                      }}
                    />
                  )}
                  {folderOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="rounded-md border bg-card hover-elevate cursor-pointer transition-shadow hover:shadow-lg relative"
                      style={{ zIndex: 1 }}
                      onClick={viewMode === "archived" ? undefined : () => onNavigate("/dashboard")}
                      data-testid={`offer-${offer.id}`}
                    >
                      <div className="p-4 border-b bg-muted/30">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-lg" data-testid={`text-item-${offer.id}`}>
                              {offer.title}
                            </h4>
                            <p className="text-sm text-muted-foreground" data-testid={`text-description-${offer.id}`}>
                              {offer.description}
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-lg font-bold px-3 py-1" data-testid={`badge-discount-${offer.id}`}>
                            {offer.discount}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {offer.imageUrl && (
                            <img
                              src={offer.imageUrl}
                              alt={offer.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                        </div>
                        {viewMode === "archived" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onResurrectOffer?.(offer.id);
                              }}
                              data-testid={`button-resurrect-${offer.id}`}
                            >
                              Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Permanently archive this offer? This cannot be undone.')) {
                                  onPermanentDeleteOffer?.(offer.id);
                                }
                              }}
                              data-testid={`button-permanent-delete-${offer.id}`}
                            >
                              Permanently Archive
                            </Button>
                          </div>
                        ) : offer.needsReintegration ? (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReintegrateOffer?.(offer.id);
                            }}
                            data-testid={`button-reintegrate-${offer.id}`}
                          >
                            Reintegrate
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateOffer?.(offer.id);
                              }}
                              data-testid={`button-duplicate-${offer.id}`}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Duplicate
                            </Button>
                            {offer.endDate && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <CountdownTimer endDate={new Date(offer.endDate)} size="sm" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {viewMode === "drafts" && (
                        <div className="p-3 border-t bg-muted/10">
                          <div className="mb-3 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Created: {offer.createdAt ? format(new Date(offer.createdAt), 'MMM d, yyyy h:mm a') : 'Unknown'}</span>
                            </div>
                            {offer.startDate && (
                              <div className="flex items-center gap-2 text-xs text-foreground font-medium ml-5">
                                <Rocket className="h-3 w-3" />
                                <span>Scheduled: {format(new Date(offer.startDate), 'MMM d, yyyy h:mm a')}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs" data-testid={`badge-type-${offer.id}`}>
                                {offer.offerType === 'percentage' && 'PCT'}
                                {offer.offerType === 'dollar_amount' && 'DOL'}
                                {offer.offerType === 'bogo' && 'BOGO'}
                                {offer.offerType === 'spend_threshold' && 'XY'}
                                {offer.offerType === 'buy_x_get_y' && 'XYF'}
                              </Badge>
                              {offer.couponDeliveryMethod && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-redemption-${offer.id}`}>
                                  {offer.couponDeliveryMethod === 'must_pay_or_text_alerts' && 'Pay/Text'}
                                  {offer.couponDeliveryMethod === 'coupon_codes' && 'Coupon'}
                                  {offer.couponDeliveryMethod === 'mobile_app_based_coupons' && 'Icon Link'}
                                  {offer.couponDeliveryMethod === 'mms_based_coupons' && 'MMS'}
                                  {offer.couponDeliveryMethod === 'mobile_wallet_passes' && 'Wallet'}
                                </Badge>
                              )}
                              {offer.menuItem && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-menu-${offer.id}`}>
                                  {offer.menuItem}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Max Clicks:</span>
                                <span className="text-xs font-semibold" data-testid={`text-max-clicks-${offer.id}`}>
                                  {offer.maxClicksAllowed || 'Unlimited'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Budget:</span>
                                <span className="text-xs font-semibold" data-testid={`text-budget-${offer.id}`}>
                                  ${offer.clickBudgetDollars || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCompleteDraft?.(offer);
                              }}
                              data-testid={`button-complete-${offer.id}`}
                              className="w-full"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Archive this draft template?')) {
                                  onDeleteDraft?.(offer.id);
                                }
                              }}
                              data-testid={`button-delete-draft-${offer.id}`}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Archive
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
        );
      })}
        </>
      )}
    </div>
  );
}

interface ParentsViewProps {
  folders: FolderWithMetrics[];
  offers: Offer[];
  onNavigate: (path: string) => void;
  onDeleteFolder: (folder: FolderWithMetrics) => void;
  onCreateFolder: () => void;
  searchQuery: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onSearchChange: (query: string) => void;
  onDuplicateOffer?: (offerId: string) => void;
}

function ParentsView({
  folders,
  offers,
  onNavigate,
  onDeleteFolder,
  onCreateFolder,
  searchQuery,
  sortKey,
  sortDirection,
  onSort,
  onSearchChange,
  onDuplicateOffer,
}: ParentsViewProps) {
  const [selectedOfferTypes, setSelectedOfferTypes] = useState<string[]>([]);
  const [selectedRedemptionTypes, setSelectedRedemptionTypes] = useState<string[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);

  // Extract unique values from offers
  const uniqueOfferTypes = useMemo(() => {
    const types = new Set<string>();
    offers.forEach(offer => {
      if (offer.offerType) types.add(offer.offerType);
    });
    // Maintain specific order: PCT, DOL, BOGO, XY
    const order = ['percentage', 'dollar_amount', 'bogo', 'spend_threshold'];
    return order.filter(type => types.has(type));
  }, [offers]);

  const uniqueRedemptionTypes = useMemo(() => {
    const types = new Set<string>();
    offers.forEach(offer => {
      // Map redemption types to filter options
      if (offer.redemptionType === 'prepayment_offer' || offer.couponDeliveryMethod === 'text_message_alerts') {
        types.add('must_pay_or_text_alerts');
      }
      if (offer.couponDeliveryMethod === 'coupon_codes') {
        types.add('coupon_codes');
      }
      if (offer.couponDeliveryMethod === 'mobile_app_based_coupons') {
        types.add('mobile_app_based_coupons');
      }
      if (offer.couponDeliveryMethod === 'mms_based_coupons') {
        types.add('mms_based_coupons');
      }
      if (offer.couponDeliveryMethod === 'mobile_wallet_passes') {
        types.add('mobile_wallet_passes');
      }
    });
    // Maintain specific order
    const order = ['must_pay_or_text_alerts', 'coupon_codes', 'mobile_app_based_coupons', 'mms_based_coupons', 'mobile_wallet_passes'];
    return order.filter(type => types.has(type));
  }, [offers]);

  const uniqueMenuItems = useMemo(() => {
    const items = new Set<string>();
    offers.forEach(offer => {
      if (offer.menuItem) items.add(offer.menuItem);
    });
    return Array.from(items).sort();
  }, [offers]);

  // Filter offers based on selected attributes
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      if (selectedOfferTypes.length > 0 && !selectedOfferTypes.includes(offer.offerType || '')) {
        return false;
      }
      if (selectedRedemptionTypes.length > 0) {
        // Check if offer matches any selected redemption type
        const offerRedemptionTypes: string[] = [];
        // For batch offers, use redemptionType; for regular offers, use couponDeliveryMethod
        if (offer.redemptionType === 'prepayment_offer') {
          offerRedemptionTypes.push('mobile_wallet_passes'); // PPO maps to mobile_wallet_passes filter
        } else if (offer.redemptionType === 'regular' || !offer.redemptionType) {
          offerRedemptionTypes.push('coupon_codes'); // PAR maps to coupon_codes filter
        }
        if (offer.couponDeliveryMethod === 'text_message_alerts') {
          offerRedemptionTypes.push('must_pay_or_text_alerts');
        }
        if (offer.couponDeliveryMethod === 'coupon_codes') {
          offerRedemptionTypes.push('coupon_codes');
        }
        if (offer.couponDeliveryMethod === 'mobile_app_based_coupons') {
          offerRedemptionTypes.push('mobile_app_based_coupons');
        }
        if (offer.couponDeliveryMethod === 'mms_based_coupons') {
          offerRedemptionTypes.push('mms_based_coupons');
        }
        if (offer.couponDeliveryMethod === 'mobile_wallet_passes') {
          offerRedemptionTypes.push('mobile_wallet_passes');
        }
        if (!selectedRedemptionTypes.some(type => offerRedemptionTypes.includes(type))) {
          return false;
        }
      }
      if (selectedMenuItems.length > 0 && !selectedMenuItems.includes(offer.menuItem || '')) {
        return false;
      }
      return true;
    });
  }, [offers, selectedOfferTypes, selectedRedemptionTypes, selectedMenuItems]);

  // Group filtered offers by folder name (FolderList expects folder.name as key)
  const offersByFolder = useMemo(() => {
    const grouped: Record<string, Offer[]> = {};
    filteredOffers.forEach(offer => {
      if (offer.campaignFolder) {
        if (!grouped[offer.campaignFolder]) {
          grouped[offer.campaignFolder] = [];
        }
        grouped[offer.campaignFolder].push(offer);
      }
    });
    return grouped;
  }, [filteredOffers]);

  const filteredFolders = useMemo(() => {
    return folders
      .filter(folder => offersByFolder[folder.id]?.length > 0);
  }, [folders, offersByFolder]);

  const hasActiveFilters = selectedOfferTypes.length > 0 || selectedRedemptionTypes.length > 0 || selectedMenuItems.length > 0;

  const toggleFilter = (type: 'offerType' | 'redemptionType' | 'menuItem', value: string) => {
    const setters = {
      offerType: setSelectedOfferTypes,
      redemptionType: setSelectedRedemptionTypes,
      menuItem: setSelectedMenuItems
    };
    const currentValues = {
      offerType: selectedOfferTypes,
      redemptionType: selectedRedemptionTypes,
      menuItem: selectedMenuItems
    };

    const setter = setters[type];
    const current = currentValues[type];

    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Filter options reflect only the properties contained within the set of created offers.
      </p>
      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-bold">
                <GitBranch className="h-5 w-5" />
                Offer Type
              </div>
              {uniqueRedemptionTypes.length > 0 && (
                <div className="text-sm font-bold">
                  Redemption Type
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {uniqueOfferTypes.length > 0 && (
              <div>
                <div className="space-y-2">
                  {[
                    { value: 'percentage', label: 'PCT' },
                    { value: 'dollar_amount', label: 'DOL' },
                    { value: 'bogo', label: 'BOGO' },
                    { value: 'spend_threshold', label: 'XY' }
                  ].filter(type => uniqueOfferTypes.includes(type.value)).map(type => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer" data-testid={`filter-offertype-${type.value}`}>
                      <input
                        type="checkbox"
                        checked={selectedOfferTypes.includes(type.value)}
                        onChange={() => toggleFilter('offerType', type.value)}
                        className="rounded-sm w-4 h-4"
                      />
                      <span className="text-xs">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {uniqueRedemptionTypes.length > 0 && (
              <div>
                <div className="space-y-2">
                  {[
                    { value: 'must_pay_or_text_alerts', label: 'Pre-payment offer or Text message alerts' },
                    { value: 'coupon_codes', label: 'Coupon codes' },
                    { value: 'mobile_app_based_coupons', label: 'Icon link-based coupons' },
                    { value: 'mms_based_coupons', label: 'MMS-based coupons' },
                    { value: 'mobile_wallet_passes', label: 'Mobile wallet passes' }
                  ].filter(type => uniqueRedemptionTypes.includes(type.value)).map(type => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer" data-testid={`filter-redemptiontype-${type.value}`}>
                      <input
                        type="checkbox"
                        checked={selectedRedemptionTypes.includes(type.value)}
                        onChange={() => toggleFilter('redemptionType', type.value)}
                        className="rounded"
                      />
                      <span className="text-xs">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {uniqueMenuItems.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Menu Item</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uniqueMenuItems.map(item => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer" data-testid={`filter-menuitem-${item}`}>
                      <input
                        type="checkbox"
                        checked={selectedMenuItems.includes(item)}
                        onChange={() => toggleFilter('menuItem', item)}
                        className="rounded"
                      />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} match your filters
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOfferTypes([]);
                    setSelectedRedemptionTypes([]);
                    setSelectedMenuItems([]);
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {hasActiveFilters && (
        <>
          <OffersToolbar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
            folderCount={filteredFolders.length}
            onCreateFolder={onCreateFolder}
          />

          <FolderList
            folders={filteredFolders}
            offersByFolder={offersByFolder}
            offersWithoutFolder={[]}
            onNavigate={onNavigate}
            onDeleteFolder={onDeleteFolder}
            searchQuery={searchQuery}
            sortKey={sortKey}
            sortDirection={sortDirection}
            viewMode="active"
            onDuplicateOffer={onDuplicateOffer}
          />
        </>
      )}

      {!hasActiveFilters && (
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6 text-center py-12">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Filters Selected</h3>
            <p className="text-muted-foreground">
              Select one or more attributes above to find matching folders
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Offers() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ViewMode>("folder1");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedOfferTypes, setSelectedOfferTypes] = useState<string[]>([]);
  const [selectedRedemptionTypes, setSelectedRedemptionTypes] = useState<string[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]); // Folder names to filter by
  const [viewScope, setViewScope] = useState<"all" | "folders" | "offers">("all"); // For Drafts view only
  const [featureFilter, setFeatureFilter] = useState<"" | "dynamic" | "countdownTimer" | "countdownQty" | "ctcq" | "media">("");
  const [titleFilter, setTitleFilter] = useState<string>("");
  const [isApplyingQuickInputs, setIsApplyingQuickInputs] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query to prevent expensive calculations on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: campaignFolders = [], refetch: refetchFolders} = useQuery<CampaignFolder[]>({
    queryKey: ["/api/campaign-folders"],
    enabled: !!user,
  });

  const { data: offers = [], refetch: refetchOffers } = useQuery<Offer[]>({
    queryKey: ["/api/my-offers"],
    enabled: !!user,
  });

  const categorizedData = useOffersData(campaignFolders, offers);

  // Create folder ID to name map
  const foldersById = useMemo(() => {
    const map = new Map<string, string>();
    campaignFolders.forEach(folder => {
      map.set(folder.id, folder.name);
    });
    return map;
  }, [campaignFolders]);

  // Get current view's offers for filtering
  const currentViewOffers = useMemo(() => {
    switch (activeView) {
      case "folder1":
        // Batch Grid view shows batch offers pending selection
        return Object.values(categorizedData.batchOffersByFolder).flat();
      case "active":
        return [...Object.values(categorizedData.currentOffersByFolder).flat(), ...categorizedData.currentOffersWithoutFolder];
      case "expired":
        return [...Object.values(categorizedData.expiredOffersByFolder).flat(), ...categorizedData.expiredOffersWithoutFolder];
      case "drafts":
        return [...Object.values(categorizedData.draftOffersByFolder).flat(), ...categorizedData.draftOffersWithoutFolder];
      case "future":
        return [...Object.values(categorizedData.futureOffersByFolder).flat(), ...categorizedData.futureOffersWithoutFolder];
      case "archived":
        return [...Object.values(categorizedData.deletedOffersByFolder).flat(), ...categorizedData.deletedOffersWithoutFolder];
      default:
        return [];
    }
  }, [activeView, categorizedData]);

  // Extract unique values from current view's offers
  const uniqueOfferTypes = useMemo(() => {
    const types = new Set<string>();
    currentViewOffers.forEach(offer => {
      if (offer.offerType) types.add(offer.offerType);
    });
    // Maintain specific order: PCT, DOL, BOGO, XY
    const order = ['percentage', 'dollar_amount', 'bogo', 'spend_threshold'];
    return order.filter(type => types.has(type));
  }, [currentViewOffers]);

  const uniqueRedemptionTypes = useMemo(() => {
    const types = new Set<string>();
    currentViewOffers.forEach(offer => {
      // Map redemption types to filter options
      if (offer.redemptionType === 'prepayment_offer' || offer.couponDeliveryMethod === 'text_message_alerts') {
        types.add('must_pay_or_text_alerts');
      }
      if (offer.couponDeliveryMethod === 'coupon_codes') {
        types.add('coupon_codes');
      }
      if (offer.couponDeliveryMethod === 'mobile_app_based_coupons') {
        types.add('mobile_app_based_coupons');
      }
      if (offer.couponDeliveryMethod === 'mms_based_coupons') {
        types.add('mms_based_coupons');
      }
      if (offer.couponDeliveryMethod === 'mobile_wallet_passes') {
        types.add('mobile_wallet_passes');
      }
    });
    // Maintain specific order
    const order = ['must_pay_or_text_alerts', 'coupon_codes', 'mobile_app_based_coupons', 'mms_based_coupons', 'mobile_wallet_passes'];
    return order.filter(type => types.has(type));
  }, [currentViewOffers]);

  const uniqueMenuItems = useMemo(() => {
    const items = new Set<string>();
    currentViewOffers.forEach(offer => {
      if (offer.menuItem) items.add(offer.menuItem);
    });
    return Array.from(items).sort();
  }, [currentViewOffers]);

  // Filter offers based on selected attributes
  const filteredOffers = useMemo(() => {
    return currentViewOffers.filter(offer => {
      // Title filter (case-insensitive substring match)
      if (titleFilter.trim()) {
        if (!offer.title?.toLowerCase().includes(titleFilter.toLowerCase().trim())) {
          return false;
        }
      }
      if (selectedOfferTypes.length > 0 && !selectedOfferTypes.includes(offer.offerType || '')) {
        return false;
      }
      if (selectedRedemptionTypes.length > 0) {
        // Check if offer matches any selected redemption type
        const offerRedemptionTypes: string[] = [];
        // For batch offers, use redemptionType; for regular offers, use couponDeliveryMethod
        if (offer.redemptionType === 'prepayment_offer') {
          offerRedemptionTypes.push('mobile_wallet_passes'); // PPO maps to mobile_wallet_passes filter
        } else if (offer.redemptionType === 'regular' || !offer.redemptionType) {
          offerRedemptionTypes.push('coupon_codes'); // PAR maps to coupon_codes filter
        }
        if (offer.couponDeliveryMethod === 'text_message_alerts') {
          offerRedemptionTypes.push('must_pay_or_text_alerts');
        }
        if (offer.couponDeliveryMethod === 'coupon_codes') {
          offerRedemptionTypes.push('coupon_codes');
        }
        if (offer.couponDeliveryMethod === 'mobile_app_based_coupons') {
          offerRedemptionTypes.push('mobile_app_based_coupons');
        }
        if (offer.couponDeliveryMethod === 'mms_based_coupons') {
          offerRedemptionTypes.push('mms_based_coupons');
        }
        if (offer.couponDeliveryMethod === 'mobile_wallet_passes') {
          offerRedemptionTypes.push('mobile_wallet_passes');
        }
        if (!selectedRedemptionTypes.some(type => offerRedemptionTypes.includes(type))) {
          return false;
        }
      }
      if (selectedMenuItems.length > 0 && !selectedMenuItems.includes(offer.menuItem || '')) {
        return false;
      }
      // Filter by selected folders (convert ID to name for comparison)
      if (selectedFolders.length > 0) {
        const folderName = offer.campaignFolder ? foldersById.get(offer.campaignFolder) : null;
        if (!folderName || !selectedFolders.includes(folderName)) {
          return false;
        }
      }
      // Filter by feature type
      if (featureFilter !== "") {
        if (featureFilter === "countdownTimer") {
          // Countdown Timer: addType is "timer"
          if (offer.addType !== "timer") return false;
        } else if (featureFilter === "countdownQty") {
          // Countdown QTY: addType is "quantity"
          if (offer.addType !== "quantity") return false;
        } else if (featureFilter === "ctcq") {
          // Both countdown timer AND quantity: addType is "both"
          if (offer.addType !== "both") return false;
        } else if (featureFilter === "dynamic") {
          // Dynamic Advanced: has autoExtend or maxClicksAllowed or advanced settings
          const hasDynamic = offer.autoExtend || (offer.maxClicksAllowed && offer.maxClicksAllowed > 0);
          if (!hasDynamic) return false;
        } else if (featureFilter === "media") {
          // Media: has imageUrl or videoUrl
          const hasMedia = offer.imageUrl || offer.videoUrl;
          if (!hasMedia) return false;
        }
      }
      return true;
    });
  }, [currentViewOffers, selectedOfferTypes, selectedRedemptionTypes, selectedMenuItems, selectedFolders, foldersById, featureFilter, titleFilter]);

  const hasActiveFilters = Boolean(titleFilter.trim()) || selectedOfferTypes.length > 0 || selectedRedemptionTypes.length > 0 || selectedMenuItems.length > 0 || selectedFolders.length > 0 || featureFilter !== "";

  // Compute filtered folder count
  const filteredFolderCount = useMemo(() => {
    if (!hasActiveFilters) {
      switch (activeView) {
        case "active":
          return categorizedData.currentFolders.length + (categorizedData.currentOffersWithoutFolder.length > 0 ? 1 : 0);
        case "expired":
          return categorizedData.expiredFolders.length + (categorizedData.expiredOffersWithoutFolder.length > 0 ? 1 : 0);
        case "drafts":
          return categorizedData.draftFolders.length + (categorizedData.draftOffersWithoutFolder.length > 0 ? 1 : 0);
        case "future":
          return categorizedData.futureFolders.length + (categorizedData.futureOffersWithoutFolder.length > 0 ? 1 : 0);
        case "archived":
          return categorizedData.deletedFolders.length + (categorizedData.deletedOffersWithoutFolder.length > 0 ? 1 : 0);
      }
    }

    // When filters are active, count folders with matching offers
    let baseOffersByFolder: Record<string, Offer[]> = {};
    let baseOffersWithoutFolder: Offer[] = [];
    
    switch (activeView) {
      case "active":
        baseOffersByFolder = categorizedData.currentOffersByFolder;
        baseOffersWithoutFolder = categorizedData.currentOffersWithoutFolder;
        break;
      case "expired":
        baseOffersByFolder = categorizedData.expiredOffersByFolder;
        baseOffersWithoutFolder = categorizedData.expiredOffersWithoutFolder;
        break;
      case "drafts":
        baseOffersByFolder = categorizedData.draftOffersByFolder;
        baseOffersWithoutFolder = categorizedData.draftOffersWithoutFolder;
        break;
      case "future":
        baseOffersByFolder = categorizedData.futureOffersByFolder;
        baseOffersWithoutFolder = categorizedData.futureOffersWithoutFolder;
        break;
      case "archived":
        baseOffersByFolder = categorizedData.deletedOffersByFolder;
        baseOffersWithoutFolder = categorizedData.deletedOffersWithoutFolder;
        break;
    }

    let folderCount = 0;
    Object.values(baseOffersByFolder).forEach(folderOffers => {
      if (folderOffers.some(offer => filteredOffers.includes(offer))) {
        folderCount++;
      }
    });

    const hasFilteredUncategorized = baseOffersWithoutFolder.some(offer => filteredOffers.includes(offer));
    if (hasFilteredUncategorized) {
      folderCount++;
    }

    return folderCount;
  }, [activeView, categorizedData, hasActiveFilters, filteredOffers]);

  // Clear filters when view changes (useEffect to avoid render-phase state changes)
  useEffect(() => {
    setSelectedOfferTypes([]);
    setSelectedRedemptionTypes([]);
    setSelectedMenuItems([]);
    setSelectedFolders([]);
  }, [activeView]);

  // Extract unique folders from current view (only real folders)
  const availableFolders = useMemo(() => {
    const folderNames = new Set<string>();
    currentViewOffers.forEach(offer => {
      if (offer.campaignFolder && foldersById.has(offer.campaignFolder)) {
        folderNames.add(foldersById.get(offer.campaignFolder)!);
      }
    });
    return Array.from(folderNames).sort();
  }, [currentViewOffers, foldersById]);

  if (!user) {
    return null;
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const toggleFilter = (type: 'offerType' | 'redemptionType' | 'menuItem', value: string) => {
    const setters = {
      offerType: setSelectedOfferTypes,
      redemptionType: setSelectedRedemptionTypes,
      menuItem: setSelectedMenuItems
    };
    const currentValues = {
      offerType: selectedOfferTypes,
      redemptionType: selectedRedemptionTypes,
      menuItem: selectedMenuItems
    };

    const setter = setters[type];
    const current = currentValues[type];

    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleDeleteFolder = async (folder: FolderWithMetrics) => {
    if (!confirm(`Are you sure you want to archive the "${folder.name}" folder? The offers inside will remain, but the folder will be removed.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/campaign-folders/${folder.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to archive folder');
      }

      refetchFolders();
    } catch (error) {
      console.error('Error archiving folder:', error);
      alert('Failed to archive folder. Please try again.');
    }
  };

  const handleResurrectOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/resurrect`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to resurrect offer');
      }

      refetchOffers();
    } catch (error) {
      console.error('Error resurrecting offer:', error);
      alert('Failed to resurrect offer. Please try again.');
    }
  };

  const handlePermanentDeleteOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/permanent`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to permanently delete offer');
      }

      refetchOffers();
    } catch (error) {
      console.error('Error permanently deleting offer:', error);
      alert('Failed to permanently delete offer. Please try again.');
    }
  };

  const handleReintegrateOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/reintegrate`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reintegrate offer');
      }

      refetchOffers();
    } catch (error) {
      console.error('Error reintegrating offer:', error);
      alert('Failed to reintegrate offer. Please try again.');
    }
  };

  const handleDuplicateOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleImmediately: false, // Create as draft for manual scheduling
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to duplicate offer');
      }

      const data = await response.json();
      
      // Show success notification
      toast({
        title: "Offer Duplicated",
        description: "This is a copy. Update details and schedule as needed.",
      });
      
      // Navigate to edit screen for the new duplicated offer
      setLocation(`/offer-form?id=${data.offer.id}`);
    } catch (error: any) {
      console.error('Error duplicating offer:', error);
      toast({
        title: "Duplication Failed",
        description: error.message || 'Failed to duplicate offer. Please try again.',
        variant: "destructive",
      });
    }
  };

  const handleCompleteDraft = (offer: Offer) => {
    // Navigate to Dashboard create page with the draft's ID to pre-fill all data
    setLocation(`/dashboard/create?id=${offer.id}`);
  };

  const handleDeleteDraft = async (offerId: string) => {
    try {
      // Permanently archive draft offers - throw them out completely
      const response = await fetch(`/api/offers/${offerId}/permanent-delete`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to archive draft offer');
      }

      toast({
        title: "Draft Template Archived",
        description: "The draft template has been permanently removed.",
      });

      refetchOffers();
    } catch (error) {
      console.error('Error archiving draft:', error);
      toast({
        title: "Archive Failed",
        description: 'Failed to archive draft template. Please try again.',
        variant: "destructive",
      });
    }
  };

  const deleteAllMutation = useMutation({
    mutationFn: async (stage: "stage1" | "stage2") => {
      const response = await apiRequest("DELETE", `/api/offers/batch/delete-all/${stage}`);
      return await response.json();
    },
    onSuccess: (data: { message: string; count: number }, stage) => {
      toast({
        title: "All Staged Offers Deleted",
        description: `Successfully deleted ${data.count} offer(s) from ${stage === "stage1" ? "Stage 1" : "Stage 2"}.`,
      });
      refetchOffers();
      refetchFolders();
      setShowDeleteAllDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete staged offers. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle applying quick inputs to batch offers
  const handleApplyQuickInputs = async (
    data: {
      maxClicksAllowed: number;
      clickBudgetDollars: number;
      zipCode: string;
      originalPrice: string;
      countdownTimerSeconds?: number;
      countdownQuantityStart?: number;
    },
    scope: 'all' | 'filtered',
    divideEvenly: boolean
  ) => {
    setIsApplyingQuickInputs(true);
    
    try {
      // Get batch offers based on scope
      let targetOffers: Offer[] = [];
      
      if (scope === 'all') {
        // Get ALL batch offers (batchPendingSelection=true)
        Object.values(categorizedData.batchOffersByFolder).forEach((offers) => {
          targetOffers.push(...offers);
        });
      } else {
        // Get only filtered batch offers
        targetOffers = filteredOffers.filter(offer => offer.batchPendingSelection);
      }

      // Calculate per-offer values if dividing evenly
      const perOfferMaxClicks = divideEvenly 
        ? Math.floor(data.maxClicksAllowed / targetOffers.length)
        : data.maxClicksAllowed;
      const perOfferBudget = divideEvenly 
        ? Math.floor((data.clickBudgetDollars / targetOffers.length) * 100) / 100
        : data.clickBudgetDollars;

      // Update each offer
      const updatePromises = targetOffers.map(async (offer) => {
        return apiRequest("PATCH", `/api/offers/${offer.id}`, {
          maxClicksAllowed: perOfferMaxClicks,
          clickBudgetDollars: perOfferBudget,
          zipCode: data.zipCode,
          originalPrice: data.originalPrice,
          countdownTimerSeconds: data.countdownTimerSeconds,
          countdownQuantityStart: data.countdownQuantityStart,
        });
      });

      await Promise.all(updatePromises);

      const scopeLabel = scope === 'all' ? 'all' : 'filtered';
      const divisionLabel = divideEvenly ? ' (divided evenly)' : '';
      toast({
        title: "Success! ✅",
        description: `Updated ${targetOffers.length} ${scopeLabel} offers${divisionLabel}`,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
    } catch (error: any) {
      console.error('Error applying quick inputs:', error);
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update offers. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsApplyingQuickInputs(false);
    }
  };

  // Handle saving budgets and metrics to individual offers
  const handleSaveBudgets = async (configs: Record<string, { 
    textBudget: number; 
    ripsBudget: number;
    maxClicks: number;
    clickNotifications: boolean;
    enableRIPS: boolean;
  }>) => {
    setIsApplyingQuickInputs(true); // Reuse the same loading state
    
    try {
      // Update each offer with its specific config
      const updatePromises = Object.entries(configs).map(async ([offerId, config]) => {
        return apiRequest("PATCH", `/api/offers/${offerId}`, {
          textBudgetDollars: config.textBudget,
          ripsBudgetDollars: config.ripsBudget,
          maxClicksAllowed: config.maxClicks,
          notifyAtMaximum: config.clickNotifications,
          getNewCustomersEnabled: config.enableRIPS,
        });
      });

      await Promise.all(updatePromises);

      toast({
        title: "Success! ✅",
        description: `Updated budgets and metrics for ${Object.keys(configs).length} offer${Object.keys(configs).length !== 1 ? 's' : ''}`,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
    } catch (error: any) {
      console.error('Error saving budgets:', error);
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to save budgets. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsApplyingQuickInputs(false);
    }
  };

  // Memoize the view data to prevent unnecessary recalculations
  const viewData = useMemo(() => {
    let baseFolders: CampaignFolder[] = [];
    let baseOffersByFolder: Record<string, Offer[]> = {};
    let baseOffersWithoutFolder: Offer[] = [];

    switch (activeView) {
      case "active":
        baseFolders = categorizedData.currentFolders;
        baseOffersByFolder = categorizedData.currentOffersByFolder;
        baseOffersWithoutFolder = categorizedData.currentOffersWithoutFolder;
        break;
      case "expired":
        baseFolders = categorizedData.expiredFolders;
        baseOffersByFolder = categorizedData.expiredOffersByFolder;
        baseOffersWithoutFolder = categorizedData.expiredOffersWithoutFolder;
        break;
      case "drafts":
        baseFolders = categorizedData.draftFolders;
        baseOffersByFolder = categorizedData.draftOffersByFolder;
        baseOffersWithoutFolder = categorizedData.draftOffersWithoutFolder;
        break;
      case "future":
        baseFolders = categorizedData.futureFolders;
        baseOffersByFolder = categorizedData.futureOffersByFolder;
        baseOffersWithoutFolder = categorizedData.futureOffersWithoutFolder;
        break;
      case "archived":
        baseFolders = categorizedData.deletedFolders;
        baseOffersByFolder = categorizedData.deletedOffersByFolder;
        baseOffersWithoutFolder = categorizedData.deletedOffersWithoutFolder;
        break;
    }

    // Apply filters if any are active
    let offersByFolder = baseOffersByFolder;
    let offersWithoutFolder = baseOffersWithoutFolder;
    let folders = baseFolders;

    if (hasActiveFilters) {
      // Filter offersByFolder
      const filteredOffersByFolder: Record<string, Offer[]> = {};
      Object.entries(baseOffersByFolder).forEach(([folderName, folderOffers]) => {
        const filtered = folderOffers.filter(offer => filteredOffers.includes(offer));
        if (filtered.length > 0) {
          filteredOffersByFolder[folderName] = filtered;
        }
      });
      offersByFolder = filteredOffersByFolder;

      // Filter offers without folder
      offersWithoutFolder = baseOffersWithoutFolder.filter(offer => filteredOffers.includes(offer));

      // Filter folders to only show those with matching offers
      folders = baseFolders.filter(folder => filteredOffersByFolder[folder.id]?.length > 0);
    }

    // Apply view scope filtering (Drafts only - always exclude folders)
    if (activeView === "drafts") {
      // Drafts tab ONLY shows standalone offers, never folders
      folders = [];
      offersByFolder = {};
    }

    // Compute folder metrics once at the parent level
    const foldersWithMetrics = folders.map(folder => 
      calculateFolderMetrics(folder, offersByFolder[folder.id] || [])
    );

    return {
      foldersWithMetrics,
      offersByFolder,
      offersWithoutFolder
    };
  }, [categorizedData, activeView, hasActiveFilters, filteredOffers, viewScope]);

  const renderView = () => {
    // Batch Grid view: Show all batch offers pending selection as individual cards
    if (activeView === "folder1") {
      // Get all batch offers (with batchPendingSelection=true)
      let allFolderOffers: Offer[] = [];
      console.log("📁 Batch Grid View Debug:");
      console.log(`   Total draft folders: ${categorizedData.draftFolders.length}`);
      
      // Use batchOffersByFolder instead of draftOffersByFolder
      categorizedData.draftFolders.forEach((folder) => {
        const batchOffers = categorizedData.batchOffersByFolder[folder.id] || [];
        console.log(`   Folder "${folder.name}" (${folder.id}): ${batchOffers.length} batch offers`);
        allFolderOffers.push(...batchOffers);
      });
      
      console.log(`   Total batch offers before filter: ${allFolderOffers.length}`);
      console.log(`   Has active filters: ${hasActiveFilters}`);
      
      // Apply filters if active
      if (hasActiveFilters) {
        allFolderOffers = allFolderOffers.filter(offer => filteredOffers.includes(offer));
      }
      
      // Apply sorting
      allFolderOffers.sort((a, b) => {
        let comparison = 0;
        
        switch (sortKey) {
          case "date":
            comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            break;
          case "ctr":
            // CTR calculation: (clicks / views) * 100
            const ctrA = (a.viewedCount || 0) > 0 ? ((a.clickCount || 0) / (a.viewedCount || 0)) * 100 : 0;
            const ctrB = (b.viewedCount || 0) > 0 ? ((b.clickCount || 0) / (b.viewedCount || 0)) * 100 : 0;
            comparison = ctrA - ctrB;
            break;
          case "duration":
            // Duration in days
            const durationA = a.endDate && a.startDate ? 
              (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
            const durationB = b.endDate && b.startDate ? 
              (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
            comparison = durationA - durationB;
            break;
          case "budget":
            // Budget based on max clicks
            comparison = (a.maxClicks || 0) - (b.maxClicks || 0);
            break;
          case "viewed":
            comparison = (a.viewedCount || 0) - (b.viewedCount || 0);
            break;
          case "maxClicks":
            comparison = (a.maxClicks || 0) - (b.maxClicks || 0);
            break;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
      
      console.log(`   Final batch offer count: ${allFolderOffers.length}`);
      
      // Calculate total and filtered counts
      const totalBatchCount = Object.values(categorizedData.batchOffersByFolder)
        .reduce((sum, offers) => sum + offers.length, 0);
      const filteredBatchCount = hasActiveFilters ? allFolderOffers.length : totalBatchCount;

      return (
        <div className="space-y-6">
          {/* Two-column layout: Filters + Quick Setup (Left) | Scrolling Offers (Right) */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Left: Filters + Quick Setup Combined */}
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6 pb-8 space-y-6">
                {/* Filter Section */}
                <div className="flex-1 space-y-4">
                    {/* Type Filters and Features - All in one row */}
                    <div className="flex items-center gap-2 flex-wrap" data-testid="feature-filter-group">
                      <Filter className="h-5 w-5 text-muted-foreground" />
                      <Select
                        value={selectedOfferTypes.length > 0 ? selectedOfferTypes[0] : "all"}
                        onValueChange={(value) => {
                          if (value === "all") {
                            setSelectedOfferTypes([]);
                          } else {
                            setSelectedOfferTypes([value]);
                          }
                        }}
                        data-testid="select-offer-type"
                      >
                        <SelectTrigger className="w-[110px] h-7 text-xs">
                          <SelectValue placeholder="Offer Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">PCT</SelectItem>
                          <SelectItem value="dollar_amount">DOL</SelectItem>
                          <SelectItem value="bogo">BOGO</SelectItem>
                          <SelectItem value="spend_threshold">XY</SelectItem>
                          <SelectItem value="all">All Types</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={selectedRedemptionTypes.includes("coupon_codes") ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          if (selectedRedemptionTypes.includes("coupon_codes")) {
                            setSelectedRedemptionTypes([]);
                          } else {
                            setSelectedRedemptionTypes(["coupon_codes"]);
                          }
                        }}
                        data-testid="button-filter-rc"
                      >
                        PAR
                      </Button>
                      <Button
                        variant={selectedRedemptionTypes.includes("mobile_wallet_passes") ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          if (selectedRedemptionTypes.includes("mobile_wallet_passes")) {
                            setSelectedRedemptionTypes([]);
                          } else {
                            setSelectedRedemptionTypes(["mobile_wallet_passes"]);
                          }
                        }}
                        data-testid="button-filter-ppo"
                      >
                        PPO
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeatureFilter(featureFilter === "countdownTimer" ? "" : "countdownTimer")}
                        className={featureFilter === "countdownTimer" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                        data-testid="button-feature-ct"
                      >
                        CT
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeatureFilter(featureFilter === "countdownQty" ? "" : "countdownQty")}
                        className={featureFilter === "countdownQty" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                        data-testid="button-feature-cq"
                      >
                        CQ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeatureFilter(featureFilter === "ctcq" ? "" : "ctcq")}
                        className={featureFilter === "ctcq" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                        data-testid="button-feature-ctcq"
                      >
                        CTCQ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFeatureFilter(featureFilter === "media" ? "" : "media")}
                        className={featureFilter === "media" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                        data-testid="button-feature-media"
                      >
                        Media
                      </Button>
                    </div>
                </div>

                {/* Sort Section */}
                <div className="flex-1 space-y-4 border-t pt-6">
                  <div className="space-y-3">
                    {/* Sort Options */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                      <Button
                        variant={sortKey === "maxClicks" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSortKey("maxClicks")}
                        data-testid="button-sort-maxclicks"
                      >
                        Max Clicks
                      </Button>
                      <Button
                        variant={sortKey === "date" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSortKey("date")}
                        data-testid="button-sort-date"
                      >
                        Date
                      </Button>
                      <Button
                        variant={sortKey === "duration" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSortKey("duration")}
                        data-testid="button-sort-duration"
                      >
                        Duration
                      </Button>
                      <Button
                        variant={sortKey === "bank" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSortKey("bank")}
                        data-testid="button-sort-bank"
                      >
                        Bank
                      </Button>
                      <Button
                        variant={sortKey === "textBudget" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSortKey("textBudget")}
                        data-testid="button-sort-text-budget"
                      >
                        Text Budget
                      </Button>
                      <Button
                        variant={sortKey === "ripsBudget" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSortKey("ripsBudget")}
                        data-testid="button-sort-rips-budget"
                      >
                        RIPS Budget
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Budget Dashboard Section */}
                <div className="border-t pt-6">
                  <BudgetDashboard
                    offers={filteredOffers.filter(offer => offer.batchPendingSelection)}
                    onSave={handleSaveBudgets}
                    isSaving={isApplyingQuickInputs}
                  />
                </div>

                {/* Quick Setup Section - Moved down further */}
                <div className="border-t pt-12 mt-12">
                  <QuickInputCard 
                    onApply={handleApplyQuickInputs}
                    isApplying={isApplyingQuickInputs}
                    totalCount={totalBatchCount}
                    filteredCount={filteredBatchCount}
                    hasFilters={hasActiveFilters}
                    compact={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Right: Search and Scrolling Offers */}
            <div className="space-y-3">
              {/* Search Bar and Delete All Button - Above right column */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="title-filter"
                    type="text"
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.target.value)}
                    placeholder="Search titles..."
                    className="h-7 text-xs w-64"
                    data-testid="input-title-filter"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={titleFilter ? "h-7" : "h-7 invisible"}
                    onClick={() => setTitleFilter("")}
                    data-testid="button-clear-title-filter"
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={allFolderOffers.length === 0 || deleteAllMutation.isPending}
                  data-testid={activeView === "folder1" ? "button-delete-all-stage1" : "button-delete-all-stage2"}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                </Button>
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6 pb-4 relative">
                {allFolderOffers.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Batch Offers</h3>
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? 'No batch offers match your filters' : 'Create batch offers from the Dashboard to see permutation cards here'}
                    </p>
                  </div>
                ) : (
                  <>
                {/* Scroll Controls */}
                <div className="absolute top-2 left-0 flex flex-col gap-1 z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollBy({ top: -200, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-scroll-up"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollBy({ top: 200, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-scroll-down"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                </div>
                
                <div ref={scrollContainerRef} className="h-[600px] overflow-y-auto">
                <div className="space-y-4 pr-2">
                  {allFolderOffers.map((offer) => {
                    const offerCode = generateOfferCode(offer);
                    return (
                      <Card key={offer.id} data-testid={`offer-card-${offer.id}`} className="bg-white dark:bg-slate-900">
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Offer Title (prominently displayed) */}
                              <div className="text-lg font-bold text-primary mb-2" data-testid={`offer-title-${offer.id}`}>
                                {offer.title}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {offerCode}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleCompleteDraft(offer)}
                                data-testid={`button-complete-${offer.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Stage 2
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDraft(offer.id)}
                                data-testid={`button-delete-${offer.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
                </div>
                </>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      );
    }
    
    // Folder 2 view: Stage 2 (same layout as Stage 1)
    if (activeView === "folder2") {
      // Get all offers from batch folders
      let allFolderOffers: Offer[] = [];
      categorizedData.draftFolders.forEach((folder) => {
        const batchOffers = categorizedData.batchOffersByFolder[folder.id] || [];
        allFolderOffers.push(...batchOffers);
      });
      
      // Apply filters if active
      if (hasActiveFilters) {
        allFolderOffers = allFolderOffers.filter(offer => filteredOffers.includes(offer));
      }
      
      // Apply sorting
      allFolderOffers.sort((a, b) => {
        let comparison = 0;
        
        switch (sortKey) {
          case "date":
            comparison = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            break;
          case "ctr":
            const ctrA = (a.viewedCount || 0) > 0 ? ((a.clickCount || 0) / (a.viewedCount || 0)) * 100 : 0;
            const ctrB = (b.viewedCount || 0) > 0 ? ((b.clickCount || 0) / (b.viewedCount || 0)) * 100 : 0;
            comparison = ctrA - ctrB;
            break;
          case "duration":
            const durationA = a.endDate && a.startDate ? 
              (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
            const durationB = b.endDate && b.startDate ? 
              (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24) : 0;
            comparison = durationA - durationB;
            break;
          case "budget":
            comparison = (a.maxClicks || 0) - (b.maxClicks || 0);
            break;
          case "viewed":
            comparison = (a.viewedCount || 0) - (b.viewedCount || 0);
            break;
          case "maxClicks":
            comparison = (a.maxClicks || 0) - (b.maxClicks || 0);
            break;
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
      
      // Calculate total and filtered counts
      const totalBatchCount = Object.values(categorizedData.batchOffersByFolder)
        .reduce((sum, offers) => sum + offers.length, 0);
      const filteredBatchCount = hasActiveFilters ? allFolderOffers.length : totalBatchCount;

      return (
        <div className="space-y-6">
          {/* Two-column layout: Filters + Quick Setup (Left) | Scrolling Offers (Right) */}
          <div className="grid grid-cols-2 gap-6 items-start">
            {/* Left: Separate Cards for Filters, Sort, and Quick Setup */}
            <div className="space-y-4">
              {/* Filter Section - Its own card */}
              <Card>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center gap-2 flex-wrap" data-testid="feature-filter-group">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <Select
                      value={selectedOfferTypes.length > 0 ? selectedOfferTypes[0] : "all"}
                      onValueChange={(value) => {
                        if (value === "all") {
                          setSelectedOfferTypes([]);
                        } else {
                          setSelectedOfferTypes([value]);
                        }
                      }}
                      data-testid="select-offer-type"
                    >
                      <SelectTrigger className="w-[110px] h-7 text-xs">
                        <SelectValue placeholder="Offer Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">PCT</SelectItem>
                        <SelectItem value="dollar_amount">DOL</SelectItem>
                        <SelectItem value="bogo">BOGO</SelectItem>
                        <SelectItem value="spend_threshold">XY</SelectItem>
                        <SelectItem value="all">All Types</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={selectedRedemptionTypes.includes("coupon_codes") ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        if (selectedRedemptionTypes.includes("coupon_codes")) {
                          setSelectedRedemptionTypes([]);
                        } else {
                          setSelectedRedemptionTypes(["coupon_codes"]);
                        }
                      }}
                      data-testid="button-filter-rc"
                    >
                      PAR
                    </Button>
                    <Button
                      variant={selectedRedemptionTypes.includes("mobile_wallet_passes") ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        if (selectedRedemptionTypes.includes("mobile_wallet_passes")) {
                          setSelectedRedemptionTypes([]);
                        } else {
                          setSelectedRedemptionTypes(["mobile_wallet_passes"]);
                        }
                      }}
                      data-testid="button-filter-ppo"
                    >
                      PPO
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "countdownTimer" ? "" : "countdownTimer")}
                      className={featureFilter === "countdownTimer" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-ct"
                    >
                      CT
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "countdownQty" ? "" : "countdownQty")}
                      className={featureFilter === "countdownQty" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-cq"
                    >
                      CQ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "ctcq" ? "" : "ctcq")}
                      className={featureFilter === "ctcq" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-ctcq"
                    >
                      CTCQ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "media" ? "" : "media")}
                      className={featureFilter === "media" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-media"
                    >
                      Media
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sort Section - Its own card */}
              <Card>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                    <Button
                      variant={sortKey === "date" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSortKey("date")}
                      data-testid="button-sort-date"
                    >
                      Date
                    </Button>
                    <Button
                      variant={sortKey === "maxClicks" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSortKey("maxClicks")}
                      data-testid="button-sort-maxclicks"
                    >
                      Max Clicks
                    </Button>
                    <Button
                      variant={sortKey === "ctr" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSortKey("ctr")}
                      data-testid="button-sort-ctr"
                    >
                      CTR
                    </Button>
                    <Button
                      variant={sortKey === "duration" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSortKey("duration")}
                      data-testid="button-sort-duration"
                    >
                      Duration
                    </Button>
                    <Button
                      variant={sortKey === "budget" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSortKey("budget")}
                      data-testid="button-sort-budget"
                    >
                      Budget
                    </Button>
                    <Button
                      variant={sortKey === "viewed" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSortKey("viewed")}
                      data-testid="button-sort-viewed"
                    >
                      Viewed
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Setup - Moved down 2 inches */}
              <div className="mt-32">
                <Card>
                  <CardContent className="pt-6 pb-4">
                    <QuickInputCard 
                      onApply={handleApplyQuickInputs}
                      isApplying={isApplyingQuickInputs}
                      totalCount={totalBatchCount}
                      filteredCount={filteredBatchCount}
                      hasFilters={hasActiveFilters}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right: Search and Scrolling Offers */}
            <div className="space-y-3">
              {/* Search Bar and Delete All Button - Above right column */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="title-filter"
                    type="text"
                    value={titleFilter}
                    onChange={(e) => setTitleFilter(e.target.value)}
                    placeholder="Search titles..."
                    className="h-7 text-xs w-64"
                    data-testid="input-title-filter"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={titleFilter ? "h-7" : "h-7 invisible"}
                    onClick={() => setTitleFilter("")}
                    data-testid="button-clear-title-filter"
                  >
                    Clear
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={allFolderOffers.length === 0 || deleteAllMutation.isPending}
                  data-testid={activeView === "folder1" ? "button-delete-all-stage1" : "button-delete-all-stage2"}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                </Button>
              </div>

              <Card className="bg-blue-50 dark:bg-blue-950/20">
                <CardContent className="pt-6 pb-4 relative">
                {allFolderOffers.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Stage 2</h3>
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? 'No offers match your filters' : 'Offers will appear here when moved to Stage 2'}
                    </p>
                  </div>
                ) : (
                  <>
                {/* Scroll Controls */}
                <div className="absolute top-2 left-0 flex flex-col gap-1 z-10">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollBy({ top: -200, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-scroll-up"
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollBy({ top: 200, behavior: 'smooth' });
                      }
                    }}
                    data-testid="button-scroll-down"
                  >
                    <ArrowDown className="h-5 w-5" />
                  </Button>
                </div>
                
                <div ref={scrollContainerRef} className="h-[600px] overflow-y-auto">
                <div className="space-y-4 pr-2">
                  {allFolderOffers.map((offer) => {
                    const offerCode = generateOfferCode(offer);
                    return (
                      <Card key={offer.id} data-testid={`offer-card-${offer.id}`} className="bg-white dark:bg-slate-900">
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Offer Title (prominently displayed) */}
                              <div className="text-lg font-bold text-primary mb-2" data-testid={`offer-title-${offer.id}`}>
                                {offer.title}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground">
                                {offerCode}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleCompleteDraft(offer)}
                                data-testid={`button-complete-${offer.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDraft(offer.id)}
                                data-testid={`button-delete-${offer.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Archive
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
                </div>
                </>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      );
    }
    
    // All other views use FolderList component with Filter and Sort controls
    return (
      <div className="space-y-6">
        {/* Filter and Sort Controls for these views */}
        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6 pb-8">
            <div className="flex gap-6">
              {/* Filter Section */}
              <div className="flex-1">
                  {/* Type Filters */}
                  <div className="flex items-center gap-2 flex-wrap" data-testid="feature-filter-group">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                    <Select
                      value={selectedOfferTypes.length > 0 ? selectedOfferTypes[0] : "all"}
                      onValueChange={(value) => {
                        if (value === "all") {
                          setSelectedOfferTypes([]);
                        } else {
                          setSelectedOfferTypes([value]);
                        }
                      }}
                      data-testid="select-offer-type"
                    >
                      <SelectTrigger className="w-[110px] h-7 text-xs">
                        <SelectValue placeholder="Offer Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">PCT</SelectItem>
                        <SelectItem value="dollar_amount">DOL</SelectItem>
                        <SelectItem value="bogo">BOGO</SelectItem>
                        <SelectItem value="spend_threshold">XY</SelectItem>
                        <SelectItem value="all">All Types</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant={selectedRedemptionTypes.includes("coupon_codes") ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        if (selectedRedemptionTypes.includes("coupon_codes")) {
                          setSelectedRedemptionTypes([]);
                        } else {
                          setSelectedRedemptionTypes(["coupon_codes"]);
                        }
                      }}
                      data-testid="button-filter-rc"
                    >
                      PAR
                    </Button>
                    <Button
                      variant={selectedRedemptionTypes.includes("mobile_wallet_passes") ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        if (selectedRedemptionTypes.includes("mobile_wallet_passes")) {
                          setSelectedRedemptionTypes([]);
                        } else {
                          setSelectedRedemptionTypes(["mobile_wallet_passes"]);
                        }
                      }}
                      data-testid="button-filter-ppo"
                    >
                      PPO
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "countdownTimer" ? "" : "countdownTimer")}
                      className={featureFilter === "countdownTimer" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-ct"
                    >
                      CT
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "countdownQty" ? "" : "countdownQty")}
                      className={featureFilter === "countdownQty" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-cq"
                    >
                      CQ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "ctcq" ? "" : "ctcq")}
                      className={featureFilter === "ctcq" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-ctcq"
                    >
                      CTCQ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeatureFilter(featureFilter === "media" ? "" : "media")}
                      className={featureFilter === "media" ? "bg-primary/20 text-primary font-medium h-7 text-xs" : "h-7 text-xs"}
                      data-testid="button-feature-media"
                    >
                      Media
                    </Button>
                  </div>
              </div>

              {/* Sort Section */}
              <div className="flex-1 space-y-3">
                {/* Sort Options */}
                <div className="flex items-center gap-2 flex-wrap">
                  <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
                  <Button
                    variant={sortKey === "date" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSortKey("date")}
                    data-testid="button-sort-date"
                  >
                    Date
                  </Button>
                  <Button
                    variant={sortKey === "maxClicks" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSortKey("maxClicks")}
                    data-testid="button-sort-maxclicks"
                  >
                    Max Clicks
                  </Button>
                  <Button
                    variant={sortKey === "ctr" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSortKey("ctr")}
                    data-testid="button-sort-ctr"
                  >
                    CTR
                  </Button>
                  <Button
                    variant={sortKey === "duration" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSortKey("duration")}
                    data-testid="button-sort-duration"
                  >
                    Duration
                  </Button>
                  <Button
                    variant={sortKey === "budget" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSortKey("budget")}
                    data-testid="button-sort-budget"
                  >
                    Budget
                  </Button>
                  <Button
                    variant={sortKey === "viewed" ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSortKey("viewed")}
                    data-testid="button-sort-viewed"
                  >
                    Viewed
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Folder List */}
        <FolderList
          folders={viewData.foldersWithMetrics}
          offersByFolder={viewData.offersByFolder}
          offersWithoutFolder={viewData.offersWithoutFolder}
          sortKey={sortKey}
          sortDirection={sortDirection}
          searchQuery={debouncedSearchQuery}
          onDeleteFolder={handleDeleteFolder}
          onNavigate={setLocation}
          viewMode={activeView}
          onResurrectOffer={handleResurrectOffer}
          onPermanentDeleteOffer={handlePermanentDeleteOffer}
          onReintegrateOffer={handleReintegrateOffer}
          onDuplicateOffer={handleDuplicateOffer}
          onCompleteDraft={handleCompleteDraft}
          onDeleteDraft={handleDeleteDraft}
        />
      </div>
    );
  };


  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-display font-bold text-xl mb-2">
              Offers
            </h1>
          </div>

          <div className="mb-6">
            <ToggleGroup
              type="single"
              value={activeView}
              onValueChange={(value) => value && setActiveView(value as ViewMode)}
              className="justify-start flex-wrap gap-2"
              data-testid="toggle-view-mode"
            >
              <ToggleGroupItem value="folder1" data-testid="toggle-folder1" className="gap-1">
                Stage 1 ({Object.values(categorizedData.batchOffersByFolder).flat().length})
              </ToggleGroupItem>
              <ToggleGroupItem value="folder2" data-testid="toggle-folder2" className="gap-1">
                Stage 2 (0)
              </ToggleGroupItem>
              <ToggleGroupItem value="drafts" data-testid="toggle-drafts" className="gap-1">
                Drafts ({categorizedData.draftOffersWithoutFolder.length})
              </ToggleGroupItem>
              <ToggleGroupItem value="future" data-testid="toggle-future" className="gap-1">
                <Clock className="h-3.5 w-3.5" />
                Scheduled ({Object.values(categorizedData.futureOffersByFolder).flat().length + categorizedData.futureOffersWithoutFolder.length})
              </ToggleGroupItem>
              <ToggleGroupItem value="active" data-testid="toggle-active" className="gap-1">
                Active ({Object.values(categorizedData.currentOffersByFolder).flat().length + categorizedData.currentOffersWithoutFolder.length})
              </ToggleGroupItem>
              <ToggleGroupItem value="expired" data-testid="toggle-expired" className="gap-1">
                Expired ({Object.values(categorizedData.expiredOffersByFolder).flat().length + categorizedData.expiredOffersWithoutFolder.length})
              </ToggleGroupItem>
              <ToggleGroupItem value="archived" data-testid="toggle-archived" className="gap-1">
                <Trash2 className="h-3.5 w-3.5" />
                Archived ({Object.values(categorizedData.deletedOffersByFolder).flat().length + categorizedData.deletedOffersWithoutFolder.length})
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {renderView()}
        </div>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent data-testid="dialog-delete-all-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Staged Offers?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all offers from {activeView === "folder1" ? "Stage 1" : "Stage 2"}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate(activeView === "folder1" ? "stage1" : "stage2")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-all"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
