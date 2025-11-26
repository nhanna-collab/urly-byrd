import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";
import { useCheckIn } from "@/hooks/useCheckIn";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Reports from "@/pages/Reports";
import QuickStart from "@/pages/QuickStart";
import MerchantCollateral from "@/pages/MerchantCollateral";
import MerchantPage from "@/pages/MerchantPage";
import OfferDetailPage from "@/pages/OfferDetailPage";
import VerifyEmail from "@/pages/VerifyEmail";
import FlashMarketing from "@/pages/FlashMarketing";
import StartCampaigns from "@/pages/StartCampaigns";
import ConceptLab from "@/pages/ConceptLab";
import AllConcepts from "@/pages/concepts/AllConcepts";
import Offers from "@/pages/Offers";
import Stage2 from "@/pages/Stage2";
import OfferTemplates from "@/pages/OfferTemplates";
import OfferCreator from "@/pages/OfferCreator";
import BatchBuildStage1 from "@/pages/BatchBuildStage1";
import BatchGrid from "@/pages/BatchGrid";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import SmsCampaigns from "@/pages/SmsCampaigns";
import ViewFeedback from "@/pages/ViewFeedback";
import ColorPalette from "@/pages/ColorPalette";
import TestQR from "@/pages/TestQR";
import CustomerLanding from "@/pages/CustomerLanding";
import CustomerSignup from "@/pages/CustomerSignup";
import CustomerRewards from "@/pages/CustomerRewards";
import CustomerProfile from "@/pages/CustomerProfile";
import Customers from "@/pages/Customers";
import MerchantsList from "@/pages/MerchantsList";
import Information from "@/pages/Information";
import NotificationSettings from "@/pages/NotificationSettings";
import Terminology from "@/pages/Terminology";
import PricingTrial from "@/pages/PricingTrial";
import NotFound from "@/pages/not-found";

function Router() {
  // Automatic check-in on app load for authenticated customers
  useCheckIn();

  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/flash-marketing" component={FlashMarketing} />
        <Route path="/start-campaigns" component={StartCampaigns} />
        <Route path="/offers" component={Offers} />
        <Route path="/stage2" component={Stage2} />
        <Route path="/templates" component={OfferTemplates} />
        <Route path="/create-offer" component={OfferCreator} />
        <Route path="/batch-build-stage1" component={BatchBuildStage1} />
        <Route path="/batch-grid/:folderId" component={BatchGrid} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/campaigns/:id" component={CampaignDetail} />
        <Route path="/sms-campaigns" component={SmsCampaigns} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/dashboard/create" component={OfferCreator} />
        <Route path="/reports" component={Reports} />
        <Route path="/quick-start" component={QuickStart} />
        <Route path="/merchant-collateral" component={MerchantCollateral} />
        <Route path="/merchant/:merchantId" component={MerchantPage} />
        <Route path="/offer/:offerId" component={OfferDetailPage} />
        <Route path="/verify" component={VerifyEmail} />
        <Route path="/concept-lab" component={ConceptLab} />
        <Route path="/concept-lab/all" component={AllConcepts} />
        <Route path="/view-feedback" component={ViewFeedback} />
        <Route path="/color-palette" component={ColorPalette} />
        <Route path="/test-qr" component={TestQR} />
        <Route path="/customer-landing" component={CustomerLanding} />
        <Route path="/customer-signup" component={CustomerSignup} />
        <Route path="/customer-rewards" component={CustomerRewards} />
        <Route path="/customer-profile" component={CustomerProfile} />
        <Route path="/customers" component={Customers} />
        <Route path="/merchants" component={MerchantsList} />
        <Route path="/information" component={Information} />
        <Route path="/settings/notifications" component={NotificationSettings} />
        <Route path="/terminology" component={Terminology} />
        <Route path="/pricing-trial" component={PricingTrial} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
