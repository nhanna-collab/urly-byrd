import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession } from "./replitAuth";
import { insertOfferSchema, insertNotificationPreferencesSchema } from "@shared/schema";
import { isWithinRadius, findClosestZip } from "./zipUtils";
import { hashPassword, comparePassword, validateEmail, validatePassword, isBusinessEmail, validateDomainMatch } from "./authUtils";
import { validateBusiness } from "./businessValidation";
import { generateVerificationCode, sendVerificationEmail } from "./emailUtils";
import { generateReferralCode, generateReferralUrl, calculateReferralPoints } from "./referralUtils";
import { formatZodErrors, createFieldError, validateMinimumDuration } from "./validationUtils";
import { validateOfferAgainstTier, validateActiveOfferCount } from "./tierValidation";
import { getRipsShareCost, type MembershipTier } from "@shared/tierLimits";
import { sendIconLinkSms } from "./services/sms";
import multer from "multer";
import { z } from "zod";

// Custom validation schema for customer signup (only validates required fields)
const customerSignupSchema = z.object({
  phoneNumber: z.string().length(10, "Phone number must be exactly 10 digits"),
  zipCode: z.string().min(5, "ZIP code must be at least 5 characters").max(10, "ZIP code must be at most 10 characters"),
});

// Auth middleware - loads user from session
async function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      // User record not found - clear invalid session
      req.session.userId = undefined;
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Attach full user object to request
    (req as any).user = user;
    return next();
  } catch (error) {
    // Database error - fail closed with 500
    console.error("Error loading user in auth middleware:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware (reusing existing session setup)
  app.set("trust proxy", 1);
  app.use(getSession());

  // Site Access Verification endpoint (for password-protected site)
  app.post("/api/site-access/verify", async (req, res) => {
    try {
      const { password } = req.body;
      const accessPassword = process.env.SITE_ACCESS_PASSWORD;
      
      if (!accessPassword) {
        // No password configured, allow access
        return res.json({ success: true });
      }
      
      if (password === accessPassword) {
        return res.json({ success: true });
      }
      
      return res.status(401).json({ success: false, message: "Incorrect password" });
    } catch (error) {
      console.error("Error verifying site access:", error);
      res.status(500).json({ success: false, message: "Verification failed" });
    }
  });

  // Registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { 
        businessName, 
        businessUrl, 
        businessCategory,
        businessStreet,
        businessCity,
        businessState,
        businessPhone,
        contactPhone,
        title, 
        firstName, 
        lastName, 
        email, 
        zipCode, 
        password,
        membershipTier = "NEST"
      } = req.body;

      // Validate all required fields
      if (!businessName || !businessUrl || !businessCategory || !businessStreet || !businessCity || 
          !businessState || !businessPhone || !contactPhone || !title || 
          !firstName || !lastName || !email || !zipCode || !password) {
        return res.status(400).json({ 
          message: "All fields are required to register your merchant account" 
        });
      }

      // Validate membership tier
      const validTiers = ["NEST", "FREEBYRD", "ASCEND", "SOAR"];
      if (!validTiers.includes(membershipTier)) {
        return res.status(400).json({ 
          message: "Invalid membership tier. Must be NEST, FREEBYRD, ASCEND, or SOAR." 
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // UNIVERSAL VERIFICATION: All tiers require business email and domain matching
      // Validate business email (block personal email providers)
      const businessEmailValidation = isBusinessEmail(email);
      if (!businessEmailValidation.valid) {
        return res.status(400).json({ message: businessEmailValidation.message });
      }

      // STRICT DOMAIN MATCHING - email domain MUST match business URL
      const domainMatchValidation = validateDomainMatch(email, businessUrl);
      if (!domainMatchValidation.valid) {
        return res.status(400).json({ 
          message: domainMatchValidation.message + " This verifies you own the business."
        });
      }

      // BUSINESS LEGITIMACY VALIDATION - verify business data is complete
      console.log(`Validating business: ${businessName} for ${membershipTier} tier registration`);
      const businessValidation = await validateBusiness({
        businessName,
        website: businessUrl,
        businessStreet,
        businessCity,
        businessState,
        businessPhone
      });

      if (!businessValidation.isValid) {
        console.log('Business validation failed:', businessValidation.reasons);
        return res.status(400).json({ 
          message: "Please ensure all business details are complete and accurate, including a valid business website domain. " +
                   "Validation details: " + businessValidation.reasons.join(', ')
        });
      }

      console.log(`Business validated successfully (${businessValidation.confidence} confidence):`, businessValidation.reasons);

      // Generate 6-digit verification code
      const verificationCode = generateVerificationCode();
      const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Create unverified merchant account
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        businessName,
        businessUrl,
        businessCategory,
        businessStreet,
        businessCity,
        businessState,
        businessPhone,
        contactPhone,
        title,
        firstName,
        lastName,
        email,
        zipCode,
        membershipTier,
        password: hashedPassword,
        emailVerified: false, // Requires email verification
        verificationToken: verificationCode,
        verificationTokenExpiry,
      });

      // Send verification email (logged to console for now)
      await sendVerificationEmail(email, verificationCode, businessName);

      // Do NOT log them in - they must verify email first
      // Return success message without user data
      return res.json({ 
        message: "Registration successful! Please check your email for a verification code.",
        email: email,
        requiresVerification: true
      });
    } catch (error: any) {
      console.error("Error during registration:", error);
      
      // Handle database unique constraint violation (email already exists)
      if (error?.code === '23505' || error?.constraint === 'users_email_unique') {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      res.status(500).json({ message: "Failed to register" });
    }
  });

  // Verify email endpoint
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email and verification code are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Check if code matches
      if (user.verificationToken !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Check if code is expired
      if (!user.verificationTokenExpiry || new Date() > user.verificationTokenExpiry) {
        return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
      }

      // Verify the email
      await storage.verifyUserEmail(user.id);

      // Log them in
      (req.session as any).userId = user.id;

      // Get updated user
      const verifiedUser = await storage.getUserById(user.id);
      if (!verifiedUser) {
        return res.status(500).json({ message: "Failed to retrieve user" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = verifiedUser;
      return res.json({
        message: "Email verified successfully!",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error during email verification:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend verification code endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new code
      const verificationCode = generateVerificationCode();
      const verificationTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update user with new code
      await storage.updateUser(user.id, {
        verificationToken: verificationCode,
        verificationTokenExpiry,
      });

      // Send verification email
      await sendVerificationEmail(user.email, verificationCode, user.businessName);

      return res.json({
        message: "Verification code sent! Check your email.",
        email: user.email
      });
    } catch (error) {
      console.error("Error resending verification code:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const passwordMatch = await comparePassword(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email first. Check your inbox at " + user.email,
          emailVerified: false
        });
      }

      // Set session
      (req.session as any).userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error("Error during logout:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Customer authentication middleware
  async function isCustomerAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!req.session?.customerId) {
      return res.status(401).json({ message: "Customer not logged in" });
    }

    try {
      const customer = await storage.getCustomer(req.session.customerId);
      if (!customer) {
        // Customer record not found - clear invalid session
        req.session.customerId = undefined;
        return res.status(401).json({ message: "Customer not logged in" });
      }
      
      // Attach customer object to request
      (req as any).customer = customer;
      return next();
    } catch (error) {
      // Database error - fail closed with 500
      console.error("Error loading customer in auth middleware:", error);
      return res.status(500).json({ message: "Authentication failed" });
    }
  }

  // Customer signup endpoint
  app.post("/api/customers/signup", async (req, res) => {
    try {
      const { phoneNumber, zipCode } = req.body;

      if (!phoneNumber || !zipCode) {
        return res.status(400).json({ message: "Phone number and ZIP code are required" });
      }

      // Normalize phone number (remove non-digits)
      const normalizedPhone = phoneNumber.replace(/\D/g, '');
      
      // Validate with custom signup schema
      const validationResult = customerSignupSchema.safeParse({
        phoneNumber: normalizedPhone,
        zipCode,
      });

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(', ');
        return res.status(400).json({ message: `Validation error: ${errors}` });
      }

      // Check if customer already exists
      let customer = await storage.getCustomerByPhone(normalizedPhone);
      let isNewCustomer = false;
      
      if (customer) {
        // Customer exists, update ZIP if different
        if (customer.zipCode !== zipCode) {
          const updatedCustomer = await storage.updateCustomer(customer.id, { zipCode });
          if (!updatedCustomer) {
            console.error("Failed to update customer ZIP code");
            return res.status(500).json({ message: "Failed to update customer information" });
          }
          customer = updatedCustomer;
        }
      } else {
        // Create new customer
        customer = await storage.createCustomer({
          phoneNumber: normalizedPhone,
          zipCode,
          verified: true, // MVP: instant signup without verification
        });
        isNewCustomer = true;
      }

      // Set session
      (req.session as any).customerId = customer.id;

      // Send icon link SMS to new customers
      let smsDispatched = false;
      if (isNewCustomer) {
        const appBaseUrl = process.env.APP_BASE_URL || 
          (process.env.NODE_ENV === 'production' 
            ? 'https://urlybyrd.replit.app' 
            : 'http://localhost:5000');
        
        const result = await sendIconLinkSms({
          phoneNumber: normalizedPhone,
          appUrl: `${appBaseUrl}/customer-landing`,
        });
        
        smsDispatched = result.success;
        
        if (!result.success) {
          console.warn("Failed to send icon link SMS:", result.error);
        }
      }

      res.json({ ...customer, smsDispatched });
    } catch (error) {
      console.error("Error during customer signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Get current customer
  app.get("/api/customers/me", async (req: any, res) => {
    if (!req.session?.customerId) {
      return res.status(401).json({ message: "Not logged in" });
    }

    try {
      const customer = await storage.getCustomer(req.session.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Customer logout
  app.post("/api/customers/logout", async (req: any, res) => {
    // Only clear customerId, don't destroy entire session (preserves merchant session)
    if (req.session) {
      req.session.customerId = undefined;
      res.json({ message: "Logged out successfully" });
    } else {
      res.status(400).json({ message: "No active session" });
    }
  });

  // Update customer profile (demographics for double rewards)
  app.patch("/api/customers/profile", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const customer = req.customer;
      const profileData = req.body;

      // Update profile with new demographic data
      const updatedCustomer = await storage.updateCustomerProfile(customer.id, {
        dateOfBirth: profileData.dateOfBirth || null,
        sex: profileData.sex || null,
      });

      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json({
        message: "Profile updated successfully",
        hasDoublerewards: !!(updatedCustomer.dateOfBirth && updatedCustomer.sex),
      });
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Customer check-in (location-based rewards)
  app.post("/api/customers/check-in", isCustomerAuthenticated, async (req: any, res) => {
    try {
      const customer = req.customer;
      const { latitude, longitude, zipCode } = req.body;

      // Check if customer can check in (2-hour cooldown)
      const eligibility = await storage.canCheckIn(customer.phoneNumber);
      
      if (!eligibility.canCheckIn) {
        const minutes = eligibility.minutesRemaining!;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const timeMsg = hours > 0 
          ? `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` and ${remainingMinutes} minutes` : ''}`
          : `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        
        return res.status(200).json({
          success: false,
          message: `You can check in again in ${timeMsg}`,
          minutesRemaining: minutes,
        });
      }

      // Determine check-in bonus points
      const CHECKIN_POINTS = 2;
      const hasDoubleRewards = !!(customer.dateOfBirth && customer.sex);
      const pointsToAward = hasDoubleRewards ? CHECKIN_POINTS * 2 : CHECKIN_POINTS;

      // Create check-in record
      const checkIn = await storage.createCheckIn({
        customerPhone: customer.phoneNumber,
        latitude: latitude || null,
        longitude: longitude || null,
        zipCode: zipCode || customer.zipCode,
        pointsAwarded: pointsToAward,
        occurredAt: new Date(),
      });

      // Award points to customer
      await storage.updateCustomerPoints(customer.phoneNumber, pointsToAward);

      console.log(`\n✨ CHECK-IN REWARD!`);
      console.log(`Customer: ${customer.phoneNumber}`);
      console.log(`Location: ${zipCode || customer.zipCode}`);
      console.log(`Double Rewards: ${hasDoubleRewards ? 'YES' : 'NO'}`);
      console.log(`Points Awarded: +${pointsToAward}\n`);

      res.json({
        success: true,
        message: `You earned ${pointsToAward} points!`,
        pointsEarned: pointsToAward,
        checkIn,
      });
    } catch (error) {
      console.error("Error during check-in:", error);
      res.status(500).json({ message: "Failed to process check-in" });
    }
  });

  // Configure multer for logo uploads (in-memory storage for base64 conversion)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Logo upload endpoint
  app.post("/api/upload/logo", isAuthenticated, upload.single('logo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Convert image to base64 data URL
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

      // Update user's logo
      await storage.updateUser(req.user.id, { logoUrl: dataUrl });

      res.json({ 
        logoUrl: dataUrl,
        message: "Logo uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // ZIP code to location lookup (for auto-filling city/state)
  app.get("/api/zip-to-location", async (req, res) => {
    try {
      const { zip } = req.query;
      
      if (!zip || typeof zip !== 'string') {
        return res.status(400).json({ message: "ZIP code required" });
      }
      
      const zipcodes = await import('zipcodes');
      const location = zipcodes.default.lookup(zip);
      
      if (!location) {
        return res.status(404).json({ message: "ZIP code not found" });
      }
      
      res.json({
        city: location.city,
        state: location.state,
        zip: location.zip
      });
    } catch (error) {
      console.error('ZIP lookup error:', error);
      res.status(500).json({ message: "Failed to lookup ZIP code" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by verification token
      const user = await storage.getUserByVerificationToken(token);
      if (!user) {
        return res.status(404).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
        return res.status(400).json({ message: "Verification token has expired" });
      }

      // Mark user as verified
      await storage.verifyUserEmail(user.id);

      res.json({ 
        message: "Email verified successfully! You can now log in.",
        emailVerified: true
      });
    } catch (error) {
      console.error("Error during verification:", error);
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.json(null);
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.json(null);
      }
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get SMS budget information for current merchant
  app.get("/api/sms-budget", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.session.userId;
      const budgetInfo = await storage.checkSmsBudget(merchantId, 1);
      res.json(budgetInfo);
    } catch (error) {
      console.error("Error fetching SMS budget:", error);
      res.status(500).json({ message: "Failed to fetch SMS budget" });
    }
  });

  // Update onboarding progress
  app.patch("/api/auth/onboarding", isAuthenticated, async (req: any, res) => {
    try {
      const { stepId, completed } = req.body;
      
      if (!stepId || typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Step ID and completion status required" });
      }

      const userId = req.user.id;
      const currentProgress = req.user.onboardingProgress || {};
      const updatedProgress = { ...currentProgress, [stepId]: completed };

      await storage.updateOnboardingProgress(userId, updatedProgress);

      res.json({ 
        message: "Progress updated successfully",
        onboardingProgress: updatedProgress
      });
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Only expose public merchant information (no email or sensitive data)
      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };
      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/merchants", async (req: any, res) => {
    try {
      const merchants = await storage.getMerchantsWithActiveOffers();
      res.json(merchants);
    } catch (error) {
      console.error("Error fetching merchants:", error);
      res.status(500).json({ message: "Failed to fetch merchants" });
    }
  });

  app.get("/api/offers", async (req: any, res) => {
    try {
      // Get all active offers
      const allOffers = await storage.getAllActiveOffers();
      
      // Optional: Filter by ZIP if provided in query params
      const filterZip = req.query.zip as string | undefined;
      
      if (filterZip) {
        // Filter offers by ZIP proximity (10 miles)
        const localOffers = allOffers.filter((offer) => {
          return offer.zipCode && isWithinRadius(filterZip, offer.zipCode, 10);
        });
        return res.json(localOffers);
      }
      
      // No filter - return all offers (anonymous browsing)
      res.json(allOffers);
    } catch (error) {
      console.error("Error fetching offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.get("/api/offers/:id", async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      await storage.incrementOfferViews(req.params.id);
      res.json(offer);
    } catch (error) {
      console.error("Error fetching offer:", error);
      res.status(500).json({ message: "Failed to fetch offer" });
    }
  });

  app.get("/api/my-offers", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const offers = await storage.getOffersByMerchant(merchantId);
      // Prevent caching to ensure UI updates immediately after changes
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(offers);
    } catch (error) {
      console.error("Error fetching merchant offers:", error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  app.get("/api/my-menu-items", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const menuItems = await storage.getUniqueMenuItemsByMerchant(merchantId);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/offer-claim-stats/:offerId", isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getOfferClaimStats(req.params.offerId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching offer claim stats:", error);
      res.status(500).json({ message: "Failed to fetch claim stats" });
    }
  });

  app.post("/api/offers", isAuthenticated, async (req: any, res) => {
    try {
      // Check if email is verified before allowing campaign creation
      if (!req.user.emailVerified) {
        return res.status(403).json({ 
          message: "Email verification required. Please verify your email before creating campaigns.",
          emailVerified: false
        });
      }

      const merchantId = req.user.id;
      const merchantTier = req.user.membershipTier || "NEST";
      
      // Validate with Zod schema
      const validatedData = insertOfferSchema.parse(req.body);
      
      const isDraft = validatedData.status === "draft";
      
      // Additional validation for non-draft offers
      if (!isDraft) {
        const errors: string[] = [];
        
        if (!validatedData.title?.trim()) errors.push("Offer Title is required");
        if (!validatedData.description?.trim()) errors.push("Description is required");
        if (!validatedData.menuItem?.trim()) errors.push("Menu Item name is required");
        if (!validatedData.originalPrice?.trim()) errors.push("Original Price is required");
        if (!validatedData.zipCode?.trim()) errors.push("ZIP Code is required");
        if (!validatedData.maxClicksAllowed || validatedData.maxClicksAllowed < 1) {
          errors.push("Maximum Clicks Allowed must be at least 1");
        }
        if (validatedData.clickBudgetDollars === null || validatedData.clickBudgetDollars === undefined || validatedData.clickBudgetDollars < 0) {
          errors.push("Click Budget is required (enter 0 if not using)");
        }
        if (!validatedData.startDate) errors.push("Start Date is required");
        if (!validatedData.endDate) errors.push("End Date is required");
        
        if (errors.length > 0) {
          return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: "Please fix the following issues",
            details: errors
          });
        }
      }
      
      // Tier validation (skip for drafts - drafts can contain any fields for feature discovery)
      if (!isDraft) {
        // Validate against tier capabilities
        const tierValidation = validateOfferAgainstTier(validatedData, merchantTier, "active");
        if (!tierValidation.valid) {
          return res.status(403).json({
            message: "Tier limitations exceeded",
            errors: tierValidation.errors.map(err => ({
              field: err.field,
              message: err.message,
              upgradeRequired: err.upgradeRequired
            }))
          });
        }
        
        // Validate active offer count
        const countValidation = await validateActiveOfferCount(merchantId, merchantTier, undefined, storage);
        if (!countValidation.valid) {
          return res.status(403).json({
            message: "Active offer limit exceeded",
            errors: countValidation.errors.map(err => ({
              field: err.field,
              message: err.message,
              upgradeRequired: err.upgradeRequired
            }))
          });
        }
        
        // Additional validation: 2-hour minimum for endDate (only for published offers)
        const endDateValidation = validateMinimumDuration(validatedData.endDate);
        if (!endDateValidation.valid) {
          return res.status(400).json(createFieldError("endDate", endDateValidation.message!));
        }
        
        // Check bank balance if Get New Customers is enabled (only for published offers)
        if (validatedData.getNewCustomersEnabled) {
          const merchantBank = parseFloat(req.user.merchantBank as any || "0");
          const MINIMUM_BALANCE = 1.65; // $1.65 for at least one new customer
          if (merchantBank < MINIMUM_BALANCE) {
            return res.status(400).json(createFieldError(
              "getNewCustomersEnabled",
              `Insufficient bank balance ($${merchantBank.toFixed(2)}). Please add funds to enable customer acquisition.`
            ));
          }
        }
      }
      
      // Auto-generate a folder for this campaign with naming convention (only if not already provided)
      if (!validatedData.campaignFolder) {
        // Offer type codes: PCT (percentage), DOL (dollar_amount), BOGO (bogo), XY (spend_threshold), XYF (buy_x_get_y)
        const offerTypeCode: Record<string, string> = {
          percentage: "PCT",
          dollar_amount: "DOL",
          bogo: "BOGO",
          spend_threshold: "XY",
          buy_x_get_y: "XYF"
        };
        
        // Redemption type codes: RC (regular coupon), PPO (pre-payment offer)
        const redemptionTypeCode: Record<string, string> = {
          coupon: "RC",
          prepayment_offer: "PPO"
        };
        
        // Delivery method codes: 1-5
        const deliveryMethodCode: Record<string, string> = {
          text_message_alerts: "1",
          coupon_codes: "2",
          mobile_app_based_coupons: "3",
          mms_based_coupons: "4",
          mobile_wallet_passes: "5"
        };
        
        const typeCode = offerTypeCode[validatedData.offerType as string] || "OTHER";
        const redemptionCode = redemptionTypeCode[validatedData.redemptionType as string] || "RC";
        const deliveryCode = validatedData.couponDeliveryMethod 
          ? deliveryMethodCode[validatedData.couponDeliveryMethod as string] || "1"
          : "1";
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // MM
        const day = now.getDate(); // D (no leading zero)
        const year = now.getFullYear(); // YYYY
        
        // Convention: TYPE-REDEMPTION-DELIVERY-MM_D_YYYY
        const folderName = `${typeCode}-${redemptionCode}-${deliveryCode}-${month}_${day}_${year}`;
        const folder = await storage.createCampaignFolder(merchantId, folderName);
        
        // Assign the folder to the offer
        validatedData.campaignFolder = folder.id;
      }
      
      const offer = await storage.createOffer(merchantId, validatedData);
      res.status(201).json(offer);
    } catch (error: any) {
      console.error("Error creating offer:", error);
      if (error.name === "ZodError") {
        // Return standardized field-level errors
        return res.status(400).json(formatZodErrors(error));
      }
      res.status(500).json({ message: "Failed to create offer" });
    }
  });

  app.patch("/api/offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const merchantTier = req.user.membershipTier || "NEST";
      
      // Get the existing offer to check current status
      const existingOffer = await storage.getOffer(req.params.id);
      if (!existingOffer || existingOffer.merchantId !== merchantId) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      
      // Check if offer is in a locked folder (prevents editing promoted campaigns)
      if (existingOffer.campaignFolder) {
        const folders = await storage.getCampaignFolders(merchantId);
        const folder = folders.find(f => f.id === existingOffer.campaignFolder);
        if (folder?.isLocked) {
          return res.status(403).json({ 
            message: "This offer cannot be edited because it's in a promoted campaign. Campaign data is locked to maintain analytics integrity."
          });
        }
      }
      
      // Check if budgets are being updated and handle deduction from merchant's available budgets
      const oldTextBudget = parseFloat(existingOffer.textBudgetDollars as any || "0");
      const oldRipsBudget = parseFloat(existingOffer.ripsBudgetDollars as any || "0");
      const newTextBudget = req.body.textBudgetDollars !== undefined ? parseFloat(req.body.textBudgetDollars) : oldTextBudget;
      const newRipsBudget = req.body.ripsBudgetDollars !== undefined ? parseFloat(req.body.ripsBudgetDollars) : oldRipsBudget;
      
      const textDiff = newTextBudget - oldTextBudget;
      const ripsDiff = newRipsBudget - oldRipsBudget;
      
      // If budgets are increasing, check available merchant budgets and deduct
      if (textDiff > 0 || ripsDiff > 0) {
        const merchantTextBudget = parseFloat(req.user.merchantTextBudget as any || "0");
        const merchantRipsBudget = parseFloat(req.user.merchantRipsBudget as any || "0");
        
        if (textDiff > merchantTextBudget) {
          return res.status(400).json({ 
            message: `Insufficient Text $ available. You need $${Math.round(textDiff)} but only have $${Math.round(merchantTextBudget)} available.` 
          });
        }
        
        if (ripsDiff > merchantRipsBudget) {
          return res.status(400).json({ 
            message: `Insufficient RIPS $ available. You need $${Math.round(ripsDiff)} but only have $${Math.round(merchantRipsBudget)} available.` 
          });
        }
        
        // Deduct from merchant's available budgets
        await storage.deductMerchantBudgets(merchantId, textDiff, ripsDiff);
      }
      
      // If budgets are decreasing, return funds to merchant's available budgets
      if (textDiff < 0 || ripsDiff < 0) {
        await storage.addToMerchantBudgets(merchantId, Math.abs(textDiff), Math.abs(ripsDiff));
      }
      
      // Merge existing offer with updates to get complete offer data
      const updatedData = { ...existingOffer, ...req.body };
      const newStatus = req.body.status || existingOffer.status;
      const isBecomingActive = existingOffer.status === "draft" && newStatus === "active";
      const isAlreadyActive = existingOffer.status === "active";
      
      // Prevent activation if offer needs reintegration
      if (isBecomingActive && existingOffer.needsReintegration) {
        return res.status(400).json({ 
          message: "This offer must be reintegrated before it can be activated. Click the Reintegrate button first." 
        });
      }
      
      // Tier validation when activating draft or updating active offer
      if (isBecomingActive || isAlreadyActive) {
        // Ensure endDate exists for active offers
        if (!updatedData.endDate) {
          return res.status(400).json(createFieldError("endDate", "End date is required for active offers"));
        }
        
        // Validate endDate is a valid date
        const endDate = new Date(updatedData.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json(createFieldError("endDate", "Invalid end date format"));
        }
        
        // Validate against tier capabilities
        const tierValidation = validateOfferAgainstTier(updatedData, merchantTier, "active");
        if (!tierValidation.valid) {
          return res.status(403).json({
            message: "Tier limitations exceeded",
            errors: tierValidation.errors.map(err => ({
              field: err.field,
              message: err.message,
              upgradeRequired: err.upgradeRequired
            }))
          });
        }
        
        // Validate active offer count (only when activating a draft)
        if (isBecomingActive) {
          const countValidation = await validateActiveOfferCount(merchantId, merchantTier, existingOffer.id, storage);
          if (!countValidation.valid) {
            return res.status(403).json({
              message: "Active offer limit exceeded",
              errors: countValidation.errors.map(err => ({
                field: err.field,
                message: err.message,
                upgradeRequired: err.upgradeRequired
              }))
            });
          }
        }
        
        // 2-hour minimum validation for active offers
        const endDateValidation = validateMinimumDuration(endDate);
        if (!endDateValidation.valid) {
          return res.status(400).json(createFieldError("endDate", endDateValidation.message!));
        }
        
        // Bank balance validation for customer acquisition
        if (updatedData.getNewCustomersEnabled) {
          const merchantBank = parseFloat(req.user.merchantBank as any || "0");
          const MINIMUM_BALANCE = 1.65;
          if (merchantBank < MINIMUM_BALANCE) {
            return res.status(400).json(createFieldError(
              "getNewCustomersEnabled",
              `Insufficient bank balance ($${merchantBank.toFixed(2)}). Please add funds to enable customer acquisition.`
            ));
          }
        }
      }
      
      const offer = await storage.updateOffer(req.params.id, merchantId, req.body);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      res.json(offer);
    } catch (error: any) {
      console.error("Error updating offer:", error);
      res.status(500).json({ message: "Failed to update offer" });
    }
  });

  app.delete("/api/offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const deleted = await storage.deleteOffer(req.params.id, merchantId);
      if (!deleted) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      res.json({ message: "Offer deleted successfully" });
    } catch (error) {
      console.error("Error deleting offer:", error);
      res.status(500).json({ message: "Failed to delete offer" });
    }
  });

  app.post("/api/offers/:id/resurrect", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const resurrected = await storage.resurrectOffer(req.params.id, merchantId);
      if (!resurrected) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      res.json({ message: "Offer resurrected successfully" });
    } catch (error) {
      console.error("Error resurrecting offer:", error);
      res.status(500).json({ message: "Failed to resurrect offer" });
    }
  });

  app.post("/api/offers/:id/reintegrate", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const reintegrated = await storage.reintegrateOffer(req.params.id, merchantId);
      if (!reintegrated) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      res.json({ message: "Offer reintegrated successfully" });
    } catch (error) {
      console.error("Error reintegrating offer:", error);
      res.status(500).json({ message: "Failed to reintegrate offer" });
    }
  });

  app.delete("/api/offers/:id/permanent", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const deleted = await storage.permanentDeleteOffer(req.params.id, merchantId);
      if (!deleted) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      res.json({ message: "Offer permanently deleted" });
    } catch (error) {
      console.error("Error permanently deleting offer:", error);
      res.status(500).json({ message: "Failed to permanently delete offer" });
    }
  });

  app.delete("/api/offers/batch/delete-all/:stage", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const stage = req.params.stage; // "stage1" or "stage2"
      
      if (stage !== "stage1" && stage !== "stage2") {
        return res.status(400).json({ message: "Invalid stage parameter. Must be 'stage1' or 'stage2'" });
      }

      // Get all offers for this merchant
      const allOffers = await storage.getOffersByMerchant(merchantId);
      
      // Stage 1: Delete ALL draft offers (both single drafts and batch offers)
      // Stage 2: Delete batch offers in folder2
      const offersToDelete = allOffers.filter((offer: any) => {
        if (offer.isDeleted) return false;
        
        if (stage === "stage1") {
          // Stage 1: Include both single drafts (batchPendingSelection=false, status=draft)
          // AND batch offers (batchPendingSelection=true, completionStage=folder1)
          return (offer.status === "draft" && !offer.batchPendingSelection) ||
                 (offer.batchPendingSelection === true && offer.completionStage === "folder1");
        } else {
          // Stage 2: Only batch offers in folder2
          return offer.batchPendingSelection === true && offer.completionStage === "folder2";
        }
      });

      // Delete all matching offers
      let deletedCount = 0;
      for (const offer of offersToDelete) {
        const deleted = await storage.deleteOffer(offer.id, merchantId);
        if (deleted) {
          deletedCount++;
        }
      }

      res.json({ 
        message: `Successfully deleted ${deletedCount} offer(s) from ${stage}`,
        count: deletedCount 
      });
    } catch (error) {
      console.error("Error deleting all offers:", error);
      res.status(500).json({ message: "Failed to delete offers" });
    }
  });

  app.post("/api/offers/:id/sales", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const quantity = req.body.quantity || 1;
      const offer = await storage.incrementUnitsSold(req.params.id, merchantId, quantity);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }
      res.json(offer);
    } catch (error) {
      console.error("Error incrementing units sold:", error);
      res.status(500).json({ message: "Failed to update sales" });
    }
  });

  app.post("/api/offers/:id/duplicate", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const sourceOfferId = req.params.id;
      const { campaignFolder } = req.body || {};

      // Get the source offer
      const sourceOffer = await storage.getOffer(sourceOfferId);
      
      if (!sourceOffer || sourceOffer.merchantId !== merchantId) {
        return res.status(404).json({ message: "Offer not found or unauthorized" });
      }

      if (sourceOffer.isDeleted) {
        return res.status(400).json({ message: "Cannot duplicate a deleted offer" });
      }

      // Build new offer data - copy all fields except metrics and lifecycle timestamps
      const newOfferData: any = {
        title: sourceOffer.title + " (Copy)",
        description: sourceOffer.description,
        menuItem: sourceOffer.menuItem,
        
        // Offer type and type-specific fields
        offerType: sourceOffer.offerType,
        percentageOff: sourceOffer.percentageOff,
        dollarOff: sourceOffer.dollarOff,
        buyQuantity: sourceOffer.buyQuantity,
        getQuantity: sourceOffer.getQuantity,
        bogoPercentageOff: sourceOffer.bogoPercentageOff,
        spendThreshold: sourceOffer.spendThreshold,
        thresholdDiscount: sourceOffer.thresholdDiscount,
        
        // Legacy fields
        discount: sourceOffer.discount,
        originalPrice: sourceOffer.originalPrice,
        
        imageUrl: sourceOffer.imageUrl,
        videoUrl: sourceOffer.videoUrl,
        zipCode: sourceOffer.zipCode,
        
        // Redemption type and related fields
        redemptionType: sourceOffer.redemptionType,
        couponDeliveryMethod: sourceOffer.couponDeliveryMethod,
        deliveryConfig: sourceOffer.deliveryConfig,
        purchaseUrl: sourceOffer.purchaseUrl,
        couponCode: sourceOffer.couponCode,
        
        // Add type and countdown fields
        addType: sourceOffer.addType,
        countdownDays: sourceOffer.countdownDays,
        countdownHours: sourceOffer.countdownHours,
        countdownMinutes: sourceOffer.countdownMinutes,
        countdownSeconds: sourceOffer.countdownSeconds,
        
        // Maximum clicks management
        maxClicksAllowed: sourceOffer.maxClicksAllowed,
        shutDownAtMaximum: sourceOffer.shutDownAtMaximum,
        notifyAtMaximum: sourceOffer.notifyAtMaximum,
        clickBudgetDollars: sourceOffer.clickBudgetDollars,
        
        // Status: always create as draft for manual scheduling (Flow 1 from blueprint)
        status: "draft",
        
        // Dates: copy from source (merchant can edit in edit screen)
        startDate: sourceOffer.startDate,
        endDate: sourceOffer.endDate,
        
        // Sales tracking and auto-extend fields
        targetUnits: sourceOffer.targetUnits,
        autoExtend: sourceOffer.autoExtend,
        extensionDays: sourceOffer.extensionDays,
        notifyOnShortfall: sourceOffer.notifyOnShortfall,
        
        // SMS notification preferences
        notifyOnTargetMet: sourceOffer.notifyOnTargetMet,
        notifyOnPoorPerformance: sourceOffer.notifyOnPoorPerformance,
        
        // Campaign organization - use provided folder or inherit from source
        campaignFolder: campaignFolder || sourceOffer.campaignFolder,
        
        // Customer acquisition
        getNewCustomersEnabled: sourceOffer.getNewCustomersEnabled,
        
        // Reset metrics to 0
        views: "0",
        unitsSold: 0,
        
        // Soft delete flags - always false for new copy
        isDeleted: false,
        needsReintegration: false,
        
        // Lifecycle timestamps - always null for new copy
        lastAutoExtendedAt: null,
        activatedAt: null,
        
        // Duplication tracking
        sourceOfferId: sourceOffer.id,
      };

      // Optional: basic validation on dates if scheduling immediately
      if (scheduleImmediately && newOfferData.startDate && newOfferData.endDate) {
        const start = new Date(newOfferData.startDate);
        const end = new Date(newOfferData.endDate);
        
        if (end <= start) {
          return res.status(422).json({ message: "End date must be after start date" });
        }
      }

      // Create the duplicate offer
      const duplicatedOffer = await storage.createOffer(merchantId, newOfferData);
      
      res.status(201).json({ offer: duplicatedOffer });
    } catch (error: any) {
      console.error("Error duplicating offer:", error);
      res.status(500).json({ message: "Failed to duplicate offer" });
    }
  });


  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const notifications = await storage.getNotifications(merchantId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const updated = await storage.markNotificationRead(req.params.id, merchantId);
      if (!updated) {
        return res.status(404).json({ message: "Notification not found or unauthorized" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Notification preferences endpoints
  app.get("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const prefs = await storage.getOrCreateNotificationPreferences(merchantId);
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.patch("/api/notifications/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      
      // Validate request body with Zod
      const prefsData = insertNotificationPreferencesSchema.partial().parse(req.body);
      
      const updated = await storage.updateNotificationPreferences(merchantId, prefsData);
      if (!updated) {
        return res.status(404).json({ message: "Failed to update preferences" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating notification preferences:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid preferences data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Coordinate to ZIP conversion endpoint
  app.post("/api/location/find-zip", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: "Valid latitude and longitude are required" });
      }
      
      const zipCode = findClosestZip(latitude, longitude);
      
      if (!zipCode) {
        return res.status(404).json({ message: "Could not determine ZIP code from coordinates" });
      }
      
      res.json({ zipCode });
    } catch (error) {
      console.error("Error finding ZIP from coordinates:", error);
      res.status(500).json({ message: "Failed to determine ZIP code" });
    }
  });

  // Customer SMS signup and verification endpoints
  app.post("/api/customers/request-code", async (req, res) => {
    try {
      const { phoneNumber, zipCode } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      if (!zipCode) {
        return res.status(400).json({ message: "ZIP code is required" });
      }

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Check if customer exists
      let customer = await storage.getCustomerByPhone(phoneNumber);
      
      if (customer) {
        // Update existing customer with new code and ZIP
        customer = await storage.updateCustomer(customer.id, {
          zipCode,
          verificationCode,
          verificationExpiry,
          verified: false,
        });
      } else {
        // Create new customer
        customer = await storage.createCustomer({
          phoneNumber,
          zipCode,
          verificationCode,
          verificationExpiry,
          verified: false,
        });
      }

      // TODO: Send SMS with verification code using Twilio
      // For now, return the code in development (remove in production!)
      console.log(`Verification code for ${phoneNumber}: ${verificationCode}`);
      
      if (!customer) {
        return res.status(500).json({ message: "Failed to create customer" });
      }
      
      res.json({ 
        message: "Verification code sent",
        customerId: customer.id,
      });
    } catch (error) {
      console.error("Error requesting verification code:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  app.post("/api/customers/verify", async (req, res) => {
    try {
      const { phoneNumber, code } = req.body;
      if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and code are required" });
      }

      const customer = await storage.getCustomerByPhone(phoneNumber);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Check if code matches and hasn't expired
      if (customer.verificationCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      if (customer.verificationExpiry && customer.verificationExpiry < new Date()) {
        return res.status(400).json({ message: "Verification code has expired" });
      }

      // Verify customer
      const verifiedCustomer = await storage.verifyCustomer(customer.id);
      
      // Store customer ID in session
      (req.session as any).customerId = verifiedCustomer!.id;
      
      res.json({ 
        message: "Phone verified successfully",
        customer: {
          id: verifiedCustomer!.id,
          phoneNumber: verifiedCustomer!.phoneNumber,
          verified: verifiedCustomer!.verified,
        },
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.get("/api/customers/me", async (req: any, res) => {
    try {
      const customerId = req.session?.customerId;
      if (!customerId) {
        return res.json(null);
      }

      const customer = await storage.getCustomer(customerId);
      if (!customer || !customer.verified) {
        req.session.customerId = null;
        return res.json(null);
      }

      // Get following list
      const following = await storage.getCustomerFollowing(customerId);

      res.json({
        id: customer.id,
        phoneNumber: customer.phoneNumber,
        zipCode: customer.zipCode,
        verified: customer.verified,
        following,
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer data" });
    }
  });

  // Claim offer and send coupon via SMS
  app.post("/api/offers/:id/claim", isCustomerAuthenticated, async (req: any, res) => {
    try {
      // Customer is already validated by isCustomerAuthenticated middleware
      const customer = req.customer;

      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Check if offer has expired
      if (new Date(offer.endDate) < new Date()) {
        return res.status(400).json({ message: "Offer has expired" });
      }

      // Check for referral tracking
      const { referralCode } = req.body;
      let referralAwarded = false;
      
      if (referralCode) {
        const referral = await storage.getReferralByCode(referralCode);
        
        // Award points if referral is valid and hasn't been claimed yet
        if (referral && referral.status === 'pending') {
          let basePoints = calculateReferralPoints(offer.offerType);
          let pointsToAward = basePoints;
          
          // Check if referrer has complete demographic info for double rewards
          const referrerCustomer = await storage.getCustomerByPhone(referral.referrerPhone);
          const hasDoubleRewards = !!(referrerCustomer?.dateOfBirth && referrerCustomer?.sex);
          
          if (hasDoubleRewards) {
            pointsToAward = basePoints * 2;
          }
          
          // Note: For now, create a placeholder claim ID
          // In future, we could create an actual claim record here
          const claimId = 'claim-' + Date.now();
          
          // Update referral as claimed
          await storage.markReferralClaimed(
            referralCode,
            customer.phoneNumber,
            claimId,
            pointsToAward
          );
          
          // Update referrer's points balance (no distance restrictions!)
          await storage.updateCustomerPoints(referral.referrerPhone, pointsToAward);
          
          referralAwarded = true;
          
          console.log(`\n✨ REFERRAL POINTS AWARDED!`);
          console.log(`Referrer: ${referral.referrerPhone}`);
          console.log(`Friend: ${customer.phoneNumber}`);
          console.log(`Base Points: ${basePoints}`);
          console.log(`Double Rewards: ${hasDoubleRewards ? 'YES' : 'NO'}`);
          console.log(`Points Awarded: +${pointsToAward}`);
          console.log(`Offer: ${offer.title}\n`);
        }
      }

      // Check merchant's SMS budget before sending
      const budgetCheck = await storage.checkSmsBudget(offer.merchantId, 1);
      
      if (!budgetCheck.allowed) {
        console.error(`\n❌ BUDGET EXCEEDED for merchant ${offer.merchantId}`);
        console.error(`Tier: ${budgetCheck.tierName}`);
        console.error(`Monthly Limit: ${budgetCheck.monthlyLimit}`);
        console.error(`Current Usage: ${budgetCheck.currentUsage}`);
        console.error(`Remaining: ${budgetCheck.remaining}\n`);
        
        return res.status(403).json({ 
          message: "The merchant has reached their monthly text message limit. Please contact the merchant directly to redeem this offer.",
          budgetExceeded: true,
          tierName: budgetCheck.tierName,
          monthlyLimit: budgetCheck.monthlyLimit,
        });
      }

      // Build SMS message
      let smsMessage = `🎉 ${offer.title}\n\n`;
      
      if (offer.couponCode) {
        smsMessage += `Coupon Code: ${offer.couponCode}\n\n`;
      }
      
      smsMessage += `${offer.description}\n\n`;
      smsMessage += `Offer expires: ${new Date(offer.endDate).toLocaleString()}\n\n`;
      
      if (offer.redemptionType === "prepayment_offer" && offer.purchaseUrl) {
        smsMessage += `Buy now: ${offer.purchaseUrl}`;
      } else if (!offer.couponCode) {
        smsMessage += `Show this text to redeem your offer!`;
      }

      console.log(`\n=== SMS COUPON DELIVERY ===`);
      console.log(`To: ${customer.phoneNumber}`);
      console.log(`Merchant Budget:`);
      console.log(`  - Tier: ${budgetCheck.tierName}`);
      console.log(`  - Usage: ${budgetCheck.currentUsage}/${budgetCheck.monthlyLimit}`);
      console.log(`  - Cost: ${budgetCheck.costPerText}¢ per text`);
      console.log(`  - This text: ${budgetCheck.totalCost}¢`);
      console.log(`Message: ${smsMessage}`);
      console.log(`==========================\n`);

      // TODO: Actually send SMS with Twilio here
      // For now, simulate successful send
      const smsSent = true;

      if (smsSent) {
        // Increment SMS usage after successful send
        await storage.incrementSmsUsage(offer.merchantId, 1);
      }

      res.json({ 
        message: referralAwarded 
          ? "Coupon sent! Your friend earned referral points!" 
          : "Coupon sent to your phone!",
        phoneNumber: customer.phoneNumber,
        referralAwarded,
        // Remove this in production with Twilio!
        devMessage: process.env.NODE_ENV === 'development' ? smsMessage : undefined,
      });
    } catch (error) {
      console.error("Error claiming offer:", error);
      res.status(500).json({ message: "Failed to claim offer" });
    }
  });

  // Merchant follower endpoints
  app.post("/api/customers/follow/:merchantId", async (req: any, res) => {
    try {
      const customerId = req.session?.customerId;
      if (!customerId) {
        return res.status(401).json({ message: "Customer not authenticated" });
      }

      const { merchantId } = req.params;
      
      // Verify merchant exists
      const merchant = await storage.getUser(merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      const follower = await storage.followMerchant(customerId, merchantId);
      res.json({ message: "Successfully following merchant", follower });
    } catch (error) {
      console.error("Error following merchant:", error);
      res.status(500).json({ message: "Failed to follow merchant" });
    }
  });

  app.delete("/api/customers/follow/:merchantId", async (req: any, res) => {
    try {
      const customerId = req.session?.customerId;
      if (!customerId) {
        return res.status(401).json({ message: "Customer not authenticated" });
      }

      const { merchantId } = req.params;
      const unfollowed = await storage.unfollowMerchant(customerId, merchantId);
      
      if (!unfollowed) {
        return res.status(404).json({ message: "Not following this merchant" });
      }

      res.json({ message: "Successfully unfollowed merchant" });
    } catch (error) {
      console.error("Error unfollowing merchant:", error);
      res.status(500).json({ message: "Failed to unfollow merchant" });
    }
  });

  app.get("/api/customers/following", async (req: any, res) => {
    try {
      const customerId = req.session?.customerId;
      if (!customerId) {
        return res.json([]);
      }

      const merchantIds = await storage.getCustomerFollowing(customerId);
      res.json(merchantIds);
    } catch (error) {
      console.error("Error fetching following list:", error);
      res.status(500).json({ message: "Failed to fetch following list" });
    }
  });

  app.get("/api/merchants/:merchantId/followers", async (req, res) => {
    try {
      const { merchantId } = req.params;
      const count = await storage.getMerchantFollowerCount(merchantId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching follower count:", error);
      res.status(500).json({ message: "Failed to fetch follower count" });
    }
  });

  // Referral system endpoints
  
  // Create a referral and send SMS to friend
  // RIPS: Deducts share cost from merchant's RIPS budget
  app.post("/api/referrals/create", async (req, res) => {
    try {
      const { offerId, referrerPhone, referrerZip, friendPhone, friendZip, viewedAt } = req.body;

      if (!offerId || !referrerPhone || !referrerZip || !friendPhone || !friendZip) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify offer exists
      const offer = await storage.getOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }

      // Get merchant details to check location and tier
      const merchant = await storage.getUserById(offer.merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }

      // Validate that friend is within 10 miles of merchant location
      const isLocal = isWithinRadius(merchant.zipCode, friendZip, 10);
      if (!isLocal) {
        return res.status(400).json({ 
          message: "Your friend must be within 10 miles of this merchant to receive this deal" 
        });
      }

      // RIPS: Check if offer has Get New Customers enabled and deduct share cost
      let shareCostDeducted = 0;
      if (offer.getNewCustomersEnabled) {
        const merchantTier = (merchant.membershipTier || "NEST") as MembershipTier;
        const shareCost = getRipsShareCost(merchantTier);
        const currentRipsBudget = parseFloat(merchant.merchantRipsBudget as any) || 0;

        // Check if merchant has enough RIPS budget
        if (currentRipsBudget < shareCost) {
          return res.status(400).json({ 
            message: "Merchant's RIPS budget is too low to process this share. Please contact the business." 
          });
        }

        // Deduct share cost from merchant's RIPS budget
        await storage.deductMerchantBudgets(merchant.id, 0, shareCost);
        shareCostDeducted = shareCost;

        console.log(`\n💰 RIPS SHARE COST DEDUCTED`);
        console.log(`Merchant: ${merchant.businessName} (${merchantTier})`);
        console.log(`Share Cost: $${shareCost.toFixed(2)}`);
        console.log(`Previous RIPS Budget: $${currentRipsBudget.toFixed(2)}`);
        console.log(`New RIPS Budget: $${(currentRipsBudget - shareCost).toFixed(2)}\n`);
      }

      // Generate unique referral code
      const referralCode = generateReferralCode();
      const referralUrl = generateReferralUrl(referralCode);

      // Create referral record
      const referral = await storage.createReferral({
        referralCode,
        offerId,
        referrerPhone,
        referrerZip,
        friendPhone: null, // Will be set when friend claims
        status: 'pending',
        pointsEarned: 0,
        claimId: null,
        viewedAt: viewedAt ? new Date(viewedAt) : undefined,
      });

      // Build SMS message with referral link
      const smsMessage = `Your friend shared a deal with you!\n\n${offer.title}\n\nCheck it out: ${referralUrl}\n\n- Urly Byrd`;

      // TODO: Send SMS with Twilio
      // For now, log in development mode
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📱 REFERRAL SMS`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`From: ${referrerPhone}`);
      console.log(`To: ${friendPhone}`);
      console.log(`Referral Code: ${referralCode}`);
      console.log(`Referral URL: ${referralUrl}`);
      console.log(``);
      console.log(`Message:`);
      console.log(smsMessage);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      res.json({
        message: "Referral created and SMS sent!",
        referralCode,
        referralUrl,
        shareCostDeducted,
        // Remove in production with Twilio
        devMessage: process.env.NODE_ENV === 'development' ? smsMessage : undefined,
      });
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ message: "Failed to create referral" });
    }
  });

  // Get referral by code (for tracking when friend clicks link)
  app.get("/api/referrals/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referral = await storage.getReferralByCode(code);

      if (!referral) {
        return res.status(404).json({ message: "Referral not found" });
      }

      // Get associated offer
      const offer = await storage.getOffer(referral.offerId);
      
      res.json({
        referral,
        offer,
      });
    } catch (error) {
      console.error("Error fetching referral:", error);
      res.status(500).json({ message: "Failed to fetch referral" });
    }
  });

  // Get customer's referral history and points
  app.get("/api/referrals/customer/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      
      // Get all referrals made by this customer
      const referrals = await storage.getReferralsByPhone(phone);
      
      // Get customer points
      const points = await storage.getCustomerPoints(phone);

      res.json({
        referrals,
        totalPoints: points?.totalPoints || 0,
      });
    } catch (error) {
      console.error("Error fetching customer referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Referral redirect route - /r/:referralCode
  app.get("/r/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referral = await storage.getReferralByCode(code);

      if (!referral) {
        // Redirect to home if referral not found
        return res.redirect("/");
      }

      // Redirect to offer detail page with referral tracking in query params
      res.redirect(`/offers/${referral.offerId}?ref=${code}`);
    } catch (error) {
      console.error("Error processing referral redirect:", error);
      res.redirect("/");
    }
  });

  // Merchant customer import endpoints
  
  // Import customers from CSV data
  app.post("/api/merchant-customers/import", isAuthenticated, async (req: any, res) => {
    try {
      const { csvData } = req.body;
      const merchantId = req.user.id;

      if (!csvData || typeof csvData !== 'string') {
        return res.status(400).json({ message: "CSV data is required" });
      }

      // Parse CSV data (simple CSV parser)
      const lines = csvData.trim().split('\n');
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must contain at least a header row and one data row" });
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required headers
      const requiredHeaders = ['phone'];
      const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
      
      if (!hasRequiredHeaders) {
        return res.status(400).json({ 
          message: "CSV must contain 'phone' column. Optional columns: firstname, lastname, email, zip, notes" 
        });
      }

      // Parse data rows
      const customersData = [];
      const errors = [];
      const importBatchId = `batch_${Date.now()}`;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = line.split(',').map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate phone number (required)
        const phoneNumber = row.phone || row.phonenumber || row.phonenumber;
        if (!phoneNumber) {
          errors.push(`Row ${i + 1}: Phone number is required`);
          continue;
        }

        // Clean phone number (remove non-digits)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          errors.push(`Row ${i + 1}: Invalid phone number format`);
          continue;
        }

        customersData.push({
          phoneNumber: cleanPhone,
          firstName: row.firstname || row.first_name || null,
          lastName: row.lastname || row.last_name || null,
          email: row.email || null,
          zipCode: row.zip || row.zipcode || row.zip_code || null,
          notes: row.notes || null,
          source: 'csv_import' as const,
          importBatchId,
        });
      }

      if (customersData.length === 0) {
        return res.status(400).json({ 
          message: "No valid customer records found in CSV", 
          errors 
        });
      }

      // Bulk insert customers
      const importedCustomers = await storage.bulkCreateMerchantCustomers(merchantId, customersData);

      res.json({
        success: true,
        imported: importedCustomers.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${importedCustomers.length} customers${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      });
    } catch (error) {
      console.error("Error importing customers:", error);
      res.status(500).json({ message: "Failed to import customers" });
    }
  });

  // Get merchant's customer list
  app.get("/api/merchant-customers", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const customers = await storage.getMerchantCustomers(merchantId);
      
      res.json({ customers });
    } catch (error) {
      console.error("Error fetching merchant customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  // Get customer import statistics
  app.get("/api/merchant-customers/stats", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const stats = await storage.getMerchantCustomerStats(merchantId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching customer stats:", error);
      res.status(500).json({ message: "Failed to fetch customer statistics" });
    }
  });

  // Get dashboard stats (aggregated merchant statistics)
  app.get("/api/dashboard-stats", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const stats = await storage.getDashboardStats(merchantId);
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Delete a merchant customer
  app.delete("/api/merchant-customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const merchantId = req.user.id;
      
      const deleted = await storage.deleteMerchantCustomer(id, merchantId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Bank Management Endpoints
  
  // Add funds to merchant bank
  app.post("/api/bank/add-funds", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { amountInDollars } = req.body;
      
      if (!amountInDollars || amountInDollars <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      if (amountInDollars > 1000) { // Max $1,000
        return res.status(400).json({ message: "Maximum $1,000 per transaction" });
      }
      
      // Add funds to merchant bank
      const updatedUser = await storage.addMerchantBankFunds(merchantId, amountInDollars);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      res.json({
        success: true,
        newBalance: updatedUser.merchantBank,
        message: "Funds added successfully"
      });
    } catch (error) {
      console.error("Error adding funds:", error);
      res.status(500).json({ message: "Failed to add funds" });
    }
  });
  
  // Allocate budget from bank to Text and RIPS
  app.post("/api/bank/allocate", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { textBudget, ripsBudget } = req.body;
      
      if (textBudget < 0 || ripsBudget < 0) {
        return res.status(400).json({ message: "Budget amounts cannot be negative" });
      }
      
      const updatedUser = await storage.allocateMerchantBudget(
        merchantId,
        textBudget,
        ripsBudget
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      res.json({
        success: true,
        merchantBank: updatedUser.merchantBank,
        merchantTextBudget: updatedUser.merchantTextBudget,
        merchantRipsBudget: updatedUser.merchantRipsBudget,
        message: "Budget allocated successfully"
      });
    } catch (error: any) {
      console.error("Error allocating budget:", error);
      res.status(400).json({ message: error.message || "Failed to allocate budget" });
    }
  });
  
  // Transfer funds from bank to text budget (charges tier rate per text)
  app.post("/api/bank/transfer-to-text", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { textCount } = req.body; // positive = buy texts, negative = sell texts back
      
      if (typeof textCount !== 'number' || textCount === 0) {
        return res.status(400).json({ message: "Invalid text count" });
      }
      
      const user = await storage.getUserById(merchantId);
      if (!user) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      // Get text pricing for the merchant's tier
      const tier = (user.membershipTier || "NEST") as MembershipTier;
      const { getTextPricing } = await import("@shared/tierLimits");
      const textPricing = getTextPricing(tier);
      const costPerText = textPricing.costPerText;
      
      const currentBank = parseFloat(user.merchantBank as any || "0");
      const currentTexts = parseFloat(user.merchantTextBudget as any || "0");
      
      const totalCost = Math.abs(textCount) * costPerText;
      
      if (textCount > 0) {
        // Buying texts - check if enough bank balance
        if (currentBank < totalCost) {
          return res.status(400).json({ message: `Insufficient bank balance. Need $${totalCost.toFixed(2)} for ${textCount} texts at ${(costPerText * 100).toFixed(2)}¢ each.` });
        }
      } else {
        // Selling texts back - check if enough texts
        if (currentTexts < Math.abs(textCount)) {
          return res.status(400).json({ message: "Insufficient text balance" });
        }
      }
      
      // Update both balances
      const newBank = textCount > 0 ? currentBank - totalCost : currentBank + totalCost;
      const newTexts = currentTexts + textCount;
      
      const updatedUser = await storage.updateUser(merchantId, {
        merchantBank: newBank.toString(),
        merchantTextBudget: newTexts.toString(),
      });
      
      res.json({
        success: true,
        merchantBank: updatedUser?.merchantBank,
        merchantTextBudget: updatedUser?.merchantTextBudget,
        costPerText,
        totalCost,
      });
    } catch (error) {
      console.error("Error transferring to text:", error);
      res.status(500).json({ message: "Failed to transfer funds" });
    }
  });

  // Transfer funds between bank and RIPS ($1 increments)
  app.post("/api/bank/transfer-to-rips", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { amount } = req.body; // positive = bank to RIPS, negative = RIPS to bank
      
      if (typeof amount !== 'number' || amount === 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const user = await storage.getUserById(merchantId);
      if (!user) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      const currentBank = parseFloat(user.merchantBank as any || "0");
      const currentRips = parseFloat(user.merchantRipsBudget as any || "0");
      
      if (amount > 0) {
        // Transfer from bank to RIPS
        if (currentBank < amount) {
          return res.status(400).json({ message: "Insufficient bank balance" });
        }
      } else {
        // Transfer from RIPS to bank
        if (currentRips < Math.abs(amount)) {
          return res.status(400).json({ message: "Insufficient RIPS balance" });
        }
      }
      
      // Update both balances
      const newBank = currentBank - amount;
      const newRips = currentRips + amount;
      
      const updatedUser = await storage.updateUser(merchantId, {
        merchantBank: newBank.toString(),
        merchantRipsBudget: newRips.toString(),
      });
      
      res.json({
        success: true,
        merchantBank: updatedUser?.merchantBank,
        merchantRipsBudget: updatedUser?.merchantRipsBudget,
      });
    } catch (error) {
      console.error("Error transferring funds:", error);
      res.status(500).json({ message: "Failed to transfer funds" });
    }
  });

  // Get merchant's customer acquisition transaction history
  app.get("/api/bank/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const transactions = await storage.getCustomerAcquisitionClicks(merchantId);
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get all campaign folders for merchant
  app.get("/api/campaign-folders", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const status = req.query.status as string | undefined;
      const folders = await storage.getCampaignFolders(merchantId, status);
      
      res.json(folders);
    } catch (error) {
      console.error("Error fetching campaign folders:", error);
      res.status(500).json({ message: "Failed to fetch campaign folders" });
    }
  });

  // Create a new campaign folder
  app.post("/api/campaign-folders", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { name, description } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Folder name is required" });
      }
      
      const folder = await storage.createCampaignFolder(merchantId, name.trim(), description?.trim());
      
      res.json(folder);
    } catch (error) {
      console.error("Error creating campaign folder:", error);
      res.status(500).json({ message: "Failed to create campaign folder" });
    }
  });

  // Get a specific campaign folder by ID
  app.get("/api/campaign-folders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: "Folder ID is required" });
      }
      
      const folder = await storage.getCampaignFolderById(id, merchantId);
      
      if (!folder) {
        return res.status(404).json({ message: "Folder not found or you don't have permission to view it" });
      }
      
      res.json(folder);
    } catch (error) {
      console.error("Error fetching campaign folder:", error);
      res.status(500).json({ message: "Failed to fetch campaign folder" });
    }
  });

  // Delete a campaign folder
  app.delete("/api/campaign-folders/:folderId", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { folderId } = req.params;
      
      if (!folderId) {
        return res.status(400).json({ message: "Folder ID is required" });
      }
      
      const deleted = await storage.deleteCampaignFolder(folderId, merchantId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Folder not found or you don't have permission to delete it" });
      }
      
      res.json({ success: true, message: "Folder deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign folder:", error);
      res.status(500).json({ message: "Failed to delete campaign folder" });
    }
  });

  // Campaigns
  
  // Get all campaigns for merchant
  app.get("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const campaigns = await storage.getCampaigns(merchantId);
      
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  // Add folder to campaign (create new campaign or add to existing)
  app.post("/api/campaigns/add-folder", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { campaignId, campaignName, folderId } = req.body;
      
      if (!folderId) {
        return res.status(400).json({ message: "Folder ID is required" });
      }

      // Validate that either campaignId or campaignName is provided
      if (!campaignId && !campaignName?.trim()) {
        return res.status(400).json({ message: "Either campaign ID or campaign name is required" });
      }

      // If both are provided, that's an error
      if (campaignId && campaignName?.trim()) {
        return res.status(400).json({ message: "Provide either campaign ID or campaign name, not both" });
      }

      let targetCampaignId = campaignId;

      // If creating a new campaign
      if (!targetCampaignId && campaignName) {
        const newCampaign = await storage.createCampaign(merchantId, {
          name: campaignName.trim(),
          status: "active",
        });
        targetCampaignId = newCampaign.id;
      }

      // Add folder to campaign
      await storage.addFolderToCampaign(targetCampaignId, folderId);

      res.json({ success: true, campaignId: targetCampaignId });
    } catch (error) {
      console.error("Error adding folder to campaign:", error);
      res.status(500).json({ message: "Failed to add folder to campaign" });
    }
  });

  // Analytics & Reporting
  
  // Get comprehensive merchant analytics
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const analytics = await storage.getMerchantAnalytics(merchantId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Feedback routes
  
  // Submit feedback
  app.post("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { page, message } = req.body;
      
      if (!page || !message || !message.trim()) {
        return res.status(400).json({ message: "Page and message are required" });
      }
      
      const feedback = await storage.createFeedback({
        userId,
        page,
        message: message.trim(),
      });
      
      res.json(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Get all feedback (admin view)
  app.get("/api/feedback", isAuthenticated, async (req: any, res) => {
    try {
      const feedbackList = await storage.getAllFeedback();
      
      res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // SMS Campaign Routes
  
  // Check Twilio configuration status
  app.get("/api/sms/config-status", isAuthenticated, async (req: any, res) => {
    try {
      const { isTwilioConfigured } = await import("./services/sms");
      const isConfigured = isTwilioConfigured();
      
      res.json({ 
        configured: isConfigured,
        message: isConfigured 
          ? "Twilio is configured and ready to send messages" 
          : "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Secrets."
      });
    } catch (error) {
      console.error("Error checking Twilio config:", error);
      res.status(500).json({ message: "Failed to check Twilio configuration" });
    }
  });
  
  // Send SMS campaign to selected customers
  app.post("/api/sms/send-campaign", isAuthenticated, async (req: any, res) => {
    try {
      const merchantId = req.user.id;
      const { message, customerIds } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message text is required" });
      }
      
      if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
        return res.status(400).json({ message: "At least one customer must be selected" });
      }
      
      // Get merchant details for SMS branding
      const merchant = await storage.getUserById(merchantId);
      if (!merchant) {
        return res.status(404).json({ message: "Merchant not found" });
      }
      
      // Get selected customers
      const customers = await storage.getMerchantCustomers(merchantId);
      const selectedCustomers = customers.filter(c => customerIds.includes(c.id));
      
      if (selectedCustomers.length === 0) {
        return res.status(400).json({ message: "No valid customers found" });
      }
      
      // Import SMS service
      const { sendCampaignSms, isTwilioConfigured } = await import("./services/sms");
      
      if (!isTwilioConfigured()) {
        return res.status(503).json({ 
          message: "SMS service not configured. Please set up Twilio credentials in Secrets.",
          configured: false
        });
      }
      
      // Send SMS to each customer and track results
      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };
      
      for (const customer of selectedCustomers) {
        try {
          const result = await sendCampaignSms({
            phoneNumber: customer.phoneNumber,
            message: message.trim(),
            businessName: merchant.businessName,
          });
          
          if (result.success) {
            results.sent++;
            
            // Log SMS notification
            await storage.logSmsNotification({
              merchantId,
              customerId: customer.id,
              phoneNumber: customer.phoneNumber,
              message: `${merchant.businessName}: ${message.trim()} Reply STOP to opt out.`,
              status: "sent",
              twilioMessageSid: result.sid,
            });
            
            // Increment SMS usage
            const currentMonth = new Date().toISOString().slice(0, 7);
            await storage.incrementSmsUsage(merchantId, 1);
          } else {
            results.failed++;
            results.errors.push(`${customer.phoneNumber}: ${result.error || "Unknown error"}`);
            
            // Log failed SMS
            await storage.logSmsNotification({
              merchantId,
              customerId: customer.id,
              phoneNumber: customer.phoneNumber,
              message: `${merchant.businessName}: ${message.trim()} Reply STOP to opt out.`,
              status: "failed",
            });
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`${customer.phoneNumber}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      
      res.json({
        success: true,
        totalRecipients: selectedCustomers.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
      });
    } catch (error) {
      console.error("Error sending SMS campaign:", error);
      res.status(500).json({ message: "Failed to send SMS campaign" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
