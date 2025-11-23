import { nanoid } from "nanoid";

/**
 * Generate a unique short referral code
 * Format: 8 characters using URL-safe characters
 * Example: a5B9xC2z
 */
export function generateReferralCode(): string {
  return nanoid(8);
}

/**
 * Generate a full referral URL for sharing
 * @param referralCode - The unique referral code
 * @param baseUrl - The base URL of the application (optional, uses REPLIT_DOMAINS if available)
 * @returns Full referral URL
 */
export function generateReferralUrl(referralCode: string, baseUrl?: string): string {
  // Use provided baseUrl or detect from Replit environment
  const domain = baseUrl || process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
  const protocol = domain.includes("localhost") ? "http" : "https";
  return `${protocol}://${domain}/r/${referralCode}`;
}

/**
 * Calculate points earned for a successful referral
 * @param offerType - Type of offer (percentage, dollar_amount, etc.)
 * @returns Points to award to referrer
 */
export function calculateReferralPoints(offerType: string): number {
  // Base points for any successful referral
  const basePoints = 10;
  
  // Bonus points for different offer types (future enhancement)
  // For now, all referrals earn the same points
  return basePoints;
}

/**
 * Validate a referral code format
 * @param code - The referral code to validate
 * @returns true if format is valid
 */
export function isValidReferralCode(code: string): boolean {
  // Must be exactly 8 characters, alphanumeric with URL-safe characters
  return /^[a-zA-Z0-9_-]{8}$/.test(code);
}
