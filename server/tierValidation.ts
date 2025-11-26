import { TIER_LIMITS, TierValidationError, MembershipTier, getUpgradeMessage } from "@shared/tierLimits";
import type { InsertOffer } from "@shared/schema";

export interface TierValidationResult {
  valid: boolean;
  errors: TierValidationError[];
}

export function validateOfferAgainstTier(
  offerData: Partial<InsertOffer>,
  tier: MembershipTier,
  status: "draft" | "active"
): TierValidationResult {
  const errors: TierValidationError[] = [];
  const limits = TIER_LIMITS[tier];

  if (status === "draft") {
    return { valid: true, errors: [] };
  }

  if (offerData.offerType && !limits.allowedOfferTypes.includes(offerData.offerType as any)) {
    const allowedTypes = limits.allowedOfferTypes.join(", ");
    errors.push({
      field: "offerType",
      message: `${tier} tier only supports ${allowedTypes} offers. ${getUpgradeMessage(tier, getRequiredTierForOfferType(offerData.offerType as any), "offerType")}`,
      upgradeRequired: getRequiredTierForOfferType(offerData.offerType as any),
    });
  }

  if (offerData.addType === "countdown" && !limits.allowCountdown) {
    errors.push({
      field: "addType",
      message: getUpgradeMessage(tier, "ASCEND", "countdown"),
      upgradeRequired: "ASCEND",
    });
  }

  if (offerData.campaignFolder && !limits.allowFolders) {
    errors.push({
      field: "campaignFolder",
      message: getUpgradeMessage(tier, "ASCEND", "folders"),
      upgradeRequired: "ASCEND",
    });
  }

  if ((offerData.notifyOnTargetMet || offerData.notifyOnPoorPerformance) && !limits.allowNotifications) {
    errors.push({
      field: "notifications",
      message: getUpgradeMessage(tier, "ASCEND", "notifications"),
      upgradeRequired: "ASCEND",
    });
  }

  if (offerData.autoExtend && !limits.allowAutoExtend) {
    errors.push({
      field: "autoExtend",
      message: getUpgradeMessage(tier, "ASCEND", "autoExtend"),
      upgradeRequired: "ASCEND",
    });
  }

  if ((offerData.imageUrl || offerData.videoUrl) && !limits.allowMedia) {
    errors.push({
      field: "media",
      message: getUpgradeMessage(tier, "FREEBYRD", "media"),
      upgradeRequired: "FREEBYRD",
    });
  }

  if (offerData.getNewCustomersEnabled && !limits.allowCustomerAcquisition) {
    errors.push({
      field: "getNewCustomersEnabled",
      message: getUpgradeMessage(tier, "SOAR", "customerAcquisition"),
      upgradeRequired: "SOAR",
    });
  }

  if (offerData.redemptionType === "coupon" && offerData.couponDeliveryMethod) {
    if (!limits.allowedDeliveryMethods.includes(offerData.couponDeliveryMethod as any)) {
      const allowed = limits.allowedDeliveryMethods.join(", ");
      const requiredTier = getRequiredTierForDeliveryMethod(offerData.couponDeliveryMethod as any);
      errors.push({
        field: "couponDeliveryMethod",
        message: `${tier} tier only supports ${allowed} delivery methods. ${offerData.couponDeliveryMethod === "mobile_wallet_passes" ? getUpgradeMessage(tier, "SOAR", "walletPasses") : `Upgrade to ${requiredTier}.`}`,
        upgradeRequired: requiredTier,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function validateActiveOfferCount(
  merchantId: string,
  tier: MembershipTier,
  currentOfferId: string | undefined,
  storage: any
): Promise<TierValidationResult> {
  const limits = TIER_LIMITS[tier];
  
  const activeOffers = await storage.getOffersByMerchant(merchantId);
  const activeCount = activeOffers.filter((offer: any) => 
    offer.status === "active" && offer.id !== currentOfferId
  ).length;

  if (activeCount >= limits.maxActiveOffers) {
    return {
      valid: false,
      errors: [{
        field: "activeOfferCount",
        message: `${tier} tier allows maximum ${limits.maxActiveOffers} active offer${limits.maxActiveOffers === 1 ? '' : 's'}. You currently have ${activeCount} active offer${activeCount === 1 ? '' : 's'}. Please deactivate an existing offer or upgrade your tier.`,
        upgradeRequired: getNextTier(tier),
      }],
    };
  }

  return { valid: true, errors: [] };
}

function getRequiredTierForOfferType(offerType: string): MembershipTier {
  if (offerType === "percentage" || offerType === "dollar_amount") {
    return "NEST";
  }
  return "FREEBYRD";
}

function getRequiredTierForDeliveryMethod(method: string): MembershipTier {
  if (method === "coupon_codes") return "NEST";
  if (method === "text_message_alerts") return "FREEBYRD";
  if (method === "mms_based_coupons" || method === "mobile_app_based_coupons") return "ASCEND";
  if (method === "mobile_wallet_passes") return "SOAR";
  return "SOAR";
}

function getNextTier(currentTier: MembershipTier): MembershipTier {
  const tierOrder: MembershipTier[] = ["NEST", "FREEBYRD", "ASCEND", "SOAR", "SOAR_PLUS", "SOAR_PLATINUM"];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex < tierOrder.length - 1) {
    return tierOrder[currentIndex + 1];
  }
  return "SOAR_PLATINUM";
}
