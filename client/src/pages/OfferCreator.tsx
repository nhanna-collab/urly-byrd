import AppHeader from "@/components/AppHeader";
import OfferForm from "@/components/OfferForm";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export default function OfferCreator() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createOfferMutation = useMutation({
    mutationFn: async (offerData: any) => {
      return await apiRequest("POST", "/api/offers", offerData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Offer saved to Stage 1",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      // Navigate to Offers page (Stage 1)
      setLocation("/offers");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save offer",
        description: error.message || "Please try again",
      });
    },
  });

  const handleSubmit = (offerData: any) => {
    createOfferMutation.mutate(offerData);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">Create Offer</h1>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button 
                  type="button"
                  className="text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  data-testid="button-workflow-info"
                  aria-label="Workflow information"
                >
                  <Info className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-md bg-red-600 dark:bg-red-700 text-white border-red-700">
                <p className="text-sm">
                  Save single offers and pre-campaigns to stage 1 and stage 2 respectively. These two stages delineate a one-time offer/test vs. campaigns in an orderly fashion, for easy implementation. Scheduling an offer for more than one future time period/date or having multiple offers created at the same time and launched together, escalates to a campaign.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <OfferForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
