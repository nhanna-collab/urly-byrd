import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Upload, X, Lock, AlertTriangle, Package, Rocket, CalendarIcon } from "lucide-react";
import type { OfferType, RedemptionType, AddType, CouponDeliveryMethod, MembershipTier, User, DeliveryConfig, CampaignFolder } from "@shared/schema";
import { getTierCapabilities } from "@shared/tierLimits";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OfferFormProps {
  onSubmit?: (data: OfferFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<OfferFormData>;
  userTier?: MembershipTier;
  user?: User;
  menuItems?: string[];
  folders?: CampaignFolder[];
}

export interface OfferFormData {
  title: string;
  description: string;
  campaignObjectives?: string[];
  menuItem: string;
  offerType: OfferType;
  percentageOff?: number;
  dollarOff?: number;
  buyQuantity?: number;
  getQuantity?: number;
  bogoPercentageOff?: number;
  bogoItem?: string;
  spendThreshold?: number;
  thresholdDiscount?: number;
  xyfFreeItem?: string;
  originalPrice: string;
  redemptionType: RedemptionType;
  couponDeliveryMethod?: CouponDeliveryMethod;
  deliveryConfig?: DeliveryConfig;
  purchaseUrl?: string;
  couponCode?: string;
  posWebhookUrl?: string;
  addType: AddType;
  countdownDays?: number;
  countdownHours?: number;
  countdownMinutes?: number;
  countdownSeconds?: number;
  timeBombDays?: number;
  timeBombHours?: number;
  timeBombMinutes?: number;
  timeBombSeconds?: number;
  initialInventory?: number; // For quantity-based countdown ads
  maxClicksAllowed: number;
  shutDownAtMaximum?: boolean;
  notifyAtMaximum?: boolean;
  clickBudgetDollars: number;
  durationType: "endDate" | "useByDate";
  startDate: string; // Mandatory start time for the offer
  endDate: string;
  useByDate: string;
  zipCode: string; // Offer location for 10-mile proximity filtering
  campaignFolder?: string; // Optional folder assignment for organization
  targetUnits?: number;
  autoExtend?: boolean;
  extensionDays?: number;
  notifyOnShortfall?: boolean;
  notifyOnTargetMet?: boolean;
  notifyOnPoorPerformance?: boolean;
  getNewCustomersEnabled?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  status?: "draft" | "active" | "paused" | "expired"; // Offer status
  scheduleType?: string; // Stage 2 field
  campaignDuration?: number; // Stage 2 field
}

export default function OfferForm({ onSubmit, onCancel, initialData, userTier, user, menuItems = [], folders = [] }: OfferFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const STORAGE_KEY = "urlybyrd_offer_draft";
  
  const tierCapabilities = getTierCapabilities(userTier || "NEST");
  const pricePerClick = 1.65; // Default price per new customer
  

  const getInitialFormData = (): OfferFormData => {
    if (initialData?.title) {
      console.log("OfferForm: Loading from initialData (editing mode)");
      return {
        title: initialData.title,
        description: initialData.description || "",
        campaignObjectives: initialData.campaignObjectives || [],
        menuItem: initialData.menuItem || "",
        offerType: initialData.offerType || "percentage",
        percentageOff: initialData.percentageOff,
        dollarOff: initialData.dollarOff,
        buyQuantity: initialData.buyQuantity,
        getQuantity: initialData.getQuantity,
        bogoPercentageOff: initialData.bogoPercentageOff,
        bogoItem: initialData.bogoItem,
        spendThreshold: initialData.spendThreshold,
        thresholdDiscount: initialData.thresholdDiscount,
        xyfFreeItem: initialData.xyfFreeItem,
        originalPrice: initialData.originalPrice || "",
        redemptionType: initialData.redemptionType || "pay_at_redemption",
        couponDeliveryMethod: initialData.couponDeliveryMethod,
        deliveryConfig: initialData.deliveryConfig || {},
        purchaseUrl: initialData.purchaseUrl || "",
        couponCode: initialData.couponCode || "",
        posWebhookUrl: initialData.posWebhookUrl || "",
        addType: initialData.addType || "regular",
        countdownDays: initialData.countdownDays,
        countdownHours: initialData.countdownHours,
        countdownMinutes: initialData.countdownMinutes,
        countdownSeconds: initialData.countdownSeconds,
        maxClicksAllowed: initialData.maxClicksAllowed || 1,
        shutDownAtMaximum: initialData.shutDownAtMaximum || false,
        notifyAtMaximum: initialData.notifyAtMaximum || false,
        clickBudgetDollars: initialData.clickBudgetDollars || 0,
        durationType: initialData.durationType || "endDate",
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        useByDate: initialData.useByDate || "",
        zipCode: initialData.zipCode || "",
        campaignFolder: initialData.campaignFolder,
        targetUnits: initialData.targetUnits,
        autoExtend: initialData.autoExtend || false,
        extensionDays: initialData.extensionDays || 3,
        notifyOnShortfall: initialData.notifyOnShortfall || false,
        notifyOnTargetMet: initialData.notifyOnTargetMet || false,
        notifyOnPoorPerformance: initialData.notifyOnPoorPerformance || false,
        getNewCustomersEnabled: initialData.getNewCustomersEnabled || false,
        imageUrl: initialData.imageUrl,
        videoUrl: initialData.videoUrl || "",
        scheduleType: initialData.scheduleType || "no_countdowns",
        campaignDuration: initialData.campaignDuration,
      };
    }

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Normalize startDate to string for backward compatibility and consistency
        parsed.startDate = String(parsed.startDate ?? "");
        // Set default originalPrice if not present
        parsed.originalPrice = parsed.originalPrice || "5";
        console.log("OfferForm: Loading from localStorage", { title: parsed.title, description: parsed.description });
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
    
    console.log("OfferForm: No saved data, using defaults");

    return {
      title: "",
      description: "",
      campaignObjectives: [],
      menuItem: "",
      offerType: "percentage",
      percentageOff: undefined,
      dollarOff: undefined,
      buyQuantity: undefined,
      getQuantity: undefined,
      bogoPercentageOff: undefined,
      spendThreshold: undefined,
      thresholdDiscount: undefined,
      originalPrice: "5",
      redemptionType: "pay_at_redemption",
      couponDeliveryMethod: undefined,
      deliveryConfig: {},
      purchaseUrl: "",
      couponCode: "",
      addType: "regular",
      countdownDays: undefined,
      countdownHours: undefined,
      countdownMinutes: undefined,
      countdownSeconds: undefined,
      maxClicksAllowed: 0,
      shutDownAtMaximum: false,
      notifyAtMaximum: false,
      clickBudgetDollars: 0,
      durationType: "endDate",
      startDate: "",
      endDate: "",
      useByDate: "",
      zipCode: user?.zipCode || "",
      targetUnits: undefined,
      autoExtend: false,
      extensionDays: 3,
      notifyOnShortfall: false,
      notifyOnTargetMet: false,
      notifyOnPoorPerformance: false,
      getNewCustomersEnabled: false,
      imageUrl: undefined,
      videoUrl: "",
      scheduleType: "no_countdowns",
      campaignDuration: undefined,
    };
  };

  const [formData, setFormData] = useState<OfferFormData>(getInitialFormData());

  const [previewImage, setPreviewImage] = useState<string | undefined>(
    initialData?.imageUrl
  );

  // Multi-copy and folder creation state
  const [numberOfCopies, setNumberOfCopies] = useState(1);
  const [folderName, setFolderName] = useState("");
  const [isCreatingPermutations, setIsCreatingPermutations] = useState(false);
  
  // Track if we're completing a draft to show mandatory field highlighting
  const [isCompletingDraft, setIsCompletingDraft] = useState(false);

  // Constants for delivery methods that require/don't require coupon codes
  const COUPON_CODE_REQUIRED = new Set(["text_message_alerts", "coupon_codes", "mms_based_coupons"]);
  const CODELESS_METHODS = new Set(["mobile_app_based_coupons", "mobile_wallet_passes"]);

  // Compute field visibility based on form state
  const visibility = {
    showCouponCode: formData.redemptionType === "pay_at_redemption" && 
                    formData.couponDeliveryMethod &&
                    COUPON_CODE_REQUIRED.has(formData.couponDeliveryMethod),
    showSmsTemplate: formData.redemptionType === "pay_at_redemption" && 
                     formData.couponDeliveryMethod === "text_message_alerts",
    showDeliveryMethod: formData.redemptionType === "pay_at_redemption",
    showPurchaseUrl: formData.redemptionType === "prepayment_offer",
  };

  useEffect(() => {
    if (!initialData?.title) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } else {
      // If initialData exists and status is draft, we're completing a draft
      setIsCompletingDraft(initialData.status === "draft");
    }
  }, [formData, initialData]);
  
  // Helper function to check if a field is required but missing
  const isFieldMissingAndRequired = (fieldName: string): boolean => {
    if (!isCompletingDraft) return false;
    
    switch (fieldName) {
      case 'originalPrice':
        return !formData.originalPrice || formData.originalPrice.trim() === '';
      case 'startDate':
        return !formData.startDate || formData.startDate.trim() === '';
      case 'endDate':
        return !formData.endDate || formData.endDate.trim() === '';
      case 'purchaseUrl':
        return formData.redemptionType === 'prepayment_offer' && (!formData.purchaseUrl || formData.purchaseUrl.trim() === '');
      case 'couponDeliveryMethod':
        return formData.redemptionType === 'pay_at_redemption' && !formData.couponDeliveryMethod;
      default:
        return false;
    }
  };


  // Validation function that returns errors array
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Basic required fields
    if (!formData.title.trim()) errors.push("Offer Title is required");
    if (!formData.description.trim()) errors.push("Description is required");
    if (!formData.menuItem.trim()) errors.push("Menu Item name is required");
    if (!formData.zipCode.trim()) errors.push("ZIP Code is required");
    if (!formData.originalPrice.trim()) errors.push("Original Price is required");
    if (!formData.maxClicksAllowed || formData.maxClicksAllowed < 1) errors.push("Max Clicks is required and must be at least 1");
    
    // Duration validations
    if (!formData.startDate.trim()) {
      errors.push("Start Time is required");
    } else {
      const startDateTime = new Date(formData.startDate);
      const now = Date.now();
      const graceWindow = 60 * 1000; // 60 seconds to allow current minute selection
      
      // Check if start time is in the past (with grace window)
      if (startDateTime.getTime() < (now - graceWindow)) {
        errors.push("Start Time cannot be in the past");
      }
      
      // Validate start time is before end time
      if (formData.durationType === "endDate" && formData.endDate) {
        const endDateTime = new Date(formData.endDate);
        if (startDateTime >= endDateTime) {
          errors.push("Start Time must be before End Date & Time");
        }
      }
      
      // Validate start time is before use by date
      if (formData.durationType === "useByDate" && formData.useByDate) {
        const useByDateTime = new Date(formData.useByDate + "T23:59:59");
        if (startDateTime >= useByDateTime) {
          errors.push("Start Time must be before the redemption deadline");
        }
      }
    }
    
    // Offer type specific validations
    if (formData.offerType === "percentage" && !formData.percentageOff) {
      errors.push("Percentage Off is required for percentage offers");
    }
    if (formData.offerType === "dollar_amount" && !formData.dollarOff) {
      errors.push("Dollar Off amount is required for dollar amount offers");
    }
    if (formData.offerType === "bogo") {
      if (!formData.buyQuantity) errors.push("Buy Quantity is required for BOGO offers");
      if (!formData.getQuantity) errors.push("Get Quantity is required for BOGO offers");
    }
    if (formData.offerType === "spend_threshold") {
      if (!formData.spendThreshold) errors.push("Spend Threshold is required");
      if (!formData.thresholdDiscount) errors.push("Threshold Discount is required");
    }
    if (formData.offerType === "buy_x_get_y") {
      if (!formData.buyQuantity) errors.push("Buy Quantity (X) is required for Buy X Get Y offers");
      if (!formData.getQuantity) errors.push("Get Quantity (Y) is required for Buy X Get Y offers");
    }
    
    // Redemption type specific validations
    if (formData.redemptionType === "prepayment_offer" && !formData.purchaseUrl?.trim()) {
      errors.push("Purchase URL is required for 'Pre-Payment Offer' offers");
    }
    if (formData.redemptionType === "pay_at_redemption") {
      if (!formData.couponDeliveryMethod) {
        errors.push("Coupon Delivery Method is required for Pay At Redemption offers");
      }
      // Only require coupon code if delivery method needs it
      const deliveryNeedsCode = COUPON_CODE_REQUIRED.has(formData.couponDeliveryMethod || "");
      if (deliveryNeedsCode && !formData.couponCode?.trim()) {
        errors.push("Coupon Code is required for this delivery method");
      }
    }
    
    // Ad Type validation - require countdown fields when timer/both selected
    if (formData.addType === "timer" || formData.addType === "both") {
      const hasCountdown = formData.countdownDays || formData.countdownHours || 
                          formData.countdownMinutes || formData.countdownSeconds;
      if (!hasCountdown) {
        errors.push("Countdown Duration is required when Ad Type is Timer or Both (enter at least one time value)");
      }
    }
    
    return errors;
  };

  // Save to Stage - requires essential fields
  const handleSaveAsDraft = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields for drafts
    const errors: string[] = [];
    
    if (!formData.title.trim()) {
      errors.push("Campaign Title is required");
    }
    if (!formData.menuItem.trim()) {
      errors.push("Actual Product/Service is required");
    }
    if (!formData.description.trim()) {
      errors.push("Description is required");
    }
    if (!formData.zipCode.trim()) {
      errors.push("ZIP Code is required");
    }
    // Redemption type has default value "coupon" so it's always set
    
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: (
          <ul className="list-disc pl-4 space-y-1 mt-2">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        ),
      });
      return;
    }
    
    // If creating multiple copies, require folder name
    if (numberOfCopies > 1 && !folderName.trim()) {
      toast({
        variant: "destructive",
        title: "Template Name Required",
        description: "Please enter a template name when creating multiple copies.",
      });
      return;
    }
    
    // KEEP localStorage for form persistence - don't clear it!
    // localStorage.removeItem(STORAGE_KEY);
    
    // Pass along the copy info
    const draftData = {
      ...formData,
      imageUrl: previewImage,
      status: "draft" as const,
      batchPendingSelection: false, // Single offers should appear immediately in Stage 1
      _numberOfCopies: numberOfCopies,
      _folderName: numberOfCopies > 1 ? folderName : undefined,
    };
    
    onSubmit?.(draftData);
    console.log("Saved to stage:", draftData);
  };

  // Launch - full validation required
  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    // Show all errors if any
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Please fix the following issues:",
        description: (
          <ul className="list-disc pl-4 space-y-1 mt-2">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        ),
      });
      return;
    }
    
    // KEEP localStorage for form persistence - don't clear it!
    // localStorage.removeItem(STORAGE_KEY);
    onSubmit?.({ ...formData, imageUrl: previewImage, status: "active" });
    console.log("Offer launched:", { ...formData, imageUrl: previewImage, status: "active" });
  };

  // Check if form passes validation for Launch button
  const isLaunchEnabled = validateForm().length === 0;

  // Handle Batch Permutations creation - only creates permutations for filled offer types
  const handleCreateBatchPermutations = async () => {
    // Validate essential fields
    const errors: string[] = [];
    if (!formData.title.trim()) errors.push("Offer Title is required");
    if (!formData.menuItem.trim()) errors.push("Actual Product/Service is required");
    if (!formData.description.trim()) errors.push("Description is required");
    if (!formData.zipCode.trim()) errors.push("ZIP Code is required");

    // Check which offer types have values filled in
    const offerTypesToCreate: OfferType[] = [];
    if (formData.percentageOff) offerTypesToCreate.push("percentage");
    if (formData.dollarOff) offerTypesToCreate.push("dollar_amount");
    if (formData.buyQuantity && formData.getQuantity && formData.bogoPercentageOff && formData.bogoItem) {
      offerTypesToCreate.push("bogo");
    }
    if (formData.spendThreshold && formData.thresholdDiscount) offerTypesToCreate.push("spend_threshold");
    if (formData.buyQuantity && formData.getQuantity && formData.xyfFreeItem) {
      offerTypesToCreate.push("buy_x_get_y");
    }

    if (offerTypesToCreate.length === 0) {
      errors.push("At least one offer type must have values filled in (PCT, DOL, BOGO, XY, or XYF)");
    }

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Required Fields Missing",
        description: (
          <ul className="list-disc pl-4 space-y-1 mt-2">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        ),
      });
      return;
    }

    setIsCreatingPermutations(true);

    try {
      // Each offer type creates 8 permutations: 
      // PAR (Pay At Redemption): REG, CT, CQ, CTCQ
      // PPO (Pre-Payment Offer): REG, CT, CQ, CTCQ
      const permutationConfigs = [
        { redemptionType: "pay_at_redemption" as RedemptionType, addType: "regular" as AddType, label: "PAR-REG" },
        { redemptionType: "pay_at_redemption" as RedemptionType, addType: "timer" as AddType, label: "PAR-CT" },
        { redemptionType: "pay_at_redemption" as RedemptionType, addType: "quantity" as AddType, label: "PAR-CQ" },
        { redemptionType: "pay_at_redemption" as RedemptionType, addType: "both" as AddType, label: "PAR-CTCQ" },
        { redemptionType: "prepayment_offer" as RedemptionType, addType: "regular" as AddType, label: "PPO-REG" },
        { redemptionType: "prepayment_offer" as RedemptionType, addType: "timer" as AddType, label: "PPO-CT" },
        { redemptionType: "prepayment_offer" as RedemptionType, addType: "quantity" as AddType, label: "PPO-CQ" },
        { redemptionType: "prepayment_offer" as RedemptionType, addType: "both" as AddType, label: "PPO-CTCQ" },
      ];
      
      const totalPermutations = offerTypesToCreate.length * 8;
      
      // Create folder with only the offer types being used
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      const day = now.getDate();
      const year = now.getFullYear();
      
      const offerTypeLabels: Record<OfferType, string> = {
        percentage: "PCT",
        dollar_amount: "DOL",
        bogo: "BOGO",
        spend_threshold: "XY",
        buy_x_get_y: "XYF",
      };
      
      const typeCodes = offerTypesToCreate.map(type => offerTypeLabels[type]).join("-");
      const folderName = `${typeCodes}-BATCH-${month}_${day}_${year}`;
      
      console.log(`Creating folder "${folderName}" for ${totalPermutations} permutations`);
      const folderResponse = await apiRequest("POST", "/api/campaign-folders", {
        name: folderName,
        status: "draft",
      });
      const folderData = await folderResponse.json();
      const folderId = folderData.id;

      if (!folderId) {
        throw new Error("Failed to get folder ID from response");
      }

      console.log(`Got folder ID: ${folderId}`);

      let count = 0;
      for (const offerType of offerTypesToCreate) {
        for (const config of permutationConfigs) {
          count++;
          // New naming convention: [TYPE]-[PPO/PAR]-[REG/CT/CQ/CTCQ]-[DATE]
          const templateTitle = `${offerTypeLabels[offerType]}-${config.label}-${month}_${day}_${year}`;
          
          // Build offer payload with ALL Section 1 fields populated from formData
          const offerPayload: any = {
            title: templateTitle,
            description: formData.description || formData.title, // Use original title as description

            menuItem: formData.menuItem,
            zipCode: formData.zipCode,
            offerType: offerType,
            redemptionType: config.redemptionType,
            addType: config.addType,
            status: "draft",
            campaignFolder: folderId,
            batchPendingSelection: true, // Hide from Offers page until selected in grid
            // Section 1 fields - populate from formData
            originalPrice: formData.originalPrice || null,
            maxClicksAllowed: formData.maxClicksAllowed || null,
            clickBudgetDollars: formData.clickBudgetDollars || null,
            couponDeliveryMethod: config.redemptionType === "pay_at_redemption" ? formData.couponDeliveryMethod : null,
            shutDownAtMaximum: formData.shutDownAtMaximum || false,
            notifyAtMaximum: formData.notifyAtMaximum || false,
            getNewCustomersEnabled: formData.getNewCustomersEnabled || false,
            notifyOnTargetMet: formData.notifyOnTargetMet || false,
            notifyOnPoorPerformance: formData.notifyOnPoorPerformance || false,
            notifyOnShortfall: formData.notifyOnShortfall || false,
            startDate: null,
            endDate: null,
            // Add countdown defaults based on ad type
            countdownTimerSeconds: (config.addType === "timer" || config.addType === "both") ? 30 : null,
            countdownQuantityStart: (config.addType === "quantity" || config.addType === "both") ? (formData.maxClicksAllowed || null) : null,
            // Add purchaseUrl for Pre-Payment offers
            ...(config.redemptionType === "prepayment_offer" && formData.purchaseUrl ? { purchaseUrl: formData.purchaseUrl } : {}),
          };

          // Add offer-type-specific values
          if (offerType === "percentage") {
            offerPayload.percentageOff = formData.percentageOff;
          } else if (offerType === "dollar_amount") {
            offerPayload.dollarOff = formData.dollarOff;
          } else if (offerType === "bogo") {
            offerPayload.buyQuantity = formData.buyQuantity;
            offerPayload.getQuantity = formData.getQuantity;
            offerPayload.bogoPercentageOff = formData.bogoPercentageOff;
            offerPayload.bogoItem = formData.bogoItem;
          } else if (offerType === "spend_threshold") {
            offerPayload.spendThreshold = formData.spendThreshold;
            offerPayload.thresholdDiscount = formData.thresholdDiscount;
          } else if (offerType === "buy_x_get_y") {
            offerPayload.buyQuantity = formData.buyQuantity;
            offerPayload.getQuantity = formData.getQuantity;
            offerPayload.xyfFreeItem = formData.xyfFreeItem;
          }

          console.log(`Creating template ${count}/${totalPermutations}: ${templateTitle}`);
          await apiRequest("POST", "/api/offers", offerPayload);
        }
      }

      console.log(`Successfully created ${totalPermutations} permutations in folder ${folderId}`);

      // Invalidate cache and wait for refetch to complete
      await queryClient.invalidateQueries({ queryKey: ["/api/my-offers"], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ["/api/campaign-folders"], refetchType: 'active' });
      
      // Force refetch to ensure data is up to date
      await queryClient.refetchQueries({ queryKey: ["/api/my-offers"] });
      await queryClient.refetchQueries({ queryKey: ["/api/campaign-folders"] });

      toast({
        title: "Success! 🎉",
        description: `Created all ${totalPermutations} permutations in folder "${folderName}"`,
      });

      // Navigate to batch grid page
      setLocation(`/batch-grid/${folderId}`);
    } catch (error) {
      console.error("Error creating permutations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create permutations",
      });
    } finally {
      setIsCreatingPermutations(false);
    }
  };

  // Check Required Fields and scroll to first missing one
  const handleCheckRequiredFields = () => {
    const missingFields: { field: string; sectionId: string; label: string }[] = [];
    
    if (!formData.title.trim()) {
      missingFields.push({ field: 'title', sectionId: 'basic-info', label: 'Campaign Title' });
    }
    if (!formData.menuItem.trim()) {
      missingFields.push({ field: 'menuItem', sectionId: 'basic-info', label: 'Actual Product/Service' });
    }
    if (!formData.description.trim()) {
      missingFields.push({ field: 'description', sectionId: 'basic-info', label: 'Description' });
    }
    if (!formData.zipCode.trim()) {
      missingFields.push({ field: 'zipCode', sectionId: 'basic-info', label: 'ZIP Code' });
    }
    
    if (missingFields.length === 0) {
      toast({
        title: "All Required Fields Complete! ✅",
        description: "You can now save as draft or continue filling out optional fields.",
      });
    } else {
      // Scroll to first missing field
      scrollToSection(missingFields[0].sectionId);
      
      toast({
        variant: "destructive",
        title: `${missingFields.length} Required Field${missingFields.length > 1 ? 's' : ''} Missing`,
        description: (
          <ul className="list-disc pl-4 space-y-1 mt-2">
            {missingFields.map((item, i) => (
              <li key={i}>{item.label}</li>
            ))}
          </ul>
        ),
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Permutation count: 5 permutations per offer type (RC-Regular, RC-Countdown, MP-Regular, MP-Countdown, MP-CountdownQTY)
  const getPermutationCount = () => {
    let offerTypeCount = 0;
    if (formData.percentageOff) offerTypeCount++;
    if (formData.dollarOff) offerTypeCount++;
    if (formData.buyQuantity && formData.getQuantity && formData.bogoPercentageOff && formData.bogoItem) offerTypeCount++;
    if (formData.spendThreshold && formData.thresholdDiscount) offerTypeCount++;
    if (formData.buyQuantity && formData.getQuantity && formData.xyfFreeItem) offerTypeCount++;
    
    return offerTypeCount * 5; // 5 permutations per type (2 RC + 3 MP)
  };

  const permutationCount = getPermutationCount();

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-3 max-w-7xl mx-auto px-4">
      
      {/* Section 1: Offer/Campaign Admin */}
      <Card id="basic-info" className="bg-orange-200 dark:bg-orange-950/40" style={{ scrollMarginTop: 'calc(var(--app-header-height, 80px) + 52px)' }}>
        <CardHeader className="py-2 px-6">
          <CardTitle className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">Offer/Campaign Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 py-3 px-6" style={{ minHeight: '110%' }}>
          {/* Row 1: Title, Product, Actual Price, ZIP Code, Image */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <Label htmlFor="title" className="text-[11px] font-medium">Offer Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required data-testid="input-title" className="h-7 text-xs" />
            </div>
            <div className="col-span-3">
              <Label htmlFor="menuItem" className="text-[11px] font-medium">Product / Service *</Label>
              <Autocomplete id="menuItem" value={formData.menuItem} onValueChange={(value) => setFormData({ ...formData, menuItem: value })} options={menuItems} required data-testid="input-menu-item" className="h-7" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="originalPrice" className="text-[11px] font-medium">Orig. Price *</Label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                <Input id="originalPrice" type="number" min="0" step="0.01" className="pl-3.5 h-7 text-xs" value={formData.originalPrice || ""} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} placeholder="5.00" data-testid="input-original-price" />
              </div>
            </div>
            <div className="col-span-1">
              <Label htmlFor="zipCode" className="text-[11px] font-medium">ZIP *</Label>
              <Input 
                id="zipCode" 
                value={formData.zipCode} 
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} 
                maxLength={10}
                required 
                data-testid="input-zip-code" 
                className="h-7 text-xs" 
                placeholder="12345"
              />
            </div>
            <div className="col-span-3 text-center">
              <Label className="text-[11px] font-medium">Image</Label>
              {previewImage ? (
                <div className="relative h-7 w-full bg-muted rounded overflow-hidden">
                  <img src={previewImage} alt="" className="h-full w-full object-cover" />
                  <Button type="button" size="icon" variant="ghost" className="absolute top-0 right-0 h-4 w-4" onClick={() => setPreviewImage(undefined)} data-testid="button-remove-image">
                    <X className="h-2.5 w-2.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex h-7 items-center justify-center border border-dashed rounded cursor-pointer hover:bg-muted/50">
                  <Upload className="h-3 w-3 text-muted-foreground mr-1" />
                  <span className="text-[10px] text-muted-foreground">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Row 2: Description + Video Link */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-9">
              <Label htmlFor="description" className="text-[11px] font-medium">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} required data-testid="input-description" className="resize-none text-xs min-h-0" />
            </div>
            <div className="col-span-3 space-y-0.5">
              <Label htmlFor="videoUrl" className="text-[11px] font-medium">Video Link</Label>
              <Input 
                id="videoUrl" 
                type="url" 
                value={formData.videoUrl || ""} 
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} 
                placeholder="https://..." 
                data-testid="input-video-url" 
                className="h-7 text-xs" 
              />
            </div>
          </div>

          {/* Row 3: Card Type with sub-fields */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3 space-y-0.5">
              <Label htmlFor="cardType" className="text-[11px] font-medium">Card Type</Label>
              <Select value={formData.couponDeliveryMethod || ""} onValueChange={(value) => setFormData({ ...formData, couponDeliveryMethod: value as CouponDeliveryMethod })}>
                <SelectTrigger id="cardType" className="h-7 text-xs" data-testid="select-card-type">
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text_message_alerts">Text Message Alerts</SelectItem>
                  <SelectItem value="coupon_codes">Coupon Codes</SelectItem>
                  <SelectItem value="mobile_app_based_coupons">Icon Link (Mobile App)</SelectItem>
                  <SelectItem value="mms_based_coupons">MMS (Image)</SelectItem>
                  <SelectItem value="mobile_wallet_passes">Mobile Wallet Passes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Message Alerts: Coupon Code + Message Template */}
            {formData.couponDeliveryMethod === "text_message_alerts" && (
              <>
                <div className="col-span-3 space-y-0.5">
                  <Label htmlFor="couponCode" className="text-[11px] font-medium">Coupon Code *</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode || ""}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    placeholder="e.g., SAVE20"
                    className="h-7 text-xs"
                    data-testid="input-coupon-code"
                  />
                </div>
                <div className="col-span-6 space-y-0.5">
                  <Label htmlFor="messageTemplate" className="text-[11px] font-medium">Message Template</Label>
                  <Input
                    id="messageTemplate"
                    value={(formData.deliveryConfig as any)?.messageTemplate || ""}
                    onChange={(e) => setFormData({ ...formData, deliveryConfig: { messageTemplate: e.target.value } })}
                    placeholder="e.g., Your code: {CODE}"
                    className="h-7 text-xs"
                    data-testid="input-message-template"
                  />
                </div>
              </>
            )}

            {/* Icon Link: App Deep Link */}
            {formData.couponDeliveryMethod === "mobile_app_based_coupons" && (
              <div className="col-span-6 space-y-0.5">
                <Label htmlFor="appDeepLink" className="text-[11px] font-medium">App Deep Link</Label>
                <Input
                  id="appDeepLink"
                  type="url"
                  value={(formData.deliveryConfig as any)?.appDeepLink || ""}
                  onChange={(e) => setFormData({ ...formData, deliveryConfig: { appDeepLink: e.target.value } })}
                  placeholder="e.g., myapp://coupon/123"
                  className="h-7 text-xs"
                  data-testid="input-app-deep-link"
                />
              </div>
            )}

            {/* MMS: Coupon Code + Image URL */}
            {formData.couponDeliveryMethod === "mms_based_coupons" && (
              <>
                <div className="col-span-3 space-y-0.5">
                  <Label htmlFor="couponCode" className="text-[11px] font-medium">Coupon Code *</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode || ""}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    placeholder="e.g., SAVE20"
                    className="h-7 text-xs"
                    data-testid="input-coupon-code"
                  />
                </div>
                <div className="col-span-6 space-y-0.5">
                  <Label htmlFor="couponImageUrl" className="text-[11px] font-medium">Coupon Image URL</Label>
                  <Input
                    id="couponImageUrl"
                    type="url"
                    value={(formData.deliveryConfig as any)?.couponImageUrl || ""}
                    onChange={(e) => setFormData({ ...formData, deliveryConfig: { couponImageUrl: e.target.value } })}
                    placeholder="https://..."
                    className="h-7 text-xs"
                    data-testid="input-coupon-image-url"
                  />
                </div>
              </>
            )}

            {/* Coupon Codes: Coupon Code + Auto-Generate Toggle */}
            {formData.couponDeliveryMethod === "coupon_codes" && (
              <>
                <div className="col-span-3 space-y-0.5">
                  <Label htmlFor="couponCode" className="text-[11px] font-medium">Coupon Code *</Label>
                  <Input
                    id="couponCode"
                    value={formData.couponCode || ""}
                    onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                    placeholder="e.g., SAVE20"
                    className="h-7 text-xs"
                    data-testid="input-coupon-code"
                  />
                </div>
                <div className="col-span-3 space-y-0.5">
                  <Label htmlFor="autoGenerateCode" className="text-[11px] font-medium">Auto-Generate Code</Label>
                  <Select 
                    value={(formData.deliveryConfig as any)?.autoGenerateCode ? "yes" : "no"}
                    onValueChange={(value) => setFormData({ ...formData, deliveryConfig: { autoGenerateCode: value === "yes" } })}
                  >
                    <SelectTrigger id="autoGenerateCode" className="h-7 text-xs" data-testid="select-auto-generate-code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Mobile Wallet: Barcode Type */}
            {formData.couponDeliveryMethod === "mobile_wallet_passes" && (
              <div className="col-span-3 space-y-0.5">
                <Label htmlFor="barcodeType" className="text-[11px] font-medium">Barcode Type</Label>
                <Select 
                  value={(formData.deliveryConfig as any)?.barcodeType || "qr_code"}
                  onValueChange={(value) => setFormData({ ...formData, deliveryConfig: { barcodeType: value as 'qr_code' | 'code128' | 'code39' | 'ean13' } })}
                >
                  <SelectTrigger id="barcodeType" className="h-7 text-xs" data-testid="select-barcode-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                    <SelectItem value="code128">Code 128</SelectItem>
                    <SelectItem value="code39">Code 39</SelectItem>
                    <SelectItem value="ean13">EAN-13</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>


        </CardContent>
      </Card>

      {/* Section 2: Offer Terms - Single Row Layout with More Height */}
      <Card id="terms" className="bg-orange-200 dark:bg-orange-950/40 mt-6" style={{ scrollMarginTop: 'calc(var(--app-header-height, 80px) + 52px)' }}>
        <CardHeader className="py-2 px-6">
          <CardTitle className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">Offer Terms</CardTitle>
        </CardHeader>
        <CardContent className="py-4 px-6 min-h-[100px]">

          {/* Single Row: Payment Type | Offer Type | Dynamic Card Type Fields */}
          <div className="grid grid-cols-12 gap-4 items-end">
            {/* Payment Type */}
            <div className="col-span-2 space-y-0.5">
              <Label htmlFor="couponType" className="text-[11px] font-medium">Payment Type *</Label>
              <Select value={formData.redemptionType} onValueChange={(value) => setFormData({ ...formData, redemptionType: value as RedemptionType })}>
                <SelectTrigger id="couponType" data-testid="select-coupon-type" className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pay_at_redemption">PAR</SelectItem>
                  <SelectItem value="prepayment_offer">PPO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Offer Type */}
            <div className="col-span-2 space-y-0.5">
              <Label htmlFor="offerType" className="text-[11px] font-medium">Offer Type *</Label>
              <Select
                value={formData.offerType}
                onValueChange={(value) =>
                  setFormData({ ...formData, offerType: value as OfferType })
                }
              >
                <SelectTrigger data-testid="select-offer-type" className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">PCT</SelectItem>
                  <SelectItem value="dollar_amount">DOL</SelectItem>
                  <SelectItem value="bogo">BOGO</SelectItem>
                  <SelectItem value="spend_threshold">XY</SelectItem>
                  <SelectItem value="buy_x_get_y">XYF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Percentage Off Fields */}
            {formData.offerType === "percentage" && (
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="percentageOff" className="text-[11px] font-medium">% Off *</Label>
                <div className="relative">
                  <Input
                    id="percentageOff"
                    type="number"
                    min="5"
                    max="100"
                    step="5"
                    value={formData.percentageOff || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, percentageOff: parseInt(e.target.value) || undefined })
                    }
                    data-testid="input-percentage"
                    className="h-7 text-xs pr-6"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
            )}

            {/* Dollar Amount Fields */}
            {formData.offerType === "dollar_amount" && (
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="dollarOff" className="text-[11px] font-medium">$ Off *</Label>
                <div className="relative">
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                  <Input
                    id="dollarOff"
                    type="number"
                    min="1"
                    value={formData.dollarOff || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dollarOff: parseInt(e.target.value) || undefined })
                    }
                    className="pl-3.5 h-7 text-xs"
                    data-testid="input-dollar-amount"
                  />
                </div>
              </div>
            )}

            {/* BOGO Fields */}
            {formData.offerType === "bogo" && (
              <>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="bogoItem" className="text-[11px] font-medium">Item *</Label>
                  <Input 
                    id="bogoItem" 
                    value={formData.bogoItem || ""} 
                    onChange={(e) => setFormData({ ...formData, bogoItem: e.target.value })} 
                    placeholder="Item" 
                    data-testid="input-bogo-item" 
                    className="h-7 text-xs" 
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="buyQuantity" className="text-[11px] font-medium">Buy *</Label>
                  <Input
                    id="buyQuantity"
                    type="number"
                    min="1"
                    value={formData.buyQuantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || undefined })
                    }
                    data-testid="input-buy-quantity"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="getQuantity" className="text-[11px] font-medium">Get *</Label>
                  <Input
                    id="getQuantity"
                    type="number"
                    min="1"
                    value={formData.getQuantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, getQuantity: parseInt(e.target.value) || undefined })
                    }
                    data-testid="input-get-quantity"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="bogoPercentageOff" className="text-[11px] font-medium">@ % *</Label>
                  <div className="relative">
                    <Input
                      id="bogoPercentageOff"
                      type="number"
                      min="5"
                      max="100"
                      step="5"
                      value={formData.bogoPercentageOff || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bogoPercentageOff: parseInt(e.target.value) || undefined })
                      }
                      data-testid="input-bogo-percentage"
                      className="h-7 text-xs pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                </div>
              </>
            )}

            {/* Spend Threshold Fields */}
            {formData.offerType === "spend_threshold" && (
              <>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="spendThreshold" className="text-[11px] font-medium">Spend *</Label>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                    <Input
                      id="spendThreshold"
                      type="number"
                      min="1"
                      value={formData.spendThreshold || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, spendThreshold: parseInt(e.target.value) || undefined })
                      }
                      className="pl-3.5 h-7 text-xs"
                      data-testid="input-spend-threshold"
                    />
                  </div>
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="thresholdDiscount" className="text-[11px] font-medium">Get $ Off *</Label>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                    <Input
                      id="thresholdDiscount"
                      type="number"
                      min="1"
                      value={formData.thresholdDiscount || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, thresholdDiscount: parseInt(e.target.value) || undefined })
                      }
                      className="pl-3.5 h-7 text-xs"
                      data-testid="input-threshold-discount"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Buy X Get Y Free Fields */}
            {formData.offerType === "buy_x_get_y" && (
              <>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="xyfFreeItem" className="text-[11px] font-medium">Free Item *</Label>
                  <Input 
                    id="xyfFreeItem" 
                    value={formData.xyfFreeItem || ""} 
                    onChange={(e) => setFormData({ ...formData, xyfFreeItem: e.target.value })} 
                    placeholder="Item" 
                    data-testid="input-xyf-free-item"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="buyQuantityXYF" className="text-[11px] font-medium">Buy *</Label>
                  <Input
                    id="buyQuantityXYF"
                    type="number"
                    min="1"
                    value={formData.buyQuantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || undefined })
                    }
                    data-testid="input-buy-quantity-xyf"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <Label htmlFor="getQuantityXYF" className="text-[11px] font-medium">Get *</Label>
                  <Input
                    id="getQuantityXYF"
                    type="number"
                    min="1"
                    value={formData.getQuantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, getQuantity: parseInt(e.target.value) || undefined })
                    }
                    data-testid="input-get-quantity-xyf"
                    className="h-7 text-xs"
                  />
                </div>
              </>
            )}

            {/* Purchase URL for PPO - appears on the right */}
            {formData.redemptionType === "prepayment_offer" && (
              <div className="col-span-4 space-y-0.5">
                <Label htmlFor="purchaseUrl" className="text-[11px] font-medium">Purchase URL *</Label>
                <Input 
                  id="purchaseUrl" 
                  type="url" 
                  value={formData.purchaseUrl || ""} 
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })} 
                  placeholder="https://your-store.com/checkout" 
                  data-testid="input-purchase-url-terms" 
                  className="h-7 text-xs" 
                />
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Section 3: Choose One Header */}
      <div className="mt-6 text-center">
        <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wide mb-2">
          ↓ Choose One ↓
        </h3>
      </div>

      {/* Two Separate Advanced Options Cards */}
      {(() => {
        // Check if any countdown duration field has a value (Stage 1 is active)
        const hasCountdownDuration = !!(
          formData.countdownDays || 
          formData.countdownHours || 
          formData.countdownMinutes || 
          formData.countdownSeconds
        );
        
        // Check if any Stage 2 field has a value (Stage 2 is active)
        const hasStage2Data = !!(
          (formData.scheduleType && formData.scheduleType !== "no_countdowns") ||
          formData.autoExtend ||
          formData.campaignDuration
        );
        
        return (
          <div className="grid grid-cols-2 gap-6 mt-4">
            
            {/* STAGE 1 CARD */}
            <Card 
              id="advanced-stage1" 
              className={`bg-purple-200 dark:bg-purple-950/40 transition-opacity ${
                hasStage2Data ? 'opacity-50 pointer-events-none' : ''
              }`}
              style={{ scrollMarginTop: 'calc(var(--app-header-height, 80px) + 52px)' }}
            >
          <CardHeader className="py-2 px-6">
            <CardTitle className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">
              Advanced Options Stage 1
              {hasStage2Data && <span className="ml-2 text-[10px] font-normal">(Stage 2 Active)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-6 space-y-3">
              
              {/* Ad Type */}
              <div className="space-y-0.5">
                <Label htmlFor="addType" className="text-[11px] font-medium">Ad Type *</Label>
                <Select
                  value={formData.addType}
                  onValueChange={(value) => setFormData({ ...formData, addType: value as AddType })}
                >
                  <SelectTrigger id="addType" data-testid="select-ad-type" className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Card</SelectItem>
                    <SelectItem value="timer">Countdown Timer</SelectItem>
                    <SelectItem value="quantity">Countdown QTY (Dynamic)</SelectItem>
                    <SelectItem value="both">Both (Timer + QTY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Countdown Timer Duration - Only for timer or both */}
              {(formData.addType === "timer" || formData.addType === "both") && (
                <div className="space-y-2">
                  <Label className="text-[11px] font-medium">Countdown Timer (Decision Time)</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="countdownDays" className="text-[10px] font-medium">Days</Label>
                      <Input
                        id="countdownDays"
                        type="number"
                        min="0"
                        max="365"
                        value={formData.countdownDays || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, countdownDays: parseInt(e.target.value) || undefined })
                        }
                        data-testid="input-countdown-days"
                        className="h-8 text-sm w-16"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="countdownHours" className="text-[10px] font-medium">Hours</Label>
                      <Input
                        id="countdownHours"
                        type="number"
                        min="0"
                        max="23"
                        value={formData.countdownHours || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, countdownHours: parseInt(e.target.value) || undefined })
                        }
                        data-testid="input-countdown-hours"
                        className="h-8 text-sm w-16"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="countdownMinutes" className="text-[10px] font-medium">Mins</Label>
                      <Input
                        id="countdownMinutes"
                        type="number"
                        min="0"
                        max="59"
                        value={formData.countdownMinutes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, countdownMinutes: parseInt(e.target.value) || undefined })
                        }
                        data-testid="input-countdown-minutes"
                        className="h-8 text-sm w-16"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="countdownSeconds" className="text-[10px] font-medium">Secs</Label>
                      <Input
                        id="countdownSeconds"
                        type="number"
                        min="0"
                        max="59"
                        value={formData.countdownSeconds || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, countdownSeconds: parseInt(e.target.value) || undefined })
                        }
                        data-testid="input-countdown-seconds"
                        className="h-8 text-sm w-16"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Time Bomb Duration - Always show */}
              <div className="space-y-2">
                <Label className="text-[11px] font-medium">Time Bomb (Redemption Deadline)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="timeBombDays" className="text-[10px] font-medium">Days</Label>
                    <Input
                      id="timeBombDays"
                      type="number"
                      min="0"
                      max="365"
                      value={formData.timeBombDays || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, timeBombDays: parseInt(e.target.value) || undefined })
                      }
                      data-testid="input-timebomb-days"
                      className="h-8 text-sm w-16"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="timeBombHours" className="text-[10px] font-medium">Hours</Label>
                    <Input
                      id="timeBombHours"
                      type="number"
                      min="0"
                      max="23"
                      value={formData.timeBombHours || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, timeBombHours: parseInt(e.target.value) || undefined })
                      }
                      data-testid="input-timebomb-hours"
                      className="h-8 text-sm w-16"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="timeBombMinutes" className="text-[10px] font-medium">Mins</Label>
                    <Input
                      id="timeBombMinutes"
                      type="number"
                      min="0"
                      max="59"
                      value={formData.timeBombMinutes || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, timeBombMinutes: parseInt(e.target.value) || undefined })
                      }
                      data-testid="input-timebomb-minutes"
                      className="h-8 text-sm w-16"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="timeBombSeconds" className="text-[10px] font-medium">Secs</Label>
                    <Input
                      id="timeBombSeconds"
                      type="number"
                      min="0"
                      max="59"
                      value={formData.timeBombSeconds || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, timeBombSeconds: parseInt(e.target.value) || undefined })
                      }
                      data-testid="input-timebomb-seconds"
                      className="h-8 text-sm w-16"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* STAGE 2 CARD */}
        <Card 
          id="advanced-stage2" 
          className={`bg-purple-200 dark:bg-purple-950/40 transition-opacity ${
            hasCountdownDuration ? 'opacity-50 pointer-events-none' : ''
          }`}
          style={{ scrollMarginTop: 'calc(var(--app-header-height, 80px) + 52px)' }}
        >
          <CardHeader className="py-2 px-6">
            <CardTitle className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">
              Permutation/Advanced Options Stage 2
              {hasCountdownDuration && <span className="ml-2 text-[10px] font-normal">(Stage 1 Active)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-6 space-y-3">
            
            {/* Permutation Set */}
            <div className="space-y-0.5">
              <Label htmlFor="permutationSet" className="text-[11px] font-medium">Permutation Set</Label>
              <Select 
                value={formData.scheduleType || "no_countdowns"}
                onValueChange={(value) => setFormData({ ...formData, scheduleType: value })}
              >
                <SelectTrigger id="permutationSet" className="h-7 text-xs" data-testid="select-permutation-set">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_countdowns">No Countdowns</SelectItem>
                  <SelectItem value="countdown_timer">Countdown Timer (CT)</SelectItem>
                  <SelectItem value="countdown_qty">Countdown Qty (CQ)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Completion Fields based on Permutation Set */}
            {formData.scheduleType === "countdown_timer" && (
              <div className="space-y-2 border-l-2 border-purple-400 pl-3">
                <p className="text-[10px] font-semibold text-purple-900 dark:text-purple-100">Countdown Timer Settings</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="ct-days" className="text-[10px]">Days</Label>
                    <Input id="ct-days" type="number" min="0" placeholder="0" className="h-6 text-xs" data-testid="input-ct-days" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="ct-hours" className="text-[10px]">Hours</Label>
                    <Input id="ct-hours" type="number" min="0" max="23" placeholder="0" className="h-6 text-xs" data-testid="input-ct-hours" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="ct-minutes" className="text-[10px]">Min</Label>
                    <Input id="ct-minutes" type="number" min="0" max="59" placeholder="0" className="h-6 text-xs" data-testid="input-ct-minutes" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="ct-seconds" className="text-[10px]">Sec</Label>
                    <Input id="ct-seconds" type="number" min="0" max="59" placeholder="0" className="h-6 text-xs" data-testid="input-ct-seconds" />
                  </div>
                </div>
              </div>
            )}

            {formData.scheduleType === "countdown_qty" && (
              <div className="space-y-2 border-l-2 border-purple-400 pl-3">
                <p className="text-[10px] font-semibold text-purple-900 dark:text-purple-100">Countdown Qty Settings</p>
                <div className="space-y-0.5">
                  <Label htmlFor="cq-inventory" className="text-[10px]">Initial Inventory</Label>
                  <Input 
                    id="cq-inventory" 
                    type="number" 
                    min="1" 
                    placeholder="e.g., 50" 
                    className="h-6 text-xs" 
                    data-testid="input-cq-inventory" 
                  />
                </div>
              </div>
            )}

            {formData.scheduleType === "both" && (
              <div className="space-y-2 border-l-2 border-purple-400 pl-3">
                <p className="text-[10px] font-semibold text-purple-900 dark:text-purple-100">Both Countdown Settings</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="both-days" className="text-[10px]">Days</Label>
                    <Input id="both-days" type="number" min="0" placeholder="0" className="h-6 text-xs" data-testid="input-both-days" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="both-hours" className="text-[10px]">Hours</Label>
                    <Input id="both-hours" type="number" min="0" max="23" placeholder="0" className="h-6 text-xs" data-testid="input-both-hours" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="both-minutes" className="text-[10px]">Min</Label>
                    <Input id="both-minutes" type="number" min="0" max="59" placeholder="0" className="h-6 text-xs" data-testid="input-both-minutes" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="both-seconds" className="text-[10px]">Sec</Label>
                    <Input id="both-seconds" type="number" min="0" max="59" placeholder="0" className="h-6 text-xs" data-testid="input-both-seconds" />
                  </div>
                </div>
                <div className="space-y-0.5 mt-2">
                  <Label htmlFor="both-inventory" className="text-[10px]">Initial Inventory</Label>
                  <Input 
                    id="both-inventory" 
                    type="number" 
                    min="1" 
                    placeholder="e.g., 50" 
                    className="h-6 text-xs" 
                    data-testid="input-both-inventory" 
                  />
                </div>
              </div>
            )}

            {/* Auto-Extend */}
            <div className="space-y-0.5">
              <Label htmlFor="autoExtend" className="text-[11px] font-medium">Auto-Extend</Label>
              <Select 
                value={formData.autoExtend ? "enabled" : "disabled"}
                onValueChange={(value) => setFormData({ ...formData, autoExtend: value === "enabled" })}
              >
                <SelectTrigger id="autoExtend" className="h-7 text-xs" data-testid="select-auto-extend">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disabled">Disabled</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Duration */}
            <div className="space-y-0.5">
              <Label htmlFor="campaignDuration" className="text-[11px] font-medium">Campaign Duration (Days)</Label>
              <Input
                id="campaignDuration"
                type="number"
                min="1"
                value={formData.campaignDuration || ""}
                onChange={(e) => setFormData({ ...formData, campaignDuration: parseInt(e.target.value) || undefined })}
                placeholder="e.g., 7, 14, 30"
                className="h-7 text-xs"
                data-testid="input-campaign-duration"
              />
            </div>
          </CardContent>
        </Card>
        
      </div>
        );
      })()}

      <div className="grid grid-cols-2 gap-4 mt-6">
        <Button 
          type="button"
          onClick={handleSaveAsDraft}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          data-testid="button-save-stage"
        >
          Single Offer Test - Forward to Stage 1
        </Button>
        <Button 
          type="button"
          onClick={handleCreateBatchPermutations}
          disabled={isCreatingPermutations}
          className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
          data-testid="button-create-batch"
        >
          {isCreatingPermutations ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Creating...
            </>
          ) : (
            "Create Batch (Pre-Campaign)"
          )}
        </Button>
      </div>
      </form>
    </>
  );
}
