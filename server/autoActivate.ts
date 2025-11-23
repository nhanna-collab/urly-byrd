import { storage } from "./storage";
import { notificationService } from "./services/notification";

// Track last successful run to handle downtime gracefully
let lastSuccessfulRun: Date | null = null;

export async function checkAndActivateOffers() {
  console.log("Checking for offers needing auto-activation...");
  
  try {
    const now = new Date();
    
    // Calculate elapsed time since last run
    let intervalMinutes = 15; // Default interval
    if (lastSuccessfulRun) {
      const elapsedMs = now.getTime() - lastSuccessfulRun.getTime();
      intervalMinutes = Math.ceil(elapsedMs / (60 * 1000));
    } else {
      // First run after startup - use large catch-up window (24 hours)
      intervalMinutes = 24 * 60;
    }
    
    const offersToActivate = await storage.getOffersToActivate(now, intervalMinutes);
    
    if (offersToActivate.length === 0) {
      lastSuccessfulRun = now; // Update timestamp even if no offers
      return;
    }
    
    console.log(`✅ ${offersToActivate.length} offer(s) transitioned from Future to Current`);
    
    for (const offer of offersToActivate) {
      // Set activatedAt timestamp AND ensure status is 'active' to complete Future → Current transition
      // This handles cases where offers may have been created with status='draft'
      await storage.updateOffer(offer.id, offer.merchantId, {
        status: 'active',
        activatedAt: now,
      });
      
      console.log(`  → "${offer.title}" (ID: ${offer.id}) is now live`);
      
      // Send notification via notification service
      await notificationService.notifyOfferActivated(
        offer.merchantId,
        offer.id,
        offer.title
      );
    }
    
    // Update last successful run timestamp
    lastSuccessfulRun = now;
  } catch (error) {
    console.error("Error in auto-activate check:", error);
  }
}

// Run every 15 minutes
export function startAutoActivateJob() {
  const INTERVAL = 15 * 60 * 1000; // 15 minutes
  
  console.log("🚀 Starting auto-activate background job (runs every 15 minutes)");
  
  // Run immediately on startup
  checkAndActivateOffers();
  
  // Then run on interval
  setInterval(checkAndActivateOffers, INTERVAL);
}
