import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import StatsCard from "@/components/StatsCard";
import SmsBudgetCard from "@/components/SmsBudgetCard";
import OfferForm, { type OfferFormData } from "@/components/OfferForm";
import EditOfferDialog from "@/components/EditOfferDialog";
import CustomerImport from "@/components/CustomerImport";
import { PrintableSigns } from "@/components/PrintableSigns";
import BankManagement from "@/components/BankManagement";
import MerchantQRCode from "@/components/MerchantQRCode";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, TrendingUp, Clock, Archive, Plus, Edit, Trash2, Loader2, ShoppingCart, Bell, X, AlertCircle, Rocket, BarChart3, DollarSign, MousePointerClick, Percent, Users } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Offer, Notification, CampaignFolder, DashboardStats, OfferType, RedemptionType, AddType, CouponDeliveryMethod } from "@shared/schema";

function OfferClaimStats({ offerId }: { offerId: string }) {
  const { data: stats } = useQuery<{ totalClaims: number; avgResponseTimeMinutes: number | null; avgConsiderationTimeMinutes: number | null }>({
    queryKey: ["/api/offer-claim-stats", offerId],
  });

  return <span className="text-sm">{stats?.totalClaims || 0}</span>;
}

function OfferResponseTime({ offerId }: { offerId: string }) {
  const { data: stats } = useQuery<{ totalClaims: number; avgResponseTimeMinutes: number | null; avgConsiderationTimeMinutes: number | null }>({
    queryKey: ["/api/offer-claim-stats", offerId],
  });

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "—";
    if (minutes < 1) return "< 1m";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <span className="text-sm text-muted-foreground" data-testid={`text-response-time-${offerId}`}>
      {formatTime(stats?.avgResponseTimeMinutes || null)}
    </span>
  );
}

function OfferConsiderationTime({ offerId }: { offerId: string }) {
  const { data: stats } = useQuery<{ totalClaims: number; avgResponseTimeMinutes: number | null; avgConsiderationTimeMinutes: number | null }>({
    queryKey: ["/api/offer-claim-stats", offerId],
  });

  const formatTime = (minutes: number | null) => {
    if (minutes === null) return "—";
    if (minutes < 1) return "< 1m";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <span className="text-sm text-muted-foreground" data-testid={`text-consideration-time-${offerId}`}>
      {formatTime(stats?.avgConsiderationTimeMinutes || null)}
    </span>
  );
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  
  // Initialize showCreateForm based on route - prevents flash
  const [showCreateForm, setShowCreateForm] = useState(location === '/dashboard/create');
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [duplicateOfferData, setDuplicateOfferData] = useState<Partial<OfferFormData> | null>(null);
  const [draftToComplete, setDraftToComplete] = useState<Partial<OfferFormData> | null>(null);
  const { toast} = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to access the dashboard",
        variant: "destructive",
      });
      const timer = setTimeout(() => {
        setLocation("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, toast, setLocation]);

  useEffect(() => {
    if (!user) return; // Wait for user to load
    
    // Update showCreateForm when route changes
    if (location === '/dashboard/create') {
      setShowCreateForm(true);
    } else if (location === '/dashboard') {
      setShowCreateForm(false);
    }
    
    // Handle duplicate parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('duplicate') === 'true') {
      const duplicateData = localStorage.getItem('urlybyrd_duplicate_offer');
      if (duplicateData) {
        try {
          const parsedData = JSON.parse(duplicateData);
          setDuplicateOfferData(parsedData);
          setShowCreateForm(true);
          // Clear localStorage and URL parameter
          localStorage.removeItem('urlybyrd_duplicate_offer');
        } catch (e) {
          console.error('Failed to parse duplicate offer data', e);
        }
      }
      // Clear the query parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('duplicate');
      window.history.replaceState({}, '', newUrl.pathname);
    }
    
    // Handle completing a draft - load draft data by ID
    const draftId = params.get('id');
    if (draftId && !draftToComplete) {
      // Fetch the draft offer by ID
      fetch(`/api/offers/${draftId}`, {
        credentials: 'include'
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch draft');
          return res.json();
        })
        .then((offer: Offer) => {
          // Convert offer to form data format
          const formData: Partial<OfferFormData> = {
            title: offer.title,
            description: offer.description,
            campaignObjectives: offer.campaignObjectives || [],
            menuItem: offer.menuItem || "",
            offerType: offer.offerType as OfferType,
            percentageOff: offer.percentageOff || undefined,
            dollarOff: offer.dollarOff || undefined,
            buyQuantity: offer.buyQuantity || undefined,
            getQuantity: offer.getQuantity || undefined,
            bogoPercentageOff: offer.bogoPercentageOff || undefined,
            spendThreshold: offer.spendThreshold || undefined,
            thresholdDiscount: offer.thresholdDiscount || undefined,
            originalPrice: offer.originalPrice || "",
            redemptionType: (offer.redemptionType as RedemptionType) || "coupon",
            couponDeliveryMethod: offer.couponDeliveryMethod as CouponDeliveryMethod || undefined,
            deliveryConfig: offer.deliveryConfig || {},
            purchaseUrl: offer.purchaseUrl || "",
            couponCode: offer.couponCode || "",
            addType: (offer.addType as AddType) || "regular",
            countdownDays: offer.countdownDays || undefined,
            countdownHours: offer.countdownHours || undefined,
            countdownMinutes: offer.countdownMinutes || undefined,
            countdownSeconds: offer.countdownSeconds || undefined,
            maxClicksAllowed: offer.maxClicksAllowed || 1,
            shutDownAtMaximum: offer.shutDownAtMaximum || false,
            notifyAtMaximum: offer.notifyAtMaximum || false,
            clickBudgetDollars: offer.clickBudgetDollars || 0,
            durationType: "endDate",
            startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : "",
            endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : "",
            useByDate: "",
            zipCode: offer.zipCode,
            campaignFolder: offer.campaignFolder || undefined,
            targetUnits: offer.targetUnits || undefined,
            autoExtend: offer.autoExtend || false,
            extensionDays: offer.extensionDays || 3,
            notifyOnShortfall: offer.notifyOnShortfall || false,
            notifyOnTargetMet: offer.notifyOnTargetMet || false,
            notifyOnPoorPerformance: offer.notifyOnPoorPerformance || false,
            getNewCustomersEnabled: offer.getNewCustomersEnabled || false,
            imageUrl: offer.imageUrl || undefined,
            videoUrl: offer.videoUrl || "",
            status: "draft", // Keep as draft for completion
          };
          setDraftToComplete(formData);
          setShowCreateForm(true);
          console.log('Loaded draft for completion:', offer.id, formData);
          
          // Clear the id parameter from URL
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('id');
          window.history.replaceState({}, '', newUrl.pathname);
        })
        .catch(err => {
          console.error('Error loading draft:', err);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load draft template",
          });
        });
    }
  }, [user, location, toast]);


  const { data: offers = [], isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ["/api/my-offers"],
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const { data: campaignFolders = [] } = useQuery<CampaignFolder[]>({
    queryKey: ["/api/campaign-folders"],
    enabled: !!user,
  });

  const { data: menuItems = [] } = useQuery<string[]>({
    queryKey: ["/api/my-menu-items"],
    enabled: !!user,
  });

  const { data: dashboardStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
    enabled: !!user,
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: OfferFormData & { _numberOfCopies?: number; _folderName?: string }) => {
      // For drafts, skip date validation - only require title
      const isDraft = data.status === "draft";
      const numberOfCopies = data._numberOfCopies || 1;
      
      // When creating multiple copies, require the entire first section
      if (numberOfCopies > 1) {
        if (!data.title?.trim()) {
          throw new Error("Offer Title is required when creating multiple copies");
        }
        if (!data.menuItem?.trim()) {
          throw new Error("Actual Product / Service is required when creating multiple copies");
        }
        if (!data.description?.trim()) {
          throw new Error("Description is required when creating multiple copies");
        }
      }
      
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (!isDraft) {
        // Validate and convert dates based on duration type (only for active offers)
        startDate = new Date(data.startDate);
        
        if (isNaN(startDate.getTime())) {
          throw new Error("Invalid start date");
        }
        
        // Ensure start date is not in the past (allow 60 second grace window for current minute)
        const now = new Date();
        const graceWindow = 60 * 1000; // 60 seconds
        if (startDate.getTime() < (now.getTime() - graceWindow)) {
          throw new Error("Start time cannot be in the past");
        }
        
        // Handle both duration types - backend only expects endDate
        if (data.durationType === "useByDate" && data.useByDate) {
          // Convert useByDate (date string) to end of day timestamp
          endDate = new Date(data.useByDate + "T23:59:59");
        } else if (data.endDate) {
          endDate = new Date(data.endDate);
        } else {
          throw new Error("End date is required");
        }
        
        if (isNaN(endDate.getTime())) {
          throw new Error("Invalid end date");
        }
        
        // Ensure start date is before end date
        if (startDate >= endDate) {
          throw new Error("Start time must be before end date");
        }
      } else {
        // For drafts, use dates if provided
        if (data.startDate) {
          startDate = new Date(data.startDate);
          if (isNaN(startDate.getTime())) startDate = null;
        }
        if (data.endDate) {
          endDate = new Date(data.endDate);
          if (isNaN(endDate.getTime())) endDate = null;
        } else if (data.useByDate) {
          endDate = new Date(data.useByDate + "T23:59:59");
          if (isNaN(endDate.getTime())) endDate = null;
        }
      }
      
      const offerData: any = {
        title: data.title,
        description: data.description,
        menuItem: data.menuItem,
        offerType: data.offerType,
        zipCode: data.zipCode, // Offer location for proximity filtering
        percentageOff: data.percentageOff || null,
        dollarOff: data.dollarOff || null,
        buyQuantity: data.buyQuantity || null,
        getQuantity: data.getQuantity || null,
        bogoPercentageOff: data.bogoPercentageOff || null,
        spendThreshold: data.spendThreshold || null,
        thresholdDiscount: data.thresholdDiscount || null,
        originalPrice: data.originalPrice || null,
        redemptionType: data.redemptionType || "coupon",
        couponDeliveryMethod: data.couponDeliveryMethod || null,
        deliveryConfig: data.deliveryConfig || {},
        purchaseUrl: data.purchaseUrl || null,
        couponCode: data.couponCode || null,
        addType: data.addType || "regular",
        countdownDays: data.countdownDays || null,
        countdownHours: data.countdownHours || null,
        countdownMinutes: data.countdownMinutes || null,
        countdownSeconds: data.countdownSeconds || null,
        maxClicksAllowed: data.maxClicksAllowed || null,
        shutDownAtMaximum: data.shutDownAtMaximum || false,
        notifyAtMaximum: data.notifyAtMaximum || false,
        clickBudgetDollars: data.clickBudgetDollars || null,
        imageUrl: data.imageUrl || null,
        videoUrl: data.videoUrl || null,
        startDate: startDate,
        endDate: endDate,
        targetUnits: data.targetUnits || null,
        autoExtend: data.autoExtend || false,
        notifyOnShortfall: data.notifyOnShortfall || false,
        notifyOnTargetMet: data.notifyOnTargetMet || false,
        notifyOnPoorPerformance: data.notifyOnPoorPerformance || false,
        getNewCustomersEnabled: data.getNewCustomersEnabled || false,
        status: data.status || "active",
      };
      // Only include extensionDays if auto-extend is enabled
      if (data.autoExtend && data.extensionDays) {
        offerData.extensionDays = data.extensionDays;
      }
      
      // Handle multi-copy creation
      const folderName = data._folderName;
      
      if (numberOfCopies > 1 && folderName) {
        try {
          // Create folder first
          console.log(`Creating folder "${folderName}" for ${numberOfCopies} copies`);
          const folderResponse = await apiRequest("POST", "/api/campaign-folders", {
            name: folderName,
            status: "draft",
          });
          const folderData = await folderResponse.json();
          console.log("Folder created:", folderData);
          const folderId = folderData.id;
          
          if (!folderId) {
            console.error("Failed to get folder ID from response:", folderData);
            throw new Error("Failed to get folder ID from response");
          }
          
          console.log(`Got folder ID: ${folderId}`);
          
          // Create multiple copies in the folder
          console.log(`Creating ${numberOfCopies} offers in folder ${folderId}`);
          for (let i = 0; i < numberOfCopies; i++) {
            const offerPayload = {
              ...offerData,
              title: `${data.title} (Copy ${i + 1})`,
              campaignFolder: folderId,
            };
            console.log(`Creating offer ${i + 1}/${numberOfCopies}:`, offerPayload.title, "folder:", folderId);
            const offerResponse = await apiRequest("POST", "/api/offers", offerPayload);
            const createdOffer = await offerResponse.json();
            console.log(`Offer ${i + 1} created:`, createdOffer.id);
          }
          console.log(`Successfully created ${numberOfCopies} offers in folder ${folderId}`);
        } catch (error) {
          console.error("Error in multi-copy creation:", error);
          throw error;
        }
      } else {
        // Single offer creation
        await apiRequest("POST", "/api/offers", offerData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-folders"] });
      toast({
        title: "Success",
        description: "Offer created successfully",
      });
      setShowCreateForm(false);
      // Notify Navbar that create form is closed
      console.log('[Dashboard] Dispatching createFormStateChanged event after success: isOpen=false');
      window.dispatchEvent(new CustomEvent('createFormStateChanged', { detail: { isOpen: false } }));
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please Sign In",
          description: "Your session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      
      // Parse validation errors from backend
      const errorData = error?.response?.data;
      if (errorData?.error === "VALIDATION_ERROR" && errorData?.details) {
        const fieldErrors = Object.entries(errorData.details).map(([field, msg]: [string, any]) => {
          const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
          return `• ${fieldName}: ${msg}`;
        }).join('\n');
        
        toast({
          title: "Please fix the following issues:",
          description: fieldErrors,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error?.message || "Failed to create offer",
        variant: "destructive",
      });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ offerId, endDate, notifyOnTargetMet, notifyOnPoorPerformance }: { 
      offerId: string; 
      endDate: Date;
      notifyOnTargetMet: boolean;
      notifyOnPoorPerformance: boolean;
    }) => {
      await apiRequest("PATCH", `/api/offers/${offerId}`, { 
        endDate,
        notifyOnTargetMet,
        notifyOnPoorPerformance
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      setEditingOffer(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please Sign In",
          description: "Your session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update offer",
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (offerId: string) => {
      await apiRequest("DELETE", `/api/offers/${offerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Success",
        description: "Offer deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please Sign In",
          description: "Your session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete offer",
        variant: "destructive",
      });
    },
  });

  const incrementSalesMutation = useMutation({
    mutationFn: async ({ offerId, quantity }: { offerId: string; quantity: number }) => {
      await apiRequest("POST", `/api/offers/${offerId}/sales`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      toast({
        title: "Success",
        description: "Sales updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please Sign In",
          description: "Your session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update sales",
        variant: "destructive",
      });
    },
  });

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest("PATCH", `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Please Sign In",
          description: "Your session expired. Please sign in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 500);
      }
    },
  });

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeOffers = offers.filter(
    (o) => o.status === "active" && new Date(o.endDate) > new Date()
  );
  const expiredOffers = offers.filter(
    (o) => o.status === "expired" || new Date(o.endDate) <= new Date()
  );
  const totalViews = offers.reduce((sum, o) => sum + parseInt(o.views || "0"), 0);
  const endingSoon = activeOffers.filter(
    (o) => new Date(o.endDate).getTime() - Date.now() < 24 * 60 * 60 * 1000
  ).length;

  const unreadNotifications = notifications.filter((n) => !n.readAt);

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-8 pb-12">
          <OfferForm
              onSubmit={(data) => createOfferMutation.mutate(data)}
              onCancel={() => {
                setShowCreateForm(false);
                setDuplicateOfferData(null);
                setDraftToComplete(null);
                // Navigate to offers page to see created offers
                setLocation('/offers');
              }}
              userTier={user.membershipTier as "NEST" | "FREEBYRD" | "GLIDE" | "SOAR"}
              user={user}
              menuItems={menuItems}
              folders={campaignFolders}
              initialData={draftToComplete || duplicateOfferData || undefined}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display font-bold text-xl mb-2">
                  Merchant Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Welcome back, {user.firstName || user.email}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full shrink-0">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    New to Urly Byrd?{" "}
                    <button
                      onClick={() => setLocation("/quick-start")}
                      className="text-primary underline decoration-2 underline-offset-2 hover:text-primary/80 transition-colors"
                      data-testid="link-quick-start"
                    >
                      Quick Start Guide
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Learn how to create flash sales, upload customers, and maximize your revenue
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Row - Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <StatsCard title="Active Offers" value={activeOffers.length} icon={Package} />
            <StatsCard title="Total Views" value={dashboardStats?.totalViews.toLocaleString() || "0"} icon={TrendingUp} />
            <StatsCard title="Clicks" value={dashboardStats?.totalClicks.toLocaleString() || "0"} icon={MousePointerClick} data-testid="stat-clicks" />
            <StatsCard title="Click %" value={`${dashboardStats?.clickThroughRate.toFixed(1) || "0"}%`} icon={Percent} data-testid="stat-click-rate" />
            <StatsCard title="Customers" value={dashboardStats?.totalCustomers.toLocaleString() || "0"} icon={Users} data-testid="stat-customers" />
          </div>

          {/* Bottom Row - Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard title="Ending Soon" value={endingSoon} icon={Clock} />
            <StatsCard title="Expired" value={expiredOffers.length} icon={Archive} />
            {user.membershipTier === 'SOAR' && (
              <StatsCard 
                title="Bank Balance" 
                value={`$${(((user as any).merchantBank || 0) / 100).toFixed(2)}`} 
                icon={DollarSign}
                data-testid="stat-bank-balance"
              />
            )}
          </div>

          <div className="mb-8">
            <SmsBudgetCard />
          </div>

          {!user.emailVerified && (
            <Alert variant="destructive" className="mb-8" data-testid="alert-email-verification">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Verification Required</AlertTitle>
              <AlertDescription>
                You must verify your email before creating campaigns. Check your inbox at <strong>{user.email}</strong> for the verification code. 
                Once verified, you'll be able to create flash deals and start promoting your business!
              </AlertDescription>
            </Alert>
          )}


          {unreadNotifications.length > 0 && (
            <Card className="mb-8 bg-blue-100 dark:bg-blue-900/20" data-testid="card-notifications">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>Notifications ({unreadNotifications.length})</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-md bg-background border"
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown date'}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => markNotificationReadMutation.mutate(notification.id)}
                      data-testid={`button-dismiss-${notification.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-blue-100 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-lg">My Offers</CardTitle>
            </CardHeader>
            <CardContent>
              {offersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6 h-auto w-full flex flex-wrap gap-2 justify-start">
                    <TabsTrigger value="active" data-testid="tab-active" className="flex-1 min-w-[120px]">
                      Active ({activeOffers.length})
                    </TabsTrigger>
                    <TabsTrigger value="expired" data-testid="tab-expired" className="flex-1 min-w-[120px]">
                      Expired ({expiredOffers.length})
                    </TabsTrigger>
                    <TabsTrigger value="customers" data-testid="tab-customers" className="flex-1 min-w-[120px]">
                      Customers
                    </TabsTrigger>
                    <TabsTrigger value="qr-code" data-testid="tab-qr-code" className="flex-1 min-w-[120px]">
                      QR Code
                    </TabsTrigger>
                    <TabsTrigger value="signs" data-testid="tab-signs" className="flex-1 min-w-[120px]">
                      Signs
                    </TabsTrigger>
                    <TabsTrigger value="bank" data-testid="tab-bank" className="flex-1 min-w-[120px]">
                      Bank
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Campaigns</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowCreateFolderDialog(true)}
                      data-testid="button-create-folder"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Folder
                    </Button>
                  </div>

                  {campaignFolders.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {campaignFolders.map((folder, index) => (
                        <div 
                          key={folder.id} 
                          className="flex items-center gap-3 p-2 rounded-md border bg-muted/30"
                          data-testid={`folder-${folder.id}`}
                        >
                          <span className="font-medium text-sm text-muted-foreground">
                            {index + 1}.
                          </span>
                          <span className="font-medium flex-1">{folder.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {folder.createdAt ? new Date(folder.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }) : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <TabsContent value="active">
                    {activeOffers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Offer</TableHead>
                              <TableHead>Discount</TableHead>
                              <TableHead>Time Remaining</TableHead>
                              <TableHead>Views</TableHead>
                              <TableHead>Claims</TableHead>
                              <TableHead>Avg Response</TableHead>
                              <TableHead>Avg Consideration</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeOffers.map((offer) => (
                              <TableRow key={offer.id} data-testid={`row-offer-${offer.id}`}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    {offer.imageUrl && (
                                      <img
                                        src={offer.imageUrl}
                                        alt={offer.title}
                                        className="w-12 h-12 rounded object-cover"
                                      />
                                    )}
                                    <span className="font-medium">{offer.title}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{offer.discount}</Badge>
                                </TableCell>
                                <TableCell>
                                  <CountdownTimer endDate={new Date(offer.endDate)} size="sm" />
                                </TableCell>
                                <TableCell>{offer.views || 0}</TableCell>
                                <TableCell>
                                  <OfferClaimStats offerId={offer.id} />
                                </TableCell>
                                <TableCell>
                                  <OfferResponseTime offerId={offer.id} />
                                </TableCell>
                                <TableCell>
                                  <OfferConsiderationTime offerId={offer.id} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Badge variant="default">Active</Badge>
                                    {offer.autoExtend && offer.targetUnits && (
                                      <Badge variant="outline" className="text-xs">
                                        Auto-extend
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setEditingOffer(offer)}
                                      data-testid={`button-edit-${offer.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => deleteOfferMutation.mutate(offer.id)}
                                      data-testid={`button-delete-${offer.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="expired">
                    {expiredOffers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No expired offers
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Offer</TableHead>
                              <TableHead>Discount</TableHead>
                              <TableHead>Ended</TableHead>
                              <TableHead>Views</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expiredOffers.map((offer) => (
                              <TableRow key={offer.id}>
                                <TableCell>{offer.title}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{offer.discount}</Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(offer.endDate).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{offer.views || 0}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="customers">
                    <CustomerImport />
                  </TabsContent>

                  <TabsContent value="qr-code">
                    <MerchantQRCode merchantId={user.id} merchantName={user.businessName || user.email} />
                  </TabsContent>

                  <TabsContent value="signs">
                    <PrintableSigns />
                  </TabsContent>

                  <TabsContent value="bank">
                    <BankManagement />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingOffer && (
        <EditOfferDialog
          offer={editingOffer}
          isOpen={!!editingOffer}
          onClose={() => setEditingOffer(null)}
          onSave={(offerId, endDate, notifyOnTargetMet, notifyOnPoorPerformance) => 
            updateOfferMutation.mutate({ offerId, endDate, notifyOnTargetMet, notifyOnPoorPerformance })
          }
          isPending={updateOfferMutation.isPending}
        />
      )}

      <CreateFolderDialog
        open={showCreateFolderDialog}
        onClose={() => setShowCreateFolderDialog(false)}
      />
    </div>
  );
}
