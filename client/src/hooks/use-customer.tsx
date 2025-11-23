import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface Customer {
  id: string;
  phoneNumber: string;
  zipCode: string;
  verified: boolean;
  following: string[];
}

export function useCustomer() {
  const { data: customer, isLoading } = useQuery<Customer | null>({
    queryKey: ["/api/customers/me"],
  });

  return {
    customer,
    isLoading,
    isAuthenticated: !!customer,
  };
}

export function useFollowMerchant() {
  return useMutation({
    mutationFn: async (merchantId: string) => {
      const res = await fetch(`/api/customers/follow/${merchantId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to follow merchant");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
    },
  });
}

export function useUnfollowMerchant() {
  return useMutation({
    mutationFn: async (merchantId: string) => {
      const res = await fetch(`/api/customers/follow/${merchantId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to unfollow merchant");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
    },
  });
}
