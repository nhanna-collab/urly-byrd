export type MembershipTier = "NEST" | "FREEBYRD" | "GLIDE" | "SOAR" | "SOAR_PLUS" | "SOAR_PLATINUM";

export type OfferType = "percentage" | "dollar_amount" | "bogo" | "spend_threshold";
export type DeliveryMethod = "coupon_codes" | "text_message_alerts" | "mms_based_coupons" | "mobile_app_based_coupons" | "mobile_wallet_passes";

export interface TierPricing {
  monthlyFee: number;
  textCostStart: number;
  textCostAfter3000?: number;
  monthlyTexts?: number;
  pricePerClick?: number;
}

export interface TierCapabilities {
  maxActiveOffers: number;
  allowedOfferTypes: OfferType[];
  allowCountdown: boolean;
  allowFolders: boolean;
  allowNotifications: boolean;
  allowAutoExtend: boolean;
  allowMedia: boolean;
  allowCustomerAcquisition: boolean;
  allowedDeliveryMethods: DeliveryMethod[];
  pricing: TierPricing;
}

export const TIER_LIMITS: Record<MembershipTier, TierCapabilities> = {
  NEST: {
    maxActiveOffers: 1,
    allowedOfferTypes: ["percentage", "dollar_amount"],
    allowCountdown: false,
    allowFolders: false,
    allowNotifications: false,
    allowAutoExtend: false,
    allowMedia: false,
    allowCustomerAcquisition: false,
    allowedDeliveryMethods: ["coupon_codes"],
    pricing: {
      monthlyFee: 0,
      textCostStart: 0,
    },
  },
  FREEBYRD: {
    maxActiveOffers: 3,
    allowedOfferTypes: ["percentage", "dollar_amount", "bogo", "spend_threshold"],
    allowCountdown: false,
    allowFolders: false,
    allowNotifications: false,
    allowAutoExtend: false,
    allowMedia: true,
    allowCustomerAcquisition: false,
    allowedDeliveryMethods: ["coupon_codes", "text_message_alerts"],
    pricing: {
      monthlyFee: 0,
      textCostStart: 0.021,
      textCostAfter3000: 0.013,
    },
  },
  GLIDE: {
    maxActiveOffers: 5,
    allowedOfferTypes: ["percentage", "dollar_amount", "bogo", "spend_threshold"],
    allowCountdown: true,
    allowFolders: true,
    allowNotifications: true,
    allowAutoExtend: true,
    allowMedia: true,
    allowCustomerAcquisition: false,
    allowedDeliveryMethods: ["coupon_codes", "text_message_alerts", "mms_based_coupons", "mobile_app_based_coupons"],
    pricing: {
      monthlyFee: 0,
      textCostStart: 0.0079,
      monthlyTexts: 1600,
    },
  },
  SOAR: {
    maxActiveOffers: 20,
    allowedOfferTypes: ["percentage", "dollar_amount", "bogo", "spend_threshold"],
    allowCountdown: true,
    allowFolders: true,
    allowNotifications: true,
    allowAutoExtend: true,
    allowMedia: true,
    allowCustomerAcquisition: true,
    allowedDeliveryMethods: ["coupon_codes", "text_message_alerts", "mms_based_coupons", "mobile_app_based_coupons", "mobile_wallet_passes"],
    pricing: {
      monthlyFee: 0,
      textCostStart: 0.0079,
      monthlyTexts: 2500,
    },
  },
  SOAR_PLUS: {
    maxActiveOffers: 50,
    allowedOfferTypes: ["percentage", "dollar_amount", "bogo", "spend_threshold"],
    allowCountdown: true,
    allowFolders: true,
    allowNotifications: true,
    allowAutoExtend: true,
    allowMedia: true,
    allowCustomerAcquisition: true,
    allowedDeliveryMethods: ["coupon_codes", "text_message_alerts", "mms_based_coupons", "mobile_app_based_coupons", "mobile_wallet_passes"],
    pricing: {
      monthlyFee: 0,
      textCostStart: 0.0079,
      monthlyTexts: 7700,
    },
  },
  SOAR_PLATINUM: {
    maxActiveOffers: 100,
    allowedOfferTypes: ["percentage", "dollar_amount", "bogo", "spend_threshold"],
    allowCountdown: true,
    allowFolders: true,
    allowNotifications: true,
    allowAutoExtend: true,
    allowMedia: true,
    allowCustomerAcquisition: true,
    allowedDeliveryMethods: ["coupon_codes", "text_message_alerts", "mms_based_coupons", "mobile_app_based_coupons", "mobile_wallet_passes"],
    pricing: {
      monthlyFee: 0,
      textCostStart: 0.0079,
      monthlyTexts: 14000,
    },
  },
};

export interface TierValidationError {
  field: string;
  message: string;
  upgradeRequired: MembershipTier;
}

export function getTierCapabilities(tier: MembershipTier): TierCapabilities {
  return TIER_LIMITS[tier];
}

export function canAccessFeature(tier: MembershipTier, feature: keyof TierCapabilities): boolean {
  const capabilities = getTierCapabilities(tier);
  const value = capabilities[feature];
  
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'number') {
    return value > 0;
  }
  
  return false;
}

export function getMinimumTierForFeature(feature: keyof TierCapabilities): MembershipTier | null {
  const tiers: MembershipTier[] = ["NEST", "FREEBYRD", "GLIDE", "SOAR", "SOAR_PLUS", "SOAR_PLATINUM"];
  
  for (const tier of tiers) {
    if (canAccessFeature(tier, feature)) {
      return tier;
    }
  }
  
  return null;
}

export function getUpgradeMessage(currentTier: MembershipTier, requiredTier: MembershipTier, feature: string): string {
  const messages: Record<string, string> = {
    countdown: "Countdown timers create urgency and boost conversions!",
    folders: "Campaign folders help you stay organized with multiple offers.",
    notifications: "Get SMS alerts when your offers perform well.",
    autoExtend: "Auto-extend keeps successful offers running automatically.",
    media: "Product images and videos showcase your offerings better.",
    customerAcquisition: "Pay-per-click customer acquisition brings new customers to your business.",
    walletPasses: "Mobile wallet passes make redemption seamless for customers.",
  };
  
  const featureMessage = messages[feature] || "Unlock this premium feature";
  
  return `${featureMessage} Upgrade to ${requiredTier} to use this feature.`;
}
