import { storage } from "./storage";
import { notificationService } from "./services/notification";

export async function checkAndExtendOffers() {
  console.log("Checking for offers needing auto-extension...");
  
  try {
    // Get offers expiring in the next hour
    const expiringOffers = await storage.getExpiringOffers(1);
    
    for (const offer of expiringOffers) {
      // Skip if no auto-extend or no target units set
      if (!offer.autoExtend || !offer.targetUnits) {
        continue;
      }

      const unitsSold = offer.unitsSold || 0;
      const targetUnits = offer.targetUnits;

      // Check if target units were reached
      if (unitsSold >= targetUnits) {
        console.log(`✅ Offer "${offer.title}" reached target (${unitsSold}/${targetUnits})`);
        continue;
      }

      // Auto-extend the offer
      const extensionDays = offer.extensionDays || 3;
      const newEndDate = new Date(offer.endDate);
      newEndDate.setDate(newEndDate.getDate() + extensionDays);

      await storage.updateOffer(offer.id, offer.merchantId, {
        endDate: newEndDate,
      });

      console.log(`📅 Auto-extended offer "${offer.title}" by ${extensionDays} days`);

      // Send notification via notification service
      await notificationService.notifyAutoExtend(
        offer.merchantId,
        offer.id,
        offer.title,
        extensionDays,
        unitsSold,
        targetUnits
      );
    }

    // Check for offers that need shortfall warnings (expiring soon but auto-extend is disabled)
    for (const offer of expiringOffers) {
      if (!offer.notifyOnShortfall || offer.autoExtend) {
        continue;
      }

      const unitsSold = offer.unitsSold || 0;
      const targetUnits = offer.targetUnits;

      if (targetUnits && unitsSold < targetUnits) {
        // Send notification via notification service
        await notificationService.notifyShortfall(
          offer.merchantId,
          offer.id,
          offer.title,
          unitsSold,
          targetUnits
        );

        console.log(`⚠️ Shortfall warning sent for "${offer.title}"`);
      }
    }
  } catch (error) {
    console.error("Error in auto-extend check:", error);
  }
}

// Run every 15 minutes
export function startAutoExtendJob() {
  const INTERVAL = 15 * 60 * 1000; // 15 minutes
  
  console.log("🚀 Starting auto-extend background job (runs every 15 minutes)");
  
  // Run immediately on startup
  checkAndExtendOffers();
  
  // Then run on interval
  setInterval(checkAndExtendOffers, INTERVAL);
}
