import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hashed password
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  businessName: varchar("business_name").notNull(), // Business name for merchant
  businessUrl: varchar("business_url").notNull(), // Business website URL
  businessStreet: varchar("business_street").notNull(), // Business street address
  businessCity: varchar("business_city").notNull(), // Business city
  businessState: varchar("business_state", { length: 2 }).notNull(), // Business state (2-letter code)
  businessPhone: varchar("business_phone").notNull(), // Business phone number
  contactPhone: varchar("contact_phone").notNull(), // Contact phone number for person signing up
  businessCategory: varchar("business_category").notNull(), // Type of business (Restaurant, Retail, etc.)
  title: varchar("title").notNull(), // Job title (Owner, Manager, etc.)
  profileImageUrl: varchar("profile_image_url"),
  logoUrl: varchar("logo_url"), // Business logo for printable signs
  zipCode: varchar("zip_code", { length: 10 }).notNull(), // Merchant business ZIP code
  membershipTier: varchar("membership_tier").notNull().default("NEST"), // NEST (free), GLIDE ($4.99), SOAR ($9.99)
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: varchar("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  freeTrialUsed: boolean("free_trial_used").notNull().default(false),
  lifetimeTextsSent: integer("lifetime_texts_sent").notNull().default(0),
  onboardingProgress: jsonb("onboarding_progress").default(sql`'{}'::jsonb`),
  merchantBank: integer("merchant_bank").notNull().default(0), // Bank balance in cents for customer acquisition
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Membership tiers enum
export const membershipTiers = ["NEST", "FREEBYRD", "GLIDE", "SOAR", "SOAR_PLUS", "SOAR_PLATINUM"] as const;
export type MembershipTier = (typeof membershipTiers)[number];

// Offer types enum
export const offerTypes = [
  "percentage",
  "dollar_amount",
  "bogo",
  "spend_threshold",
  "buy_x_get_y",
] as const;

export type OfferType = (typeof offerTypes)[number];

// Redemption types enum
export const redemptionTypes = [
  "pay_at_redemption",
  "prepayment_offer",
] as const;

export type RedemptionType = (typeof redemptionTypes)[number];

// Coupon delivery methods enum
export const couponDeliveryMethods = [
  "coupon_codes",
  "mobile_app_based_coupons",
  "mms_based_coupons",
  "text_message_alerts",
  "mobile_wallet_passes",
] as const;

export type CouponDeliveryMethod = (typeof couponDeliveryMethods)[number];

// Delivery configuration types for each method
export type CouponCodesConfig = {
  autoGenerateCode: boolean;
};

export type MobileAppConfig = {
  appDeepLink?: string;
};

export type MMSConfig = {
  couponImageUrl?: string;
};

export type TextAlertsConfig = {
  messageTemplate?: string;
};

export type MobileWalletConfig = {
  barcodeType: 'qr_code' | 'code128' | 'code39' | 'ean13';
};

export type DeliveryConfig = 
  | CouponCodesConfig
  | MobileAppConfig
  | MMSConfig
  | TextAlertsConfig
  | MobileWalletConfig
  | Record<string, never>; // Empty object for no config

// Add types enum - Ad Type determines countdown urgency features
export const addTypes = [
  "regular",      // No countdown
  "timer",        // Countdown timer only
  "quantity",     // Countdown quantity only
  "both",         // Both timer AND quantity (INSANE URGENCY!)
] as const;

export type AddType = (typeof addTypes)[number];

// Offer status enum
export const offerStatuses = [
  "draft",    // Saved but not published
  "active",   // Published and accepting claims
  "paused",   // Temporarily disabled
  "expired",  // Past end date
] as const;

export type OfferStatus = (typeof offerStatuses)[number];

// Offers table
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  campaignObjectives: text("campaign_objectives").array(), // Array of 3 priorities selected from predefined list
  menuItem: text("menu_item"), // The actual product/menu item name (required by app validation, nullable in DB for existing data)
  
  // Offer type and type-specific fields
  offerType: varchar("offer_type").notNull().default("percentage"),
  percentageOff: integer("percentage_off"), // For percentage type (e.g., 25 = 25%)
  dollarOff: integer("dollar_off"), // For dollar amount type (e.g., 10 = $10)
  buyQuantity: integer("buy_quantity"), // For BOGO (buy X)
  getQuantity: integer("get_quantity"), // For BOGO (get Y)
  bogoPercentageOff: integer("bogo_percentage_off"), // For BOGO (at X% off)
  bogoItem: text("bogo_item"), // For BOGO - name of the item you get
  spendThreshold: integer("spend_threshold"), // For spend threshold (spend $X)
  thresholdDiscount: integer("threshold_discount"), // For spend threshold (get $Y off)
  xyfFreeItem: text("xyf_free_item"), // For Buy X Get Y Free - name of the free item
  
  // Legacy fields (keeping for backward compatibility)
  discount: varchar("discount"),
  originalPrice: varchar("original_price"), // Required by app validation, but nullable in DB for existing data
  
  imageUrl: text("image_url"),
  videoUrl: text("video_url"), // Optional video link (YouTube, Vimeo, etc.)
  zipCode: varchar("zip_code", { length: 10 }).notNull(), // Offer location for proximity filtering
  
  // Redemption type and related fields
  redemptionType: varchar("redemption_type").notNull().default("coupon"),
  couponDeliveryMethod: varchar("coupon_delivery_method"), // Required for coupon redemption type
  deliveryConfig: jsonb("delivery_config").default(sql`'{}'::jsonb`), // Method-specific delivery configuration
  
  purchaseUrl: text("purchase_url"), // Required for prepayment_offer
  couponCode: text("coupon_code"), // Optional coupon code
  posWebhookUrl: text("pos_webhook_url"), // POS system webhook URL for auto-sync of generated codes
  
  // Add type and countdown fields
  addType: varchar("add_type").notNull().default("regular"), // regular, timer, quantity, or both
  countdownDays: integer("countdown_days"), // Countdown timer: days
  countdownHours: integer("countdown_hours"), // Countdown timer: hours
  countdownMinutes: integer("countdown_minutes"), // Countdown timer: minutes
  countdownSeconds: integer("countdown_seconds"), // Countdown timer: seconds (minimum 10 total seconds)
  countdownTimerSeconds: integer("countdown_timer_seconds"), // Total seconds for timer countdown (default 30)
  countdownQuantityStart: integer("countdown_quantity_start"), // Starting quantity for countdown (uses max_clicks)
  
  // Maximum clicks management
  maxClicksAllowed: integer("max_clicks_allowed"), // Maximum clicks allowed for the offer
  shutDownAtMaximum: boolean("shut_down_at_maximum").notNull().default(false), // Auto shut down when max clicks reached
  notifyAtMaximum: boolean("notify_at_maximum").notNull().default(false), // Notify merchant when max clicks reached
  clickBudgetDollars: integer("click_budget_dollars"), // Budget in dollars for clicks
  textBudgetDollars: integer("text_budget_dollars"), // Budget allocated for SMS texts for this offer
  ripsBudgetDollars: integer("rips_budget_dollars"), // Budget for viral/referral sharing (customer-to-customer forwards)
  
  startDate: timestamp("start_date"), // Optional start date for future/scheduled campaigns
  endDate: timestamp("end_date"), // Optional end date - null for drafts
  views: varchar("views").default("0"),
  status: varchar("status").notNull().default("active"),
  
  // Sales tracking and auto-extend fields
  unitsSold: integer("units_sold").notNull().default(0),
  targetUnits: integer("target_units"),
  autoExtend: boolean("auto_extend").notNull().default(false),
  extensionDays: integer("extension_days").notNull().default(3),
  notifyOnShortfall: boolean("notify_on_shortfall").notNull().default(true),
  lastAutoExtendedAt: timestamp("last_auto_extended_at"),
  activatedAt: timestamp("activated_at"), // Timestamp when offer transitioned from Future to Current
  
  // SMS notification preferences
  notifyOnTargetMet: boolean("notify_on_target_met").notNull().default(false),
  notifyOnPoorPerformance: boolean("notify_on_poor_performance").notNull().default(false),
  
  // Campaign organization
  campaignFolder: varchar("campaign_folder")
    .references(() => campaignFolders.id, { onDelete: "set null" }), // Folder for organizing campaigns (cleared if folder deleted)
  completionStage: varchar("completion_stage").notNull().default("folder1"), // Track progression: folder1, folder2, or completed
  
  // Customer acquisition
  getNewCustomersEnabled: boolean("get_new_customers_enabled").notNull().default(false), // Pay per click for non-registered customer acquisition
  
  // Soft delete
  isDeleted: boolean("is_deleted").notNull().default(false),
  needsReintegration: boolean("needs_reintegration").notNull().default(false), // Set when resurrected, cleared when reintegrated
  
  // Batch selection workflow
  batchPendingSelection: boolean("batch_pending_selection").notNull().default(false), // True for batch permutations until selected in grid
  
  // Duplication tracking
  sourceOfferId: varchar("source_offer_id").references((): any => offers.id), // Tracks which offer this was duplicated from
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offers)
  .omit({
    id: true,
    merchantId: true,
    views: true,
    createdAt: true,
    discount: true,
    unitsSold: true,
    lastAutoExtendedAt: true,
    activatedAt: true,
  })
  .extend({
    startDate: z.preprocess((val) => val === "" || val === null ? undefined : val, z.coerce.date().optional()), // Optional for drafts, required when publishing
    endDate: z.preprocess((val) => val === "" || val === null ? undefined : val, z.coerce.date().optional()), // Optional for drafts
    offerType: z.enum(offerTypes),
    redemptionType: z.enum(redemptionTypes),
    couponDeliveryMethod: z.enum(couponDeliveryMethods).nullish(),
    addType: z.enum(addTypes),
    status: z.enum(offerStatuses).default("active"), // Default to active unless explicitly set to draft
    menuItem: z.string().nullish(), // Optional for drafts, validated in backend for active offers
    originalPrice: z.string().nullish(), // Optional for drafts, validated in backend for active offers
    countdownDays: z.number().int().min(0).max(365).nullish(),
    countdownHours: z.number().int().min(0).max(23).nullish(),
    countdownMinutes: z.number().int().min(0).max(59).nullish(),
    countdownSeconds: z.number().int().min(0).max(59).nullish(),
    maxClicksAllowed: z.number().int().nullish(), // Optional for drafts, validated in backend for active offers
    clickBudgetDollars: z.number().int().nullish(), // Optional for drafts, validated in backend for active offers
    campaignFolder: z.string().nullish(), // Optional folder ID for batch organization
  })
  .refine(
    (data) => {
      // Skip validation for drafts
      if (data.status === "draft") return true;
      
      // If redemption type is prepayment_offer, purchaseUrl must be provided
      if (data.redemptionType === "prepayment_offer" && !data.purchaseUrl) {
        return false;
      }
      return true;
    },
    {
      message: "Purchase URL is required for 'Pre-Payment Offer' offers",
      path: ["purchaseUrl"],
    }
  )
  .refine(
    (data) => {
      // Skip validation for drafts
      if (data.status === "draft") return true;
      
      // Legacy countdown validation kept for backward compatibility
      // New ad types (timer, both) use countdownTimerSeconds field instead
      if (data.addType === "countdown") {
        const days = typeof data.countdownDays === "number" ? data.countdownDays : 0;
        const hours = typeof data.countdownHours === "number" ? data.countdownHours : 0;
        const minutes = typeof data.countdownMinutes === "number" ? data.countdownMinutes : 0;
        const seconds = typeof data.countdownSeconds === "number" ? data.countdownSeconds : 0;
        
        const totalSeconds = 
          days * 86400 +
          hours * 3600 +
          minutes * 60 +
          seconds;
        
        if (totalSeconds < 10) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Countdown timer must be at least 10 seconds total",
      path: ["countdownSeconds"],
    }
  )
  .refine(
    (data) => {
      // Skip validation for drafts
      if (data.status === "draft") return true;
      
      // If redemption type is coupon, couponDeliveryMethod must be provided
      if (data.redemptionType === "coupon" && !data.couponDeliveryMethod) {
        return false;
      }
      return true;
    },
    {
      message: "Coupon delivery method is required for coupon offers",
      path: ["couponDeliveryMethod"],
    }
  )
  .refine(
    (data) => {
      // Skip validation for drafts
      if (data.status === "draft") return true;
      
      // Validate deliveryConfig matches the selected couponDeliveryMethod
      if (data.redemptionType === "coupon" && data.couponDeliveryMethod) {
        const config = data.deliveryConfig as any;
        
        // Ensure deliveryConfig exists
        if (!config) {
          return false;
        }
        
        // Method-specific validation
        switch (data.couponDeliveryMethod) {
          case "coupon_codes":
            // autoGenerateCode should be boolean if present
            if (config.autoGenerateCode !== undefined && typeof config.autoGenerateCode !== "boolean") {
              return false;
            }
            break;
          case "mobile_app_based_coupons":
            // appDeepLink should be string if present
            if (config.appDeepLink !== undefined && typeof config.appDeepLink !== "string") {
              return false;
            }
            break;
          case "mms_based_coupons":
            // couponImageUrl should be string if present
            if (config.couponImageUrl !== undefined && typeof config.couponImageUrl !== "string") {
              return false;
            }
            break;
          case "text_message_alerts":
            // messageTemplate should be string if present
            if (config.messageTemplate !== undefined && typeof config.messageTemplate !== "string") {
              return false;
            }
            break;
          case "mobile_wallet_passes":
            // barcodeType should be one of the valid values
            if (config.barcodeType && !["qr_code", "code128", "code39", "ean13"].includes(config.barcodeType)) {
              return false;
            }
            break;
        }
      }
      return true;
    },
    {
      message: "Invalid delivery configuration for selected method",
      path: ["deliveryConfig"],
    }
  )
  .refine(
    (data) => {
      // Skip validation for drafts
      if (data.status === "draft") return true;
      
      // Validate startDate is before endDate
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: "Start time must be before end date",
      path: ["startDate"],
    }
  )
  .superRefine((data, ctx) => {
    // Skip validation for drafts
    if (data.status === "draft") return;
    
    // Quantity countdown requires prepayment_offer redemption type
    if (data.addType === "quantity" || data.addType === "both") {
      if (data.redemptionType !== "prepayment_offer") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Countdown Quantity requires 'Pre-Payment Offer' redemption type",
          path: ["redemptionType"],
        });
      }
      
      // Must have purchase URL
      if (!data.purchaseUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Purchase URL is required for Countdown Quantity offers",
          path: ["purchaseUrl"],
        });
      }
      
      // Must have inventory set (maxClicksAllowed)
      const maxClicks = typeof data.maxClicksAllowed === "number" ? data.maxClicksAllowed : 0;
      if (maxClicks < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Maximum clicks (inventory) must be at least 1 for Countdown Quantity offers",
          path: ["maxClicksAllowed"],
        });
      }
    }
  });

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Notification priorities and types
export const notificationPriorities = ["low", "normal", "high", "urgent"] as const;
export type NotificationPriority = (typeof notificationPriorities)[number];

export const notificationTypes = [
  "auto_extend",
  "shortfall_warning", 
  "offer_expired",
  "offer_activated",
  "budget_warning",
  "budget_depleted",
  "max_clicks_reached",
  "target_met",
  "poor_performance",
  "system_alert"
] as const;
export type NotificationType = (typeof notificationTypes)[number];

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offerId: varchar("offer_id").references(() => offers.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'auto_extend', 'shortfall_warning', etc.
  priority: varchar("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  message: text("message").notNull(),
  actionUrl: varchar("action_url"), // Optional deep link to related resource
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Channel preferences
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  
  // Event type preferences (what to notify about)
  notifyAutoExtend: boolean("notify_auto_extend").notNull().default(true),
  notifyShortfall: boolean("notify_shortfall").notNull().default(true),
  notifyExpired: boolean("notify_expired").notNull().default(true),
  notifyActivated: boolean("notify_activated").notNull().default(true),
  notifyBudgetWarning: boolean("notify_budget_warning").notNull().default(true),
  notifyBudgetDepleted: boolean("notify_budget_depleted").notNull().default(true),
  notifyMaxClicks: boolean("notify_max_clicks").notNull().default(true),
  notifyTargetMet: boolean("notify_target_met").notNull().default(true),
  notifyPoorPerformance: boolean("notify_poor_performance").notNull().default(false),
  
  // Batching preferences
  enableBatching: boolean("enable_batching").notNull().default(false), // Group low-priority notifications
  batchFrequency: varchar("batch_frequency").notNull().default("daily"), // 'hourly', 'daily', 'weekly'
  
  // Quiet hours (prevent non-urgent notifications during specified times)
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
  quietHoursStart: varchar("quiet_hours_start"), // e.g., "22:00"
  quietHoursEnd: varchar("quiet_hours_end"), // e.g., "08:00"
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  merchantId: true,
  updatedAt: true,
});

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

// Customers table (for SMS notifications system)
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull().unique(),
  zipCode: varchar("zip_code", { length: 10 }).notNull(), // Customer location for local offers
  verified: boolean("verified").notNull().default(false),
  verificationCode: varchar("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  dateOfBirth: timestamp("date_of_birth", { mode: 'date' }), // Optional: for double rewards
  sex: varchar("sex", { length: 30 }), // Optional: for double rewards (male, female, non_binary, prefer_not_to_say)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const sexOptions = ["male", "female", "non_binary", "prefer_not_to_say"] as const;
export type Sex = (typeof sexOptions)[number];

export const updateCustomerProfileSchema = z.object({
  dateOfBirth: z.coerce.date().optional().refine(
    (date) => !date || date < new Date(),
    { message: "Date of birth must be in the past" }
  ).refine(
    (date) => {
      if (!date) return true;
      const age = Math.floor((new Date().getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 13;
    },
    { message: "Must be at least 13 years old" }
  ),
  sex: z.enum(sexOptions).optional(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

// Merchant followers (customers following specific merchants)
export const merchantFollowers = pgTable("merchant_followers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type MerchantFollower = typeof merchantFollowers.$inferSelect;
export type InsertMerchantFollower = typeof merchantFollowers.$inferInsert;

// SMS usage tracking (for merchant billing)
export const smsUsage = pgTable("sms_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month").notNull(), // Format: "2025-01"
  textsSent: integer("texts_sent").notNull().default(0),
  includedTexts: integer("included_texts").notNull().default(100), // Plan includes 100
  overageTexts: integer("overage_texts").notNull().default(0),
  subscriptionFee: integer("subscription_fee").notNull().default(499), // $4.99 in cents
  overageFee: integer("overage_fee").notNull().default(0), // Calculated: overage * 3 cents
  totalFee: integer("total_fee").notNull().default(499), // Total bill in cents
  billingTier: varchar("billing_tier"), // Snapshot of tier during billing period
  pricingBreakdown: jsonb("pricing_breakdown"), // Array of {from, to, rateCents, count, amountCents} for audit
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SmsUsage = typeof smsUsage.$inferSelect;
export type InsertSmsUsage = typeof smsUsage.$inferInsert;

// SMS notifications log (track individual texts sent)
export const smsNotifications = pgTable("sms_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  offerId: varchar("offer_id").references(() => offers.id, { onDelete: "set null" }),
  phoneNumber: varchar("phone_number").notNull(),
  message: text("message").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, sent, failed
  twilioMessageSid: varchar("twilio_message_sid"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SmsNotification = typeof smsNotifications.$inferSelect;
export type InsertSmsNotification = typeof smsNotifications.$inferInsert;

// Generated coupon codes table (tracks auto-generated codes for POS integration)
export const generatedCouponCodes = pgTable("generated_coupon_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id")
    .references(() => customers.id, { onDelete: "set null" }), // Nullable - code may be generated before assignment
  code: varchar("code").notNull().unique(), // The generated coupon code (e.g., ABC123XYZ)
  claimed: boolean("claimed").notNull().default(false), // Whether code has been claimed by customer
  redeemed: boolean("redeemed").notNull().default(false), // Whether code has been redeemed at POS
  redeemedAt: timestamp("redeemed_at"), // Timestamp of POS redemption
  webhookSent: boolean("webhook_sent").notNull().default(false), // Whether POS webhook was triggered
  webhookSentAt: timestamp("webhook_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeneratedCouponCodeSchema = createInsertSchema(generatedCouponCodes).omit({
  id: true,
  createdAt: true,
});

export type GeneratedCouponCode = typeof generatedCouponCodes.$inferSelect;
export type InsertGeneratedCouponCode = z.infer<typeof insertGeneratedCouponCodeSchema>;

// Text rollover tracking (unused texts carry over, expire after 12 months)
export const textRollover = pgTable("text_rollover", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  textsRemaining: integer("texts_remaining").notNull(), // How many unused texts from this allocation
  allocatedMonth: varchar("allocated_month").notNull(), // Month these texts were allocated (e.g., "2025-01")
  expiryDate: timestamp("expiry_date").notNull(), // Expires 12 months from allocation
  createdAt: timestamp("created_at").defaultNow(),
});

export type TextRollover = typeof textRollover.$inferSelect;
export type InsertTextRollover = typeof textRollover.$inferInsert;

// Offer claims (track customer claim attempts and verification)
export const offerClaims = pgTable("offer_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id")
    .references(() => customers.id, { onDelete: "set null" }),
  customerPhone: varchar("customer_phone").notNull(), // Phone number attempting claim
  customerZip: varchar("customer_zip", { length: 10 }).notNull(), // ZIP for 10-mile validation
  status: varchar("status").notNull().default("pending_verification"), // pending_verification, verified, expired
  verificationCode: varchar("verification_code").notNull(), // 6-digit code
  verificationExpiry: timestamp("verification_expiry").notNull(), // Code expires after 10 minutes
  viewedAt: timestamp("viewed_at"), // When customer first viewed the offer page (before clicking redeem)
  claimedAt: timestamp("claimed_at").defaultNow(), // When claim was initiated
  verifiedAt: timestamp("verified_at"), // When verification succeeded (null until verified)
  couponSentAt: timestamp("coupon_sent_at"), // When coupon SMS was sent
});

export const insertOfferClaimSchema = createInsertSchema(offerClaims).omit({
  id: true,
  viewedAt: true,
  claimedAt: true,
  verifiedAt: true,
  couponSentAt: true,
});

export type OfferClaim = typeof offerClaims.$inferSelect;
export type InsertOfferClaim = z.infer<typeof insertOfferClaimSchema>;

// Customer referrals (track customer-to-customer referrals for offers)
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralCode: varchar("referral_code").notNull().unique(), // Unique short code for tracking
  offerId: varchar("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  referrerPhone: varchar("referrer_phone").notNull(), // Customer who shared the deal
  referrerZip: varchar("referrer_zip", { length: 10 }).notNull(), // Referrer's ZIP
  friendPhone: varchar("friend_phone"), // Friend's phone (null until claimed)
  status: varchar("status").notNull().default("pending"), // pending, claimed, expired
  pointsEarned: integer("points_earned").notNull().default(0), // Points awarded to referrer
  claimId: varchar("claim_id").references(() => offerClaims.id, { onDelete: "set null" }), // Link to friend's claim
  viewedAt: timestamp("viewed_at"), // When customer first viewed the offer page (before clicking share)
  createdAt: timestamp("created_at").defaultNow(),
  claimedAt: timestamp("claimed_at"), // When friend claimed via this referral
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  viewedAt: true,
  createdAt: true,
  claimedAt: true,
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Customer points balance (aggregate view of referral points)
export const customerPoints = pgTable("customer_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull().unique(),
  totalPoints: integer("total_points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CustomerPoints = typeof customerPoints.$inferSelect;
export type InsertCustomerPoints = typeof customerPoints.$inferInsert;

// Customer check-ins (track app opens for location-based rewards)
export const checkIns = pgTable("check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerPhone: varchar("customer_phone").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  latitude: varchar("latitude"), // Geolocation latitude
  longitude: varchar("longitude"), // Geolocation longitude
  geoAccuracy: integer("geo_accuracy"), // Accuracy in meters (optional)
  zipCode: varchar("zip_code", { length: 10 }), // Computed from reverse geocoding
  pointsAwarded: integer("points_awarded").notNull().default(2), // Points for this check-in
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("check_ins_customer_time_idx").on(table.customerPhone, table.occurredAt.desc())
]);

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
  createdAt: true,
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

// Merchant customers (imported customer lists for merchants)
export const merchantCustomers = pgTable("merchant_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phoneNumber: varchar("phone_number").notNull(), // Required for SMS campaigns
  zipCode: varchar("zip_code", { length: 10 }), // Optional but helpful for targeting
  notes: text("notes"), // Merchant's notes about customer
  source: varchar("source").notNull().default("csv_import"), // csv_import, manual, etc.
  importBatchId: varchar("import_batch_id"), // Group customers from same upload
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMerchantCustomerSchema = createInsertSchema(merchantCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MerchantCustomer = typeof merchantCustomers.$inferSelect;
export type InsertMerchantCustomer = z.infer<typeof insertMerchantCustomerSchema>;

// Customer acquisition clicks tracking (pay-per-click system for non-registered customers)
export const customerAcquisitionClicks = pgTable("customer_acquisition_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  offerId: varchar("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clickerInfo: varchar("clicker_info"), // Could be phone/email if collected, or anonymous identifier
  ipAddress: varchar("ip_address"), // For tracking unique clicks
  userAgent: varchar("user_agent"), // Browser/device info
  costInCents: integer("cost_in_cents").notNull().default(165), // Cost per new customer (default $1.65)
  wasCharged: boolean("was_charged").notNull().default(false), // Whether merchant had sufficient balance and was charged
  createdAt: timestamp("created_at").defaultNow(),
});

export type CustomerAcquisitionClick = typeof customerAcquisitionClicks.$inferSelect;
export type InsertCustomerAcquisitionClick = typeof customerAcquisitionClicks.$inferInsert;

// Campaign folders for organizing offers
export const folderStatuses = ["draft", "campaign", "archived"] as const;
export type FolderStatus = (typeof folderStatuses)[number];

export const campaignFolders = pgTable("campaign_folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // Folder name/title
  description: text("description"), // Campaign description - auto-suggested but editable
  status: varchar("status").notNull().default("draft"), // draft = in Drafts page, campaign = promoted to Live/Expired, archived = hidden
  isLocked: boolean("is_locked").notNull().default(false), // Locked folders cannot have offers edited (prevents campaign data corruption)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignFolderSchema = createInsertSchema(campaignFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CampaignFolder = typeof campaignFolders.$inferSelect;
export type InsertCampaignFolder = z.infer<typeof insertCampaignFolderSchema>;

// Campaigns table for customer-created campaigns (organizing folders)
export const campaignStatuses = ["draft", "active", "completed", "paused"] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  merchantId: varchar("merchant_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // Campaign name
  description: text("description"), // Optional campaign description
  status: varchar("status").notNull().default("active"), // Campaign status
  
  // Store the filter criteria used to auto-build campaign (if applicable)
  // Example: { offerType: "percentage", percentageOff: 25 }
  campaignFilters: jsonb("campaign_filters"), // Nullable - only set for attribute-based campaigns
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

// Join table for campaigns and folders (many-to-many)
export const campaignFolderMemberships = pgTable("campaign_folder_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  folderId: varchar("folder_id")
    .notNull()
    .references(() => campaignFolders.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCampaignFolderMembershipSchema = createInsertSchema(campaignFolderMemberships).omit({
  id: true,
  createdAt: true,
});

export type CampaignFolderMembership = typeof campaignFolderMemberships.$inferSelect;
export type InsertCampaignFolderMembership = z.infer<typeof insertCampaignFolderMembershipSchema>;

// Feedback table for page improvement suggestions
export const feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  page: varchar("page").notNull(), // The page path where feedback was submitted
  message: text("message").notNull(), // The feedback message
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Dashboard stats schema (for aggregated merchant statistics)
export const dashboardStatsSchema = z.object({
  totalClicks: z.number().int().nonnegative(),
  totalViews: z.number().int().nonnegative(),
  clickThroughRate: z.number().nonnegative(), // Percentage (0-100)
  totalCustomers: z.number().int().nonnegative(),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
