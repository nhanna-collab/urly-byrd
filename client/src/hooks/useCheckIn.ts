import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "./useCustomerAuth";

export function useCheckIn() {
  const { customer } = useCustomerAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

  const checkInMutation = useMutation({
    mutationFn: async (location: { latitude: number; longitude: number; zipCode?: string }) => {
      return apiRequest("POST", "/api/customers/check-in", location);
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({
          title: "Check-in Reward!",
          description: data.message,
          variant: "default",
        });
        
        // Invalidate customer data to refresh points balance
        queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      } else {
        // Cooldown period - show info but don't error
        console.log("Check-in cooldown:", data.message);
      }
    },
    onError: (error: any) => {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in Failed",
        description: "Could not process your check-in",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Only request location once per session for authenticated customers
    if (!customer || hasRequestedLocation) return;

    setHasRequestedLocation(true);

    // Check if geolocation is supported
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Attempt check-in with location data
          checkInMutation.mutate({
            latitude,
            longitude,
          });
        },
        (error) => {
          console.log("Geolocation denied or failed:", error.message);
          // Still attempt check-in without coordinates (will use stored ZIP)
          // @ts-ignore - TypeScript doesn't know latitude/longitude can be optional in the API
          checkInMutation.mutate({});
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    } else {
      // Geolocation not supported - check in without coordinates
      // @ts-ignore - TypeScript doesn't know latitude/longitude can be optional in the API
      checkInMutation.mutate({});
    }
  }, [customer, hasRequestedLocation]);

  return {
    isCheckingIn: checkInMutation.isPending,
    checkIn: checkInMutation.mutate,
  };
}
