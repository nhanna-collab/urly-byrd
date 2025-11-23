import { storage } from "./storage";
import { notificationService } from "./services/notification";

export async function checkAndExpireOffers() {
  console.log("Checking for offers needing auto-expiration...");
  
  try {
    const now = new Date();
    const offersToExpire = await storage.getOffersToExpire(now);
    
    if (offersToExpire.length === 0) {
      return;
    }
    
    let expiredCount = 0;
    
    for (const offer of offersToExpire) {
      // Update status to expired
      await storage.updateOffer(offer.id, offer.merchantId, {
        status: 'expired'
      });
      
      expiredCount++;
      console.log(`⏰ Auto-expired offer "${offer.title}" (ID: ${offer.id})`);
      
      // Send notification via notification service
      await notificationService.notifyOfferExpired(
        offer.merchantId,
        offer.id,
        offer.title
      );
    }
    
    console.log(`✅ Auto-expired ${expiredCount} offer(s)`);
  } catch (error) {
    console.error("Error in auto-expire check:", error);
  }
}

// Run every 15 minutes
export function startAutoExpireJob() {
  const INTERVAL = 15 * 60 * 1000; // 15 minutes
  
  console.log("🚀 Starting auto-expire background job (runs every 15 minutes)");
  
  // Run immediately on startup
  checkAndExpireOffers();
  
  // Then run on interval
  setInterval(checkAndExpireOffers, INTERVAL);
}
