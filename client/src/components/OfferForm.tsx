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
}

export default function OfferForm({ onSubmit, onCancel, initialData, userTier, user, menuItems = [], folders = [] }: OfferFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const STORAGE_KEY = "urlybyrd_offer_draft";
  
  const tierCapabilities = getTierCapabilities(userTier || "NEST");
  const pricePerClick = 1.65; // Default price per new customer
  

  const getInitialFormData = (): OfferFormData => {
    if (initialData?.title) return {
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
    };

    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Normalize startDate to string for backward compatibility and consistency
        parsed.startDate = String(parsed.startDate ?? "");
        return parsed;
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }

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
      originalPrice: "",
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
      maxClicksAllowed: 1,
      shutDownAtMaximum: false,
      notifyAtMaximum: false,
      clickBudgetDollars: 5,
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
    
    // Countdown validation (legacy support for old "countdown" ad type)
    // New ad types (timer, both) use countdownTimerSeconds field instead
    if (formData.addType === "timer" || formData.addType === "both") {
      // Timer countdown validation handled by backend defaults
      // Default is 30 seconds, can be changed in Stage 1
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
    
    localStorage.removeItem(STORAGE_KEY);
    
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
    
    localStorage.removeItem(STORAGE_KEY);
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
          {/* Row 1: Title, Product, Actual Price, ZIP, Image */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <Label htmlFor="title" className="text-[11px] font-medium">Offer Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required data-testid="input-title" className="h-7 text-xs" />
            </div>
            <div className="col-span-3">
              <Label htmlFor="menuItem" className="text-[11px] font-medium">Product / Service *</Label>
              <Autocomplete id="menuItem" value={formData.menuItem} onValueChange={(value) => setFormData({ ...formData, menuItem: value })} options={menuItems} required data-testid="input-menu-item" className="h-7" />
            </div>
            <div className="col-span-1">
              <Label htmlFor="originalPrice" className="text-[11px] font-medium">Orig. Price</Label>
              <div className="relative">
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                <Input id="originalPrice" type="number" min="0" step="0.01" className="pl-3.5 h-7 text-xs" value={formData.originalPrice || ""} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} placeholder="0" data-testid="input-original-price" />
              </div>
            </div>
            <div className="col-span-1">
              <Label htmlFor="zipCode" className="text-[11px] font-medium">ZIP *</Label>
              <Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} maxLength={10} required data-testid="input-zip" className="h-7 text-xs" />
            </div>
            <div className="col-span-4 text-center">
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
            <div className="col-span-6">
              <Label htmlFor="description" className="text-[11px] font-medium">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} required data-testid="input-description" className="resize-none text-xs min-h-0" />
            </div>
            <div className="col-span-3 col-start-10 space-y-0.5">
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

          {/* Row 3: Conditional Delivery Method for Pay At Redemption */}
          {formData.redemptionType === "pay_at_redemption" && (
            <div className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-3 space-y-0.5">
                <Label htmlFor="couponDeliveryMethod" className="text-[11px] font-medium">Card</Label>
                <Select value={formData.couponDeliveryMethod || ""} onValueChange={(value) => setFormData({ ...formData, couponDeliveryMethod: value as CouponDeliveryMethod })}>
                  <SelectTrigger id="couponDeliveryMethod" className="h-7 text-xs" data-testid="select-delivery-method">
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coupon_codes">Coupon Codes</SelectItem>
                    <SelectItem value="mobile_app_based_coupons">Icon Link (Mobile App)</SelectItem>
                    <SelectItem value="mms_based_coupons">MMS (Image)</SelectItem>
                    <SelectItem value="text_message_alerts">Text Message Alerts</SelectItem>
                    <SelectItem value="mobile_wallet_passes">Mobile Wallet Passes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Coupon Codes - Auto Generate Code + Manual Code + POS Webhook */}
              {formData.couponDeliveryMethod === "coupon_codes" && (
                <>
                  <div className="col-span-3 flex items-center gap-2 h-7">
                    <Label htmlFor="autoGenerateCode" className="text-[11px] font-medium cursor-pointer">Auto Generate Code</Label>
                    <Switch 
                      id="autoGenerateCode" 
                      checked={(formData.deliveryConfig as any)?.autoGenerateCode || false} 
                      onCheckedChange={(checked) => setFormData({ ...formData, deliveryConfig: { autoGenerateCode: checked }, couponCode: checked ? undefined : formData.couponCode })} 
                      data-testid="switch-auto-generate-code" 
                    />
                  </div>
                  {!(formData.deliveryConfig as any)?.autoGenerateCode ? (
                    <div className="col-span-3 space-y-0.5">
                      <Label htmlFor="couponCode" className="text-[11px] font-medium">Coupon Code</Label>
                      <Input 
                        id="couponCode" 
                        value={formData.couponCode || ""} 
                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })} 
                        placeholder="SAVE20" 
                        data-testid="input-coupon-code" 
                        className="h-7 text-xs" 
                      />
                    </div>
                  ) : (
                    <div className="col-span-6 space-y-0.5">
                      <Label htmlFor="posWebhookUrl" className="text-[11px] font-medium">POS Webhook URL (Optional)</Label>
                      <Input 
                        id="posWebhookUrl" 
                        type="url" 
                        value={formData.posWebhookUrl || ""} 
                        onChange={(e) => setFormData({ ...formData, posWebhookUrl: e.target.value })} 
                        placeholder="https://your-pos-system.com/webhooks/coupons" 
                        data-testid="input-pos-webhook-url" 
                        className="h-7 text-xs" 
                      />
                    </div>
                  )}
                </>
              )}

              {/* Mobile App - Deep Link */}
              {formData.couponDeliveryMethod === "mobile_app_based_coupons" && (
                <div className="col-span-6 space-y-0.5">
                  <Label htmlFor="appDeepLink" className="text-[11px] font-medium">App Deep Link</Label>
                  <Input 
                    id="appDeepLink" 
                    type="url" 
                    value={(formData.deliveryConfig as any)?.appDeepLink || ""} 
                    onChange={(e) => setFormData({ ...formData, deliveryConfig: { appDeepLink: e.target.value } })} 
                    placeholder="myapp://..." 
                    data-testid="input-app-deep-link" 
                    className="h-7 text-xs" 
                  />
                </div>
              )}

              {/* MMS - Coupon Image URL */}
              {formData.couponDeliveryMethod === "mms_based_coupons" && (
                <div className="col-span-6 space-y-0.5">
                  <Label htmlFor="couponImageUrl" className="text-[11px] font-medium">Coupon Image URL</Label>
                  <Input 
                    id="couponImageUrl" 
                    type="url" 
                    value={(formData.deliveryConfig as any)?.couponImageUrl || ""} 
                    onChange={(e) => setFormData({ ...formData, deliveryConfig: { couponImageUrl: e.target.value } })} 
                    placeholder="https://..." 
                    data-testid="input-coupon-image-url" 
                    className="h-7 text-xs" 
                  />
                </div>
              )}

              {/* Text Alerts - Message Template */}
              {formData.couponDeliveryMethod === "text_message_alerts" && (
                <div className="col-span-6 space-y-0.5">
                  <Label htmlFor="messageTemplate" className="text-[11px] font-medium">Message Template</Label>
                  <Input 
                    id="messageTemplate" 
                    value={(formData.deliveryConfig as any)?.messageTemplate || ""} 
                    onChange={(e) => setFormData({ ...formData, deliveryConfig: { messageTemplate: e.target.value } })} 
                    placeholder="Your coupon: {code}" 
                    data-testid="input-message-template" 
                    className="h-7 text-xs" 
                  />
                </div>
              )}

              {/* Mobile Wallet - Barcode Type */}
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
          )}

          {formData.redemptionType === "prepayment_offer" && (
            <div className="flex items-start gap-4">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="purchaseUrl" className="text-[11px] font-medium">Purchase URL *</Label>
                <Input 
                  id="purchaseUrl" 
                  type="url" 
                  value={formData.purchaseUrl || ""} 
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })} 
                  placeholder="https://..." 
                  data-testid="input-purchase-url" 
                  className="h-7 text-xs" 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Offer Terms */}
      <Card id="terms" className="bg-orange-200 dark:bg-orange-950/40 mt-6" style={{ scrollMarginTop: 'calc(var(--app-header-height, 80px) + 52px)' }}>
        <CardHeader className="py-2 px-6">
          <CardTitle className="text-xs font-bold text-black dark:text-white uppercase tracking-wide">Offer Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 py-3 px-6">

          {/* Row 1: Payment Type + Purchase URL */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <Label htmlFor="couponType" className="text-[11px] font-medium">Payment Type *</Label>
              <Select value={formData.redemptionType} onValueChange={(value) => setFormData({ ...formData, redemptionType: value as RedemptionType })}>
                <SelectTrigger id="couponType" data-testid="select-coupon-type" className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pay_at_redemption">Pay At Redemption (PAR)</SelectItem>
                  <SelectItem value="prepayment_offer">Pre-Payment Offer (PPO)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.redemptionType === "prepayment_offer" && (
              <div className="col-span-9">
                <Label htmlFor="purchaseUrl" className="text-[11px] font-medium">Purchase URL *</Label>
                <Input 
                  id="purchaseUrl" 
                  type="url" 
                  value={formData.purchaseUrl || ""} 
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })} 
                  placeholder="https://your-store.com/checkout" 
                  data-testid="input-purchase-url-section2" 
                  className="h-7 text-xs" 
                />
              </div>
            )}
          </div>

          {/* Row 2: Offer Type */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <Label htmlFor="offerType" className="text-[11px] font-medium">Offer Type (Single) *</Label>
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
                  <SelectItem value="percentage">Percentage Off (PCT)</SelectItem>
                  <SelectItem value="dollar_amount">Dollar Amount Off (DOL)</SelectItem>
                  <SelectItem value="bogo">Buy One Get One (BOGO)</SelectItem>
                  <SelectItem value="spend_threshold">Spend X Get Y Off (XY)</SelectItem>
                  <SelectItem value="buy_x_get_y">Buy X Get Y for Free (XYF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Percentage Off */}
          {formData.offerType === "percentage" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="percentageOff" className="text-[11px] font-medium">Percentage Off *</Label>
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
            </div>
          )}

          {/* Dollar Amount */}
          {formData.offerType === "dollar_amount" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="dollarOff" className="text-[11px] font-medium">Dollar Amount *</Label>
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
            </div>
          )}

          {/* BOGO */}
          {formData.offerType === "bogo" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 space-y-0.5">
                <Label htmlFor="bogoItem" className="text-[11px] font-medium">BOGO Item *</Label>
                <Input 
                  id="bogoItem" 
                  value={formData.bogoItem || ""} 
                  onChange={(e) => setFormData({ ...formData, bogoItem: e.target.value })} 
                  placeholder="Item name" 
                  data-testid="input-bogo-item" 
                  className="h-7 text-xs" 
                />
              </div>
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="buyQuantity" className="text-[11px] font-medium">Buy Quantity *</Label>
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
                <Label htmlFor="getQuantity" className="text-[11px] font-medium">Get Quantity *</Label>
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
                <Label htmlFor="bogoPercentageOff" className="text-[11px] font-medium">At % Off *</Label>
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
            </div>
          )}

          {/* Spend Threshold */}
          {formData.offerType === "spend_threshold" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="spendThreshold" className="text-[11px] font-medium">Spend Threshold *</Label>
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
                <Label htmlFor="thresholdDiscount" className="text-[11px] font-medium">Discount Amount *</Label>
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
            </div>
          )}

          {/* Buy X Get Y Free */}
          {formData.offerType === "buy_x_get_y" && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3 space-y-0.5">
                <Label htmlFor="xyfFreeItem" className="text-[11px] font-medium">Free Item *</Label>
                <Input 
                  id="xyfFreeItem" 
                  value={formData.xyfFreeItem || ""} 
                  onChange={(e) => setFormData({ ...formData, xyfFreeItem: e.target.value })} 
                  placeholder="Free item name" 
                  data-testid="input-xyf-free-item"
                  className="h-7 text-xs"
                />
              </div>
              <div className="col-span-2 space-y-0.5">
                <Label htmlFor="buyQuantityXYF" className="text-[11px] font-medium">Buy Quantity *</Label>
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
                <Label htmlFor="getQuantityXYF" className="text-[11px] font-medium">Get Quantity *</Label>
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
            </div>
          )}

          {/* Max Clicks (Before ending offer) */}
          <div className="grid grid-cols-12 gap-4 border-t pt-3 mt-3">
            <div className="col-span-3 space-y-0.5">
              <Label htmlFor="maxClicksAllowed" className="text-[11px] font-medium">Max Clicks (Before Ending) *</Label>
              <Input
                id="maxClicksAllowed"
                type="number"
                min="1"
                value={formData.maxClicksAllowed || ""}
                onChange={(e) =>
                  setFormData({ ...formData, maxClicksAllowed: parseInt(e.target.value) || 1 })
                }
                data-testid="input-max-clicks-allowed"
                className="h-7 text-xs"
                placeholder="1000"
                required
              />
            </div>
          </div>

        </CardContent>
      </Card>

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
