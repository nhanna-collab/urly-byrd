import {
  users,
  offers,
  notifications,
  notificationPreferences,
  customers,
  merchantFollowers,
  smsUsage,
  smsNotifications,
  offerClaims,
  referrals,
  customerPoints,
  checkIns,
  merchantCustomers,
  campaignFolders,
  campaigns,
  campaignFolderMemberships,
  feedback,
  type User,
  type UpsertUser,
  type Offer,
  type InsertOffer,
  type Notification,
  type InsertNotification,
  type NotificationPreferences,
  type InsertNotificationPreferences,
  type Customer,
  type InsertCustomer,
  type MerchantFollower,
  type SmsUsage,
  type SmsNotification,
  type InsertSmsNotification,
  type OfferClaim,
  type InsertOfferClaim,
  type Referral,
  type InsertReferral,
  type CustomerPoints,
  type InsertCustomerPoints,
  type CheckIn,
  type InsertCheckIn,
  type MerchantCustomer,
  type InsertMerchantCustomer,
  type CustomerAcquisitionClick,
  type InsertCustomerAcquisitionClick,
  customerAcquisitionClicks,
  type CampaignFolder,
  type InsertCampaignFolder,
  type Campaign,
  type InsertCampaign,
  type CampaignFolderMembership,
  type InsertCampaignFolderMembership,
  type Feedback,
  type InsertFeedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, isNull, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  verifyUserEmail(userId: string): Promise<void>;
  
  createOffer(merchantId: string, offer: InsertOffer): Promise<Offer>;
  getOffer(id: string): Promise<Offer | undefined>;
  getOffersByMerchant(merchantId: string): Promise<Offer[]>;
  getAllActiveOffers(): Promise<Offer[]>;
  getMerchantsWithActiveOffers(): Promise<Array<{ id: string; businessName: string; businessCity: string; businessState: string; zipCode: string; activeOfferCount: number }>>;
  updateOffer(id: string, merchantId: string, offer: Partial<InsertOffer>): Promise<Offer | undefined>;
  deleteOffer(id: string, merchantId: string): Promise<boolean>;
  resurrectOffer(id: string, merchantId: string): Promise<boolean>;
  reintegrateOffer(id: string, merchantId: string): Promise<boolean>;
  permanentDeleteOffer(id: string, merchantId: string): Promise<boolean>;
  incrementOfferViews(id: string): Promise<void>;
  incrementUnitsSold(id: string, merchantId: string, quantity: number): Promise<Offer | undefined>;
  getExpiringOffers(hoursAhead: number): Promise<Offer[]>;
  getOffersToActivate(now: Date, intervalMinutes?: number): Promise<Offer[]>;
  getOffersToExpire(now: Date): Promise<Offer[]>;
  getUniqueMenuItemsByMerchant(merchantId: string): Promise<string[]>;
  
  createNotification(notification: Omit<InsertNotification, 'id' | 'createdAt'>): Promise<Notification>;
  getNotifications(merchantId: string): Promise<Notification[]>;
  markNotificationRead(id: string, merchantId: string): Promise<boolean>;
  
  // Customer operations
  createCustomer(customerData: Omit<InsertCustomer, 'id'>): Promise<Customer>;
  getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined>;
  getCustomer(id: string): Promise<Customer | undefined>;
  updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined>;
  updateCustomerProfile(id: string, profileData: { dateOfBirth?: Date | null; sex?: string | null }): Promise<Customer | undefined>;
  verifyCustomer(id: string): Promise<Customer | undefined>;
  
  // Merchant follower operations
  followMerchant(customerId: string, merchantId: string): Promise<MerchantFollower>;
  unfollowMerchant(customerId: string, merchantId: string): Promise<boolean>;
  isFollowing(customerId: string, merchantId: string): Promise<boolean>;
  getCustomerFollowing(customerId: string): Promise<string[]>; // Returns merchant IDs
  getMerchantFollowers(merchantId: string): Promise<Customer[]>;
  getMerchantFollowerCount(merchantId: string): Promise<number>;
  
  // SMS usage tracking
  getOrCreateSmsUsage(merchantId: string, month: string): Promise<SmsUsage>;
  incrementSmsUsage(merchantId: string, count: number): Promise<SmsUsage>;
  getSmsUsage(merchantId: string, month: string): Promise<SmsUsage | undefined>;
  
  // SMS notifications log
  logSmsNotification(data: Omit<InsertSmsNotification, 'id' | 'createdAt'>): Promise<SmsNotification>;
  updateSmsNotificationStatus(id: string, status: string, twilioSid?: string): Promise<void>;
  
  // Offer claims
  createOfferClaim(claimData: Omit<InsertOfferClaim, 'id'> & { viewedAt?: Date }): Promise<OfferClaim>;
  getOfferClaim(id: string): Promise<OfferClaim | undefined>;
  getOfferClaimByPhone(offerId: string, phoneNumber: string): Promise<OfferClaim | undefined>;
  verifyOfferClaim(id: string, code: string): Promise<OfferClaim | undefined>;
  markClaimCouponSent(id: string): Promise<void>;
  getOfferClaimStats(offerId: string): Promise<{ totalClaims: number; avgResponseTimeMinutes: number | null; avgConsiderationTimeMinutes: number | null }>;
  
  // Referral operations
  createReferral(referralData: Omit<InsertReferral, 'id'> & { viewedAt?: Date }): Promise<Referral>;
  getReferralByCode(referralCode: string): Promise<Referral | undefined>;
  getReferralsByPhone(phoneNumber: string): Promise<Referral[]>;
  updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined>;
  markReferralClaimed(referralCode: string, friendPhone: string, claimId: string, pointsEarned: number): Promise<Referral | undefined>;
  
  // Customer points operations
  getOrCreateCustomerPoints(phoneNumber: string): Promise<CustomerPoints>;
  updateCustomerPoints(phoneNumber: string, pointsToAdd: number): Promise<CustomerPoints>;
  getCustomerPoints(phoneNumber: string): Promise<CustomerPoints | undefined>;
  
  // Check-in operations
  createCheckIn(checkInData: Omit<InsertCheckIn, 'id' | 'createdAt'>): Promise<CheckIn>;
  getLastCheckIn(customerPhone: string): Promise<CheckIn | undefined>;
  canCheckIn(customerPhone: string): Promise<{ canCheckIn: boolean; minutesRemaining: number | null }>;
  
  // Merchant customer operations (imported customer lists)
  createMerchantCustomer(merchantId: string, customerData: Omit<InsertMerchantCustomer, 'merchantId'>): Promise<MerchantCustomer>;
  bulkCreateMerchantCustomers(merchantId: string, customersData: Omit<InsertMerchantCustomer, 'merchantId'>[]): Promise<MerchantCustomer[]>;
  getMerchantCustomers(merchantId: string): Promise<MerchantCustomer[]>;
  getMerchantCustomer(id: string, merchantId: string): Promise<MerchantCustomer | undefined>;
  updateMerchantCustomer(id: string, merchantId: string, customerData: Partial<InsertMerchantCustomer>): Promise<MerchantCustomer | undefined>;
  deleteMerchantCustomer(id: string, merchantId: string): Promise<boolean>;
  getMerchantCustomerStats(merchantId: string): Promise<{ total: number; withEmail: number; withZip: number; lastImportDate: Date | null }>;
  
  // Dashboard stats
  getDashboardStats(merchantId: string): Promise<{ totalClicks: number; totalViews: number; clickThroughRate: number; totalCustomers: number }>;
  
  // Bank management operations
  addMerchantBankFunds(merchantId: string, amountInCents: number): Promise<User | undefined>;
  getCustomerAcquisitionClicks(merchantId: string): Promise<CustomerAcquisitionClick[]>;
  
  // Campaign folders
  getCampaignFolders(merchantId: string, status?: string): Promise<CampaignFolder[]>;
  getCampaignFolderById(folderId: string, merchantId: string): Promise<CampaignFolder | null>;
  createCampaignFolder(merchantId: string, name: string): Promise<CampaignFolder>;
  deleteCampaignFolder(folderId: string, merchantId: string): Promise<boolean>;
  promoteFolderToCampaign(folderId: string): Promise<void>;
  
  // Campaigns
  getCampaigns(merchantId: string): Promise<Campaign[]>;
  createCampaign(merchantId: string, campaignData: Omit<InsertCampaign, 'merchantId'>): Promise<Campaign>;
  addFolderToCampaign(campaignId: string, folderId: string): Promise<void>;
  getCampaignFolderMemberships(campaignId: string): Promise<CampaignFolderMembership[]>;
  
  // Feedback operations
  createFeedback(feedbackData: { userId: string; page: string; message: string }): Promise<any>;
  getAllFeedback(): Promise<any[]>;
  
  // Analytics & reporting
  getMerchantAnalytics(merchantId: string): Promise<{
    overview: {
      totalOffers: number;
      activeOffers: number;
      expiredOffers: number;
      draftOffers: number;
      totalViews: number;
      totalClaims: number;
      totalShares: number;
      conversionRate: number;
      avgResponseTimeMinutes: number | null;
      avgConsiderationTimeMinutes: number | null;
    };
    topOffers: Array<{
      id: string;
      title: string;
      views: number;
      claims: number;
      shares: number;
      conversionRate: number;
    }>;
    customerAcquisition: {
      totalClicks: number;
      totalSpent: number;
      avgCostPerClick: number;
    };
    recentActivity: Array<{
      type: 'claim' | 'share';
      offerId: string;
      offerTitle: string;
      timestamp: Date;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async updateUser(userId: string, userData: Partial<UpsertUser>): Promise<void> {
    await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateOnboardingProgress(userId: string, progress: Record<string, boolean>): Promise<void> {
    await db
      .update(users)
      .set({
        onboardingProgress: progress,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Try to find existing user by email first
    if (userData.email) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUser) {
        // Update existing user
        const [updatedUser] = await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updatedUser;
      }
    }
    
    // Insert new user (handle id conflict if needed)
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createOffer(merchantId: string, offerData: InsertOffer): Promise<Offer> {
    const [offer] = await db
      .insert(offers)
      .values({
        ...offerData,
        merchantId,
      })
      .returning();
    return offer;
  }

  async getOffer(id: string): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer;
  }

  async getOffersByMerchant(merchantId: string): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(eq(offers.merchantId, merchantId))
      .orderBy(desc(offers.createdAt));
  }

  async getUniqueMenuItemsByMerchant(merchantId: string): Promise<string[]> {
    const results = await db
      .selectDistinct({ menuItem: offers.menuItem })
      .from(offers)
      .where(eq(offers.merchantId, merchantId));
    
    const uniqueItems = results
      .map(r => r.menuItem)
      .filter((item): item is string => !!item && item.trim().length > 0)
      .map(item => item.trim());
    
    const caseInsensitiveUnique = Array.from(
      new Map(uniqueItems.map(item => [item.toLowerCase(), item])).values()
    ).sort();
    
    return caseInsensitiveUnique;
  }

  async getAllActiveOffers(): Promise<Offer[]> {
    const now = new Date();
    return await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.status, "active"),
          gte(offers.endDate, now)
        )
      )
      .orderBy(offers.endDate);
  }

  async getMerchantsWithActiveOffers(): Promise<Array<{ id: string; businessName: string; businessCity: string; businessState: string; zipCode: string; activeOfferCount: number }>> {
    const now = new Date();
    const result = await db
      .select({
        id: users.id,
        businessName: users.businessName,
        businessCity: users.businessCity,
        businessState: users.businessState,
        zipCode: users.zipCode,
        activeOfferCount: sql<number>`COUNT(${offers.id})::int`,
      })
      .from(users)
      .innerJoin(offers, eq(offers.merchantId, users.id))
      .where(
        and(
          eq(offers.status, "active"),
          gte(offers.endDate, now)
        )
      )
      .groupBy(users.id, users.businessName, users.businessCity, users.businessState, users.zipCode)
      .orderBy(users.businessName);
    
    return result;
  }

  // Private helper to check if an offer is in a locked campaign folder
  // Returns the offer if found and not locked, or null if not found
  // Throws error only if offer is in a locked folder
  private async checkOfferNotInLockedFolder(offerId: string): Promise<Offer | null> {
    const offer = await this.getOffer(offerId);
    if (!offer) {
      return null; // Offer not found - let caller handle this
    }
    
    if (offer.campaignFolder) {
      const folder = await db
        .select()
        .from(campaignFolders)
        .where(eq(campaignFolders.id, offer.campaignFolder))
        .limit(1);
      
      if (folder[0]?.isLocked) {
        throw new Error('Cannot modify offers in locked campaign folders. Campaign data is protected to maintain analytics integrity.');
      }
    }
    
    return offer;
  }

  async updateOffer(
    id: string,
    merchantId: string,
    offerData: Partial<InsertOffer>
  ): Promise<Offer | undefined> {
    // Check if offer is in a locked folder (throws if locked, returns null if not found)
    const existingOffer = await this.checkOfferNotInLockedFolder(id);
    if (!existingOffer) {
      return undefined; // Offer not found
    }
    
    // Prevent activation of offers that need reintegration
    if (offerData.status === 'active' && existingOffer.needsReintegration) {
      throw new Error('Cannot activate offer that needs reintegration');
    }
    
    const [offer] = await db
      .update(offers)
      .set(offerData)
      .where(and(eq(offers.id, id), eq(offers.merchantId, merchantId)))
      .returning();
    return offer;
  }

  async deleteOffer(id: string, merchantId: string): Promise<boolean> {
    // Check if offer is in a locked folder (throws if locked, returns null if not found)
    const offer = await this.checkOfferNotInLockedFolder(id);
    if (!offer) {
      return false; // Offer not found
    }
    
    const result = await db
      .update(offers)
      .set({ isDeleted: true })
      .where(and(eq(offers.id, id), eq(offers.merchantId, merchantId)))
      .returning();
    return result.length > 0;
  }

  async resurrectOffer(id: string, merchantId: string): Promise<boolean> {
    // Check if offer is in a locked folder (throws if locked, returns null if not found)
    const offer = await this.checkOfferNotInLockedFolder(id);
    if (!offer) {
      return false; // Offer not found
    }
    
    const result = await db
      .update(offers)
      .set({ 
        isDeleted: false, 
        status: 'draft',
        needsReintegration: true 
      })
      .where(and(eq(offers.id, id), eq(offers.merchantId, merchantId)))
      .returning();
    return result.length > 0;
  }

  async reintegrateOffer(id: string, merchantId: string): Promise<boolean> {
    // Check if offer is in a locked folder (throws if locked, returns null if not found)
    const offer = await this.checkOfferNotInLockedFolder(id);
    if (!offer) {
      return false; // Offer not found
    }
    
    const result = await db
      .update(offers)
      .set({ needsReintegration: false })
      .where(and(eq(offers.id, id), eq(offers.merchantId, merchantId)))
      .returning();
    return result.length > 0;
  }

  async permanentDeleteOffer(id: string, merchantId: string): Promise<boolean> {
    // Check if offer is in a locked folder (throws if locked, returns null if not found)
    const offer = await this.checkOfferNotInLockedFolder(id);
    if (!offer) {
      return false; // Offer not found
    }
    
    const result = await db
      .delete(offers)
      .where(and(eq(offers.id, id), eq(offers.merchantId, merchantId)))
      .returning();
    return result.length > 0;
  }

  async incrementOfferViews(id: string): Promise<void> {
    await db.execute(
      sql`UPDATE offers SET views = CAST(COALESCE(views, '0') AS INTEGER) + 1 WHERE id = ${id}`
    );
  }

  async incrementUnitsSold(id: string, merchantId: string, quantity: number = 1): Promise<Offer | undefined> {
    const [offer] = await db
      .update(offers)
      .set({ unitsSold: sql`${offers.unitsSold} + ${quantity}` })
      .where(and(eq(offers.id, id), eq(offers.merchantId, merchantId)))
      .returning();
    return offer;
  }

  async getExpiringOffers(hoursAhead: number = 1): Promise<Offer[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.status, "active"),
          gte(offers.endDate, now),
          lte(offers.endDate, futureTime)
        )
      );
  }

  async getOffersToActivate(now: Date, intervalMinutes: number = 15): Promise<Offer[]> {
    // Only return offers whose startDate falls within the last interval
    // This ensures we only notify once when transitioning from Future → Current
    // Includes both 'draft' and 'active' status offers (draft gets promoted to active during activation)
    const intervalStart = new Date(now.getTime() - intervalMinutes * 60 * 1000);
    
    return await db
      .select()
      .from(offers)
      .where(
        and(
          inArray(offers.status, ["draft", "active"]), // Include both draft and active offers
          eq(offers.isDeleted, false),
          eq(offers.needsReintegration, false),
          isNull(offers.activatedAt),           // Never activated before (ensures one-time notification)
          gte(offers.startDate, intervalStart), // startDate >= intervalStart
          lte(offers.startDate, now),           // startDate <= now
          gte(offers.endDate, now)              // endDate >= now (still active)
        )
      );
  }

  async getOffersToExpire(now: Date): Promise<Offer[]> {
    return await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.status, "active"),
          eq(offers.isDeleted, false),
          eq(offers.needsReintegration, false), // Exclude reintegration-required offers
          lte(offers.endDate, now)
        )
      );
  }

  async createNotification(notificationData: Omit<InsertNotification, 'id' | 'createdAt'>): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getNotifications(merchantId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.merchantId, merchantId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string, merchantId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.merchantId, merchantId)))
      .returning();
    return result.length > 0;
  }

  async getNotificationPreferences(merchantId: string): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.merchantId, merchantId));
    return prefs;
  }

  async createNotificationPreferences(merchantId: string, prefsData: InsertNotificationPreferences): Promise<NotificationPreferences> {
    const [prefs] = await db
      .insert(notificationPreferences)
      .values({ ...prefsData, merchantId })
      .returning();
    return prefs;
  }

  async updateNotificationPreferences(merchantId: string, prefsData: Partial<InsertNotificationPreferences>): Promise<NotificationPreferences | undefined> {
    const [prefs] = await db
      .update(notificationPreferences)
      .set({ ...prefsData, updatedAt: new Date() })
      .where(eq(notificationPreferences.merchantId, merchantId))
      .returning();
    return prefs;
  }

  async getOrCreateNotificationPreferences(merchantId: string): Promise<NotificationPreferences> {
    let prefs = await this.getNotificationPreferences(merchantId);
    if (!prefs) {
      prefs = await this.createNotificationPreferences(merchantId, {});
    }
    return prefs;
  }

  // Customer operations
  async createCustomer(customerData: Omit<InsertCustomer, 'id'>): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async getCustomerByPhone(phoneNumber: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phoneNumber, phoneNumber));
    return customer;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async updateCustomerProfile(id: string, profileData: { dateOfBirth?: Date | null; sex?: string | null }): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ 
        dateOfBirth: profileData.dateOfBirth,
        sex: profileData.sex,
        updatedAt: new Date() 
      })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async verifyCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ 
        verified: true, 
        verificationCode: null,
        verificationExpiry: null,
        updatedAt: new Date() 
      })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  // Merchant follower operations
  async followMerchant(customerId: string, merchantId: string): Promise<MerchantFollower> {
    const [follower] = await db
      .insert(merchantFollowers)
      .values({ customerId, merchantId })
      .onConflictDoNothing()
      .returning();
    return follower;
  }

  async unfollowMerchant(customerId: string, merchantId: string): Promise<boolean> {
    const result = await db
      .delete(merchantFollowers)
      .where(
        and(
          eq(merchantFollowers.customerId, customerId),
          eq(merchantFollowers.merchantId, merchantId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async isFollowing(customerId: string, merchantId: string): Promise<boolean> {
    const [follower] = await db
      .select()
      .from(merchantFollowers)
      .where(
        and(
          eq(merchantFollowers.customerId, customerId),
          eq(merchantFollowers.merchantId, merchantId)
        )
      );
    return !!follower;
  }

  async getCustomerFollowing(customerId: string): Promise<string[]> {
    const following = await db
      .select({ merchantId: merchantFollowers.merchantId })
      .from(merchantFollowers)
      .where(eq(merchantFollowers.customerId, customerId));
    return following.map(f => f.merchantId);
  }

  async getMerchantFollowers(merchantId: string): Promise<Customer[]> {
    const result = await db
      .select({
        customer: customers,
      })
      .from(merchantFollowers)
      .innerJoin(customers, eq(merchantFollowers.customerId, customers.id))
      .where(eq(merchantFollowers.merchantId, merchantId));
    return result.map(r => r.customer);
  }

  async getMerchantFollowerCount(merchantId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(merchantFollowers)
      .where(eq(merchantFollowers.merchantId, merchantId));
    return result[0]?.count || 0;
  }

  // SMS usage tracking
  async getOrCreateSmsUsage(merchantId: string, month: string): Promise<SmsUsage> {
    const [existing] = await db
      .select()
      .from(smsUsage)
      .where(
        and(
          eq(smsUsage.merchantId, merchantId),
          eq(smsUsage.month, month)
        )
      );

    if (existing) {
      return existing;
    }

    const [newUsage] = await db
      .insert(smsUsage)
      .values({
        merchantId,
        month,
        textsSent: 0,
        includedTexts: 100,
        overageTexts: 0,
        subscriptionFee: 499,
        overageFee: 0,
        totalFee: 499,
      })
      .returning();
    return newUsage;
  }

  async incrementSmsUsage(merchantId: string, count: number): Promise<SmsUsage> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get merchant to check tier and free trial status
    const merchant = await this.getUser(merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const oldLifetimeTextsSent = merchant.lifetimeTextsSent;
    const newLifetimeTextsSent = oldLifetimeTextsSent + count;
    
    // Update merchant's lifetime texts
    await db
      .update(users)
      .set({
        lifetimeTextsSent: newLifetimeTextsSent,
        freeTrialUsed: newLifetimeTextsSent >= 100,
        updatedAt: new Date(),
      })
      .where(eq(users.id, merchantId));

    const usage = await this.getOrCreateSmsUsage(merchantId, month);
    
    // Initialize pricing breakdown array from existing or create new
    const pricingBreakdown = (usage.pricingBreakdown as any[]) || [];
    
    // Calculate cost based on tier and lifetime usage
    let totalCostCents = 0;
    let remainingCount = count;
    let currentLifetime = oldLifetimeTextsSent;
    
    // Free trial: first 100 lifetime texts are free
    if (currentLifetime < 100) {
      const freeTexts = Math.min(remainingCount, 100 - currentLifetime);
      pricingBreakdown.push({
        from: currentLifetime + 1,
        to: currentLifetime + freeTexts,
        rateCents: 0,
        count: freeTexts,
        amountCents: 0,
        tier: 'FREE_TRIAL'
      });
      remainingCount -= freeTexts;
      currentLifetime += freeTexts;
    }
    
    // FREEBYRD tier: tiered pricing based on lifetime usage
    if (merchant.membershipTier === 'FREEBYRD' && remainingCount > 0) {
      // Texts 101-3000: 2.1 cents each
      if (currentLifetime < 3000) {
        const bandATexts = Math.min(remainingCount, 3000 - currentLifetime);
        const bandACost = Math.round(bandATexts * 2.1);
        pricingBreakdown.push({
          from: currentLifetime + 1,
          to: currentLifetime + bandATexts,
          rateCents: 2.1,
          count: bandATexts,
          amountCents: bandACost,
          tier: 'FREEBYRD'
        });
        totalCostCents += bandACost;
        remainingCount -= bandATexts;
        currentLifetime += bandATexts;
      }
      
      // Texts 3001+: 1.3 cents each
      if (remainingCount > 0) {
        const bandBCost = Math.round(remainingCount * 1.3);
        pricingBreakdown.push({
          from: currentLifetime + 1,
          to: currentLifetime + remainingCount,
          rateCents: 1.3,
          count: remainingCount,
          amountCents: bandBCost,
          tier: 'FREEBYRD'
        });
        totalCostCents += bandBCost;
        remainingCount = 0;
      }
    }
    // Other tiers: use monthly allocations and tier rates
    else if (remainingCount > 0) {
      // For non-FREEBYRD tiers, charge based on tier rate after free trial
      // This is simplified - you may want to implement monthly allocations for GLIDE, SOAR, etc.
      const rateCents = 0.79; // Default Twilio rate for other tiers
      const cost = Math.round(remainingCount * rateCents);
      pricingBreakdown.push({
        from: currentLifetime + 1,
        to: currentLifetime + remainingCount,
        rateCents: rateCents,
        count: remainingCount,
        amountCents: cost,
        tier: merchant.membershipTier
      });
      totalCostCents += cost;
      remainingCount = 0;
    }

    const newTextsSent = usage.textsSent + count;
    const newTotalFee = (usage.totalFee || 0) + totalCostCents;

    const [updated] = await db
      .update(smsUsage)
      .set({
        textsSent: newTextsSent,
        totalFee: newTotalFee,
        overageFee: totalCostCents, // Store incremental cost in overageFee for now
        billingTier: merchant.membershipTier,
        pricingBreakdown: pricingBreakdown,
        updatedAt: new Date(),
      })
      .where(eq(smsUsage.id, usage.id))
      .returning();
    return updated;
  }

  async getSmsUsage(merchantId: string, month: string): Promise<SmsUsage | undefined> {
    const [usage] = await db
      .select()
      .from(smsUsage)
      .where(
        and(
          eq(smsUsage.merchantId, merchantId),
          eq(smsUsage.month, month)
        )
      );
    return usage;
  }

  async checkSmsBudget(merchantId: string, count: number = 1): Promise<{
    allowed: boolean;
    remaining: number;
    monthlyLimit: number;
    currentUsage: number;
    costPerText: number;
    totalCost: number;
    tierName: string;
  }> {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Get merchant tier
    const merchant = await this.getUser(merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Get tier limits from shared constants
    const { getTierCapabilities } = await import('../shared/tierLimits.js');
    const tierCaps = getTierCapabilities(merchant.membershipTier as any);
    
    // Get current usage
    const usage = await this.getOrCreateSmsUsage(merchantId, month);
    const currentMonthlyUsage = usage.textsSent;
    
    // Calculate limits and costs based on tier
    let monthlyLimit = 0;
    let costPerText = 0;
    
    if (merchant.membershipTier === 'NEST') {
      // NEST tier has no SMS capability
      return {
        allowed: false,
        remaining: 0,
        monthlyLimit: 0,
        currentUsage: currentMonthlyUsage,
        costPerText: 0,
        totalCost: 0,
        tierName: merchant.membershipTier,
      };
    } else if (merchant.membershipTier === 'FREEBYRD') {
      // FREEBYRD has unlimited texts but pays per text
      // Check lifetime usage to determine rate
      if (merchant.lifetimeTextsSent < 3000) {
        costPerText = 2.1; // 2.1 cents
      } else {
        costPerText = 1.3; // 1.3 cents
      }
      
      // No hard limit for FREEBYRD, but warn about costs
      return {
        allowed: true,
        remaining: 999999,
        monthlyLimit: 999999,
        currentUsage: currentMonthlyUsage,
        costPerText: costPerText,
        totalCost: count * costPerText,
        tierName: merchant.membershipTier,
      };
    } else {
      // GLIDE, SOAR, SOAR_PLUS, SOAR_PLATINUM have monthly allocations
      monthlyLimit = tierCaps.pricing.monthlyTexts || 0;
      costPerText = tierCaps.pricing.textCostStart;
      
      const remaining = monthlyLimit - currentMonthlyUsage;
      
      return {
        allowed: remaining >= count,
        remaining: Math.max(0, remaining),
        monthlyLimit: monthlyLimit,
        currentUsage: currentMonthlyUsage,
        costPerText: costPerText,
        totalCost: count * costPerText,
        tierName: merchant.membershipTier,
      };
    }
  }

  // SMS notifications log
  async logSmsNotification(data: Omit<InsertSmsNotification, 'id' | 'createdAt'>): Promise<SmsNotification> {
    const [notification] = await db
      .insert(smsNotifications)
      .values(data)
      .returning();
    return notification;
  }

  async updateSmsNotificationStatus(id: string, status: string, twilioSid?: string): Promise<void> {
    await db
      .update(smsNotifications)
      .set({ 
        status, 
        twilioMessageSid: twilioSid,
        sentAt: status === 'sent' ? new Date() : undefined,
      })
      .where(eq(smsNotifications.id, id));
  }

  // Offer claims
  async createOfferClaim(claimData: Omit<InsertOfferClaim, 'id'> & { viewedAt?: Date }): Promise<OfferClaim> {
    const [claim] = await db
      .insert(offerClaims)
      .values(claimData)
      .returning();
    return claim;
  }

  async getOfferClaim(id: string): Promise<OfferClaim | undefined> {
    const [claim] = await db
      .select()
      .from(offerClaims)
      .where(eq(offerClaims.id, id));
    return claim;
  }

  async getOfferClaimByPhone(offerId: string, phoneNumber: string): Promise<OfferClaim | undefined> {
    const [claim] = await db
      .select()
      .from(offerClaims)
      .where(
        and(
          eq(offerClaims.offerId, offerId),
          eq(offerClaims.customerPhone, phoneNumber)
        )
      )
      .orderBy(desc(offerClaims.claimedAt))
      .limit(1);
    return claim;
  }

  async verifyOfferClaim(id: string, code: string): Promise<OfferClaim | undefined> {
    const claim = await this.getOfferClaim(id);
    if (!claim) return undefined;

    // Single-use enforcement: prevent code reuse
    if (claim.status === 'verified') return undefined;

    // Check if code matches and hasn't expired
    if (claim.verificationCode !== code) return undefined;
    if (new Date() > claim.verificationExpiry) return undefined;

    // Mark as verified
    const [verifiedClaim] = await db
      .update(offerClaims)
      .set({
        status: 'verified',
        verifiedAt: new Date(),
      })
      .where(eq(offerClaims.id, id))
      .returning();
    
    return verifiedClaim;
  }

  async markClaimCouponSent(id: string): Promise<void> {
    await db
      .update(offerClaims)
      .set({
        couponSentAt: new Date(),
      })
      .where(eq(offerClaims.id, id));
  }

  async getOfferClaimStats(offerId: string): Promise<{ 
    totalClaims: number; 
    avgResponseTimeMinutes: number | null;
    avgConsiderationTimeMinutes: number | null;
  }> {
    const claims = await db
      .select()
      .from(offerClaims)
      .where(eq(offerClaims.offerId, offerId));

    const shares = await db
      .select()
      .from(referrals)
      .where(eq(referrals.offerId, offerId));

    const totalClaims = claims.length;
    
    // Calculate average response time from coupon sent to claimed
    const responseTimes: number[] = [];
    for (const claim of claims) {
      if (claim.couponSentAt && claim.claimedAt) {
        const sent = new Date(claim.couponSentAt).getTime();
        const clicked = new Date(claim.claimedAt).getTime();
        const timeMinutes = (clicked - sent) / (1000 * 60);
        if (timeMinutes >= 0) {
          responseTimes.push(timeMinutes);
        }
      }
    }

    const avgResponseTimeMinutes = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : null;

    // Calculate average consideration time (time from viewing to action)
    const considerationTimes: number[] = [];
    
    // From redeems (viewedAt to claimedAt)
    for (const claim of claims) {
      if (claim.viewedAt && claim.claimedAt) {
        const viewed = new Date(claim.viewedAt).getTime();
        const acted = new Date(claim.claimedAt).getTime();
        const timeMinutes = (acted - viewed) / (1000 * 60);
        if (timeMinutes >= 0) {
          considerationTimes.push(timeMinutes);
        }
      }
    }
    
    // From shares (viewedAt to createdAt)
    for (const share of shares) {
      if (share.viewedAt && share.createdAt) {
        const viewed = new Date(share.viewedAt).getTime();
        const acted = new Date(share.createdAt).getTime();
        const timeMinutes = (acted - viewed) / (1000 * 60);
        if (timeMinutes >= 0) {
          considerationTimes.push(timeMinutes);
        }
      }
    }

    const avgConsiderationTimeMinutes = considerationTimes.length > 0
      ? considerationTimes.reduce((sum, time) => sum + time, 0) / considerationTimes.length
      : null;

    return { totalClaims, avgResponseTimeMinutes, avgConsiderationTimeMinutes };
  }

  // Referral operations
  async createReferral(referralData: Omit<InsertReferral, 'id'> & { viewedAt?: Date }): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values(referralData)
      .returning();
    return referral;
  }

  async getReferralByCode(referralCode: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, referralCode));
    return referral;
  }

  async getReferralsByPhone(phoneNumber: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerPhone, phoneNumber))
      .orderBy(desc(referrals.createdAt));
  }

  async updateReferral(id: string, data: Partial<Referral>): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set(data)
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async markReferralClaimed(
    referralCode: string,
    friendPhone: string,
    claimId: string,
    pointsEarned: number
  ): Promise<Referral | undefined> {
    const [updated] = await db
      .update(referrals)
      .set({
        status: 'claimed',
        friendPhone,
        claimId,
        pointsEarned,
        claimedAt: new Date(),
      })
      .where(eq(referrals.referralCode, referralCode))
      .returning();
    return updated;
  }

  // Customer points operations
  async getOrCreateCustomerPoints(phoneNumber: string): Promise<CustomerPoints> {
    const existing = await this.getCustomerPoints(phoneNumber);
    if (existing) return existing;

    const [points] = await db
      .insert(customerPoints)
      .values({
        phoneNumber,
        totalPoints: 0,
      })
      .returning();
    return points;
  }

  async updateCustomerPoints(phoneNumber: string, pointsToAdd: number): Promise<CustomerPoints> {
    const existing = await this.getOrCreateCustomerPoints(phoneNumber);
    
    const [updated] = await db
      .update(customerPoints)
      .set({
        totalPoints: existing.totalPoints + pointsToAdd,
        updatedAt: new Date(),
      })
      .where(eq(customerPoints.phoneNumber, phoneNumber))
      .returning();
    return updated;
  }

  async getCustomerPoints(phoneNumber: string): Promise<CustomerPoints | undefined> {
    const [points] = await db
      .select()
      .from(customerPoints)
      .where(eq(customerPoints.phoneNumber, phoneNumber));
    return points;
  }

  // Check-in operations
  async createCheckIn(checkInData: Omit<InsertCheckIn, 'id' | 'createdAt'>): Promise<CheckIn> {
    const [checkIn] = await db
      .insert(checkIns)
      .values(checkInData)
      .returning();
    return checkIn;
  }

  async getLastCheckIn(customerPhone: string): Promise<CheckIn | undefined> {
    const [checkIn] = await db
      .select()
      .from(checkIns)
      .where(eq(checkIns.customerPhone, customerPhone))
      .orderBy(desc(checkIns.occurredAt))
      .limit(1);
    return checkIn;
  }

  async canCheckIn(customerPhone: string): Promise<{ canCheckIn: boolean; minutesRemaining: number | null }> {
    const lastCheckIn = await this.getLastCheckIn(customerPhone);
    
    if (!lastCheckIn) {
      return { canCheckIn: true, minutesRemaining: null };
    }

    const now = new Date();
    const lastCheckInTime = new Date(lastCheckIn.occurredAt);
    const minutesSinceLastCheckIn = (now.getTime() - lastCheckInTime.getTime()) / (1000 * 60);
    
    const MIN_MINUTES_BETWEEN_CHECKINS = 120; // 2 hours
    const canCheckIn = minutesSinceLastCheckIn >= MIN_MINUTES_BETWEEN_CHECKINS;
    const minutesRemaining = canCheckIn ? null : Math.ceil(MIN_MINUTES_BETWEEN_CHECKINS - minutesSinceLastCheckIn);
    
    return { canCheckIn, minutesRemaining };
  }

  // Merchant customer operations (imported customer lists)
  async createMerchantCustomer(merchantId: string, customerData: Omit<InsertMerchantCustomer, 'merchantId'>): Promise<MerchantCustomer> {
    const [customer] = await db
      .insert(merchantCustomers)
      .values({
        ...customerData,
        merchantId,
      })
      .returning();
    return customer;
  }

  async bulkCreateMerchantCustomers(merchantId: string, customersData: Omit<InsertMerchantCustomer, 'merchantId'>[]): Promise<MerchantCustomer[]> {
    if (customersData.length === 0) return [];
    
    const customers = await db
      .insert(merchantCustomers)
      .values(
        customersData.map(data => ({
          ...data,
          merchantId,
        }))
      )
      .returning();
    return customers;
  }

  async getMerchantCustomers(merchantId: string): Promise<MerchantCustomer[]> {
    const customers = await db
      .select()
      .from(merchantCustomers)
      .where(eq(merchantCustomers.merchantId, merchantId))
      .orderBy(desc(merchantCustomers.createdAt));
    return customers;
  }

  async getMerchantCustomer(id: string, merchantId: string): Promise<MerchantCustomer | undefined> {
    const [customer] = await db
      .select()
      .from(merchantCustomers)
      .where(
        and(
          eq(merchantCustomers.id, id),
          eq(merchantCustomers.merchantId, merchantId)
        )
      );
    return customer;
  }

  async updateMerchantCustomer(id: string, merchantId: string, customerData: Partial<InsertMerchantCustomer>): Promise<MerchantCustomer | undefined> {
    const [updated] = await db
      .update(merchantCustomers)
      .set({
        ...customerData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(merchantCustomers.id, id),
          eq(merchantCustomers.merchantId, merchantId)
        )
      )
      .returning();
    return updated;
  }

  async deleteMerchantCustomer(id: string, merchantId: string): Promise<boolean> {
    const result = await db
      .delete(merchantCustomers)
      .where(
        and(
          eq(merchantCustomers.id, id),
          eq(merchantCustomers.merchantId, merchantId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMerchantCustomerStats(merchantId: string): Promise<{ total: number; withEmail: number; withZip: number; lastImportDate: Date | null }> {
    const customers = await this.getMerchantCustomers(merchantId);
    
    return {
      total: customers.length,
      withEmail: customers.filter(c => c.email).length,
      withZip: customers.filter(c => c.zipCode).length,
      lastImportDate: customers.length > 0 ? customers[0].createdAt : null,
    };
  }

  // Dashboard stats
  async getDashboardStats(merchantId: string): Promise<{ totalClicks: number; totalViews: number; clickThroughRate: number; totalCustomers: number }> {
    // Get all merchant's offers
    const merchantOffers = await this.getOffersByMerchant(merchantId);
    
    // Calculate total views
    const totalViews = merchantOffers.reduce((sum, offer) => sum + parseInt(offer.views || "0"), 0);
    
    // Get offer IDs for claims lookup
    const offerIds = merchantOffers.map(o => o.id);
    
    // Count total claims (clicks) across all merchant offers
    let totalClicks = 0;
    if (offerIds.length > 0) {
      const claims = await db
        .select()
        .from(offerClaims)
        .where(inArray(offerClaims.offerId, offerIds));
      totalClicks = claims.length;
    }
    
    // Calculate click-through rate (avoid division by zero)
    const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    
    // Get total customer count
    const customerStats = await this.getMerchantCustomerStats(merchantId);
    const totalCustomers = customerStats.total;
    
    return {
      totalClicks,
      totalViews,
      clickThroughRate,
      totalCustomers,
    };
  }

  // Bank management operations
  
  async addMerchantBankFunds(merchantId: string, amountInCents: number): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        merchantBank: sql`${users.merchantBank} + ${amountInCents}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, merchantId))
      .returning();
    return updatedUser;
  }

  async getCustomerAcquisitionClicks(merchantId: string): Promise<CustomerAcquisitionClick[]> {
    return await db
      .select()
      .from(customerAcquisitionClicks)
      .where(eq(customerAcquisitionClicks.merchantId, merchantId))
      .orderBy(desc(customerAcquisitionClicks.createdAt));
  }

  // Campaign folder operations
  
  async getCampaignFolders(merchantId: string, status?: string): Promise<CampaignFolder[]> {
    const conditions = [eq(campaignFolders.merchantId, merchantId)];
    if (status) {
      conditions.push(eq(campaignFolders.status, status));
    }
    
    return await db
      .select()
      .from(campaignFolders)
      .where(and(...conditions))
      .orderBy(desc(campaignFolders.createdAt));
  }

  async getCampaignFolderById(folderId: string, merchantId: string): Promise<CampaignFolder | null> {
    const [folder] = await db
      .select()
      .from(campaignFolders)
      .where(
        and(
          eq(campaignFolders.id, folderId),
          eq(campaignFolders.merchantId, merchantId)
        )
      );
    return folder || null;
  }

  async createCampaignFolder(merchantId: string, name: string, description?: string): Promise<CampaignFolder> {
    const [folder] = await db
      .insert(campaignFolders)
      .values({
        merchantId,
        name,
        description: description || null,
      })
      .returning();
    return folder;
  }

  async deleteCampaignFolder(folderId: string, merchantId: string): Promise<boolean> {
    const result = await db
      .delete(campaignFolders)
      .where(
        and(
          eq(campaignFolders.id, folderId),
          eq(campaignFolders.merchantId, merchantId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async promoteFolderToCampaign(folderId: string): Promise<void> {
    await db
      .update(campaignFolders)
      .set({ 
        status: "campaign", 
        isLocked: true, // Lock folder to prevent edits and maintain data integrity
        updatedAt: new Date() 
      })
      .where(eq(campaignFolders.id, folderId));
  }

  // Campaign operations

  async getCampaigns(merchantId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.merchantId, merchantId))
      .orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(merchantId: string, campaignData: Omit<InsertCampaign, 'merchantId'>): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values({
        ...campaignData,
        merchantId,
      })
      .returning();
    return campaign;
  }

  async addFolderToCampaign(campaignId: string, folderId: string): Promise<void> {
    await this.promoteFolderToCampaign(folderId);
    await db.insert(campaignFolderMemberships).values({
      campaignId,
      folderId,
    });
  }

  async getCampaignFolderMemberships(campaignId: string): Promise<CampaignFolderMembership[]> {
    return await db
      .select()
      .from(campaignFolderMemberships)
      .where(eq(campaignFolderMemberships.campaignId, campaignId));
  }

  // Analytics & reporting
  
  async getMerchantAnalytics(merchantId: string) {
    const merchantOffers = await this.getOffersByMerchant(merchantId);
    
    const totalOffers = merchantOffers.length;
    const activeOffers = merchantOffers.filter(o => o.status === 'active' && new Date() <= o.endDate).length;
    const expiredOffers = merchantOffers.filter(o => o.status === 'active' && new Date() > o.endDate).length;
    const draftOffers = merchantOffers.filter(o => o.status === 'draft').length;
    const totalViews = merchantOffers.reduce((sum, o) => sum + Number(o.views || 0), 0);
    
    const offerIds = merchantOffers.map(o => o.id);
    
    const allClaims = offerIds.length > 0 
      ? await db.select().from(offerClaims).where(inArray(offerClaims.offerId, offerIds))
      : [];
    
    const allShares = offerIds.length > 0
      ? await db.select().from(referrals).where(inArray(referrals.offerId, offerIds))
      : [];
    
    const claimsByOffer = new Map<string, typeof allClaims>();
    const sharesByOffer = new Map<string, typeof allShares>();
    
    for (const claim of allClaims) {
      if (!claimsByOffer.has(claim.offerId)) {
        claimsByOffer.set(claim.offerId, []);
      }
      claimsByOffer.get(claim.offerId)!.push(claim);
    }
    
    for (const share of allShares) {
      if (!sharesByOffer.has(share.offerId)) {
        sharesByOffer.set(share.offerId, []);
      }
      sharesByOffer.get(share.offerId)!.push(share);
    }
    
    let totalClaims = allClaims.length;
    let totalShares = allShares.length;
    let totalResponseTime = 0;
    let totalConsiderationTime = 0;
    let countWithResponseTime = 0;
    let countWithConsiderationTime = 0;
    
    for (const claim of allClaims) {
      if (claim.couponSentAt && claim.claimedAt) {
        const responseMinutes = (claim.claimedAt.getTime() - claim.couponSentAt.getTime()) / (1000 * 60);
        if (responseMinutes > 0) {
          totalResponseTime += responseMinutes;
          countWithResponseTime++;
        }
      }
      
      if (claim.viewedAt && claim.claimedAt) {
        const considerationMinutes = (claim.claimedAt.getTime() - claim.viewedAt.getTime()) / (1000 * 60);
        if (considerationMinutes > 0) {
          totalConsiderationTime += considerationMinutes;
          countWithConsiderationTime++;
        }
      }
    }
    
    for (const share of allShares) {
      if (share.viewedAt && share.createdAt) {
        const considerationMinutes = (share.createdAt.getTime() - share.viewedAt.getTime()) / (1000 * 60);
        if (considerationMinutes > 0) {
          totalConsiderationTime += considerationMinutes;
          countWithConsiderationTime++;
        }
      }
    }
    
    const topOffersData = merchantOffers.map(offer => {
      const offerClaimsCount = claimsByOffer.get(offer.id)?.length || 0;
      const offerSharesCount = sharesByOffer.get(offer.id)?.length || 0;
      const offerViews = Number(offer.views || 0);
      
      return {
        id: offer.id,
        title: offer.title,
        views: offerViews,
        claims: offerClaimsCount,
        shares: offerSharesCount,
        conversionRate: offerViews > 0 ? (offerClaimsCount / offerViews) * 100 : 0,
      };
    });
    
    topOffersData.sort((a, b) => (b.claims + b.shares) - (a.claims + a.shares));
    const topOffers = topOffersData.slice(0, 5);
    
    const conversionRate = totalViews > 0 ? (totalClaims / totalViews) * 100 : 0;
    const avgResponseTimeMinutes = countWithResponseTime > 0 ? totalResponseTime / countWithResponseTime : null;
    const avgConsiderationTimeMinutes = countWithConsiderationTime > 0 ? totalConsiderationTime / countWithConsiderationTime : null;
    
    const acquisitionClicks = await this.getCustomerAcquisitionClicks(merchantId);
    const totalClicks = acquisitionClicks.length;
    const totalSpent = acquisitionClicks.reduce((sum, click) => sum + (click.costInCents || 0), 0);
    const avgCostPerClick = totalClicks > 0 ? totalSpent / totalClicks : 0;
    
    const recentClaims = await db.select({
      type: sql<'claim'>`'claim'`,
      offerId: offerClaims.offerId,
      timestamp: offerClaims.claimedAt,
    })
    .from(offerClaims)
    .innerJoin(offers, eq(offerClaims.offerId, offers.id))
    .where(eq(offers.merchantId, merchantId))
    .orderBy(desc(offerClaims.claimedAt))
    .limit(5);
    
    const recentShares = await db.select({
      type: sql<'share'>`'share'`,
      offerId: referrals.offerId,
      timestamp: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(offers, eq(referrals.offerId, offers.id))
    .where(eq(offers.merchantId, merchantId))
    .orderBy(desc(referrals.createdAt))
    .limit(5);
    
    const recentActivity = [...recentClaims, ...recentShares]
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, 10)
      .map(activity => {
        const offer = merchantOffers.find(o => o.id === activity.offerId);
        return {
          type: activity.type,
          offerId: activity.offerId,
          offerTitle: offer?.title || 'Unknown Offer',
          timestamp: activity.timestamp!,
        };
      });
    
    return {
      overview: {
        totalOffers,
        activeOffers,
        expiredOffers,
        draftOffers,
        totalViews,
        totalClaims,
        totalShares,
        conversionRate,
        avgResponseTimeMinutes,
        avgConsiderationTimeMinutes,
      },
      topOffers,
      customerAcquisition: {
        totalClicks,
        totalSpent,
        avgCostPerClick,
      },
      recentActivity,
    };
  }

  async createFeedback(feedbackData: { userId: string; page: string; message: string }): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return newFeedback;
  }

  async getAllFeedback(): Promise<Array<Feedback & { user: Pick<User, 'firstName' | 'lastName' | 'email' | 'businessName'> }>> {
    const feedbackWithUser = await db
      .select({
        id: feedback.id,
        userId: feedback.userId,
        page: feedback.page,
        message: feedback.message,
        createdAt: feedback.createdAt,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          businessName: users.businessName,
        },
      })
      .from(feedback)
      .innerJoin(users, eq(feedback.userId, users.id))
      .orderBy(desc(feedback.createdAt));
    
    return feedbackWithUser as any;
  }
}

export const storage = new DatabaseStorage();
