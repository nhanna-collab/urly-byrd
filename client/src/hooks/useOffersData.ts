import { useMemo } from "react";
import type { CampaignFolder, Offer } from "@shared/schema";

export interface OffersByFolder {
  [folderName: string]: Offer[];
}

export interface CategorizedOffers {
  currentFolders: CampaignFolder[];
  currentOffersByFolder: OffersByFolder;
  currentOffersWithoutFolder: Offer[];
  
  expiredFolders: CampaignFolder[];
  expiredOffersByFolder: OffersByFolder;
  expiredOffersWithoutFolder: Offer[];
  
  draftFolders: CampaignFolder[];
  draftOffersByFolder: OffersByFolder;
  draftOffersWithoutFolder: Offer[];
  
  futureFolders: CampaignFolder[];
  futureOffersByFolder: OffersByFolder;
  futureOffersWithoutFolder: Offer[];
  
  deletedFolders: CampaignFolder[];
  deletedOffersByFolder: OffersByFolder;
  deletedOffersWithoutFolder: Offer[];
  
  // Stage 1: Both batch offers AND single draft offers (work area before scheduling)
  batchOffersByFolder: OffersByFolder;
  stage1Offers: Offer[]; // All offers that should appear in Stage 1 (batch + single drafts)
}

// Helper to parse datetime-local strings consistently in local timezone
function parseLocalDateTime(dateValue: string | Date): Date {
  // datetime-local input values are in format: "YYYY-MM-DDTHH:mm"
  // They represent local time, so we parse them as-is without UTC conversion
  if (dateValue instanceof Date) {
    return dateValue;
  }
  return new Date(dateValue);
}

export function useOffersData(
  campaignFolders: CampaignFolder[],
  offers: Offer[]
): CategorizedOffers {
  return useMemo(() => {
    const now = new Date();
    
    // First, separate deleted offers from active offers
    // Batch offers pending selection are tracked separately (for A/B testing workflow)
    const batchOffers = offers.filter(offer => !offer.isDeleted && offer.batchPendingSelection);
    const activeOffers = offers.filter(offer => !offer.isDeleted && !offer.batchPendingSelection);
    const deletedOffers = offers.filter(offer => offer.isDeleted);
    
    // LIFECYCLE SPEC: Categorize offers based on date presence and timing
    
    // 1. DRAFTS: Offers with NO dates set (not scheduled)
    // These are editable blueprints that haven't been scheduled yet
    const draftOffers = activeOffers.filter(offer => {
      // Missing start date OR missing end date = Draft
      return !offer.startDate || !offer.endDate;
    });
    
    // 2. EXPIRED: Offers past their end date
    // These are completed campaigns for analytics
    const expiredOffers = activeOffers.filter(offer => {
      // Must have end date and it must be in the past
      return offer.endDate && parseLocalDateTime(offer.endDate) <= now;
    });
    
    // 3. ACTIVE: Offers currently running (start ≤ now ≤ end)
    // These are live campaigns collecting metrics
    const currentOffers = activeOffers.filter(offer => {
      // Must have both dates
      if (!offer.startDate || !offer.endDate) return false;
      
      // End date must be in future
      if (parseLocalDateTime(offer.endDate) <= now) return false;
      
      // Start date must be in past or now
      return parseLocalDateTime(offer.startDate) <= now;
    });
    
    // 4. FUTURE: Offers scheduled for future (start > now)
    // These are campaigns waiting to launch
    const futureOffers = activeOffers.filter(offer => {
      // Must have both dates
      if (!offer.startDate || !offer.endDate) return false;
      
      // Start date must be in future
      return parseLocalDateTime(offer.startDate) > now;
    });
    
    // Group offers by folder for each category
    const groupByFolder = (categoryOffers: Offer[]) => {
      const byFolder: OffersByFolder = {};
      const withoutFolder: Offer[] = [];
      
      categoryOffers.forEach(offer => {
        if (offer.campaignFolder) {
          if (!byFolder[offer.campaignFolder]) {
            byFolder[offer.campaignFolder] = [];
          }
          byFolder[offer.campaignFolder].push(offer);
        } else {
          withoutFolder.push(offer);
        }
      });
      
      return { byFolder, withoutFolder };
    };
    
    const { byFolder: currentOffersByFolder, withoutFolder: currentOffersWithoutFolder } = groupByFolder(currentOffers);
    const { byFolder: expiredOffersByFolder, withoutFolder: expiredOffersWithoutFolder } = groupByFolder(expiredOffers);
    const { byFolder: draftOffersByFolder, withoutFolder: draftOffersWithoutFolder } = groupByFolder(draftOffers);
    const { byFolder: futureOffersByFolder, withoutFolder: futureOffersWithoutFolder } = groupByFolder(futureOffers);
    const { byFolder: deletedOffersByFolder, withoutFolder: deletedOffersWithoutFolder } = groupByFolder(deletedOffers);
    const { byFolder: batchOffersByFolder } = groupByFolder(batchOffers);
    
    // Filter folders by status:
    // - Draft folders (status='draft') appear only in Drafts view
    // - Campaign folders (status='campaign') appear in Active/Expired views after promotion
    const draftFolders = campaignFolders.filter(folder => folder.status === 'draft');
    const campaignStatusFolders = campaignFolders.filter(folder => folder.status === 'campaign');
    
    const currentFolders = campaignStatusFolders;
    const expiredFolders = campaignStatusFolders;
    const futureFolders = campaignStatusFolders;
    
    // For deleted view, only show folders that actually contain deleted offers
    const deletedFolders = campaignFolders.filter(folder => 
      deletedOffersByFolder[folder.id] && deletedOffersByFolder[folder.id].length > 0
    );
    
    // Stage 1 offers: Combine batch offers (pending selection) + single draft offers (not yet scheduled)
    const stage1Offers = [...batchOffers, ...draftOffers];
    
    return {
      currentFolders,
      currentOffersByFolder,
      currentOffersWithoutFolder,
      
      expiredFolders,
      expiredOffersByFolder,
      expiredOffersWithoutFolder,
      
      draftFolders,
      draftOffersByFolder,
      draftOffersWithoutFolder,
      
      futureFolders,
      futureOffersByFolder,
      futureOffersWithoutFolder,
      
      deletedFolders,
      deletedOffersByFolder,
      deletedOffersWithoutFolder,
      
      batchOffersByFolder,
      stage1Offers, // For Stage 1 view: batch + single draft offers
    };
  }, [campaignFolders, offers]);
}
