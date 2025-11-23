import type { Offer } from "@shared/schema";

export function formatOfferDiscount(offer: Offer): string {
  // Handle legacy offers without offerType (fall back to discount field)
  if (!offer.offerType || offer.offerType === "percentage") {
    if (offer.offerType === "percentage" && offer.percentageOff) {
      return `${offer.percentageOff}% OFF`;
    }
    return offer.discount || "Special Offer";
  }

  switch (offer.offerType) {
    case "dollar_amount":
      return `$${offer.dollarOff} OFF`;
    case "bogo":
      return `Buy ${offer.buyQuantity} Get ${offer.getQuantity} at ${offer.bogoPercentageOff}% OFF`;
    case "spend_threshold":
      return `Spend $${offer.spendThreshold} Get $${offer.thresholdDiscount} OFF`;
    default:
      return offer.discount || "Special Offer";
  }
}

export function formatOfferDetails(offer: Offer): string {
  // Handle legacy offers without offerType
  if (!offer.offerType) {
    return offer.description;
  }

  switch (offer.offerType) {
    case "percentage":
      return `Get ${offer.percentageOff}% off on this item`;
    case "dollar_amount":
      return `Save $${offer.dollarOff} on this purchase`;
    case "bogo":
      return `Buy ${offer.buyQuantity} item${offer.buyQuantity! > 1 ? 's' : ''}, get ${offer.getQuantity} at ${offer.bogoPercentageOff}% off`;
    case "spend_threshold":
      return `Spend $${offer.spendThreshold} or more and get $${offer.thresholdDiscount} off your order`;
    default:
      return offer.description;
  }
}
