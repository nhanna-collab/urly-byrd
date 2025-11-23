import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@shared/schema";

export function useCustomerAuth() {
  const { data: customer, isLoading } = useQuery<Customer | null>({
    queryKey: ["/api/customers/me"],
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/customers/me", {
        credentials: "include",
      });
      
      // Return null on 401 (not authenticated) instead of throwing
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error("Failed to fetch customer");
      }
      
      return res.json();
    },
  });

  return {
    customer: customer ?? null,
    isLoading,
    isAuthenticated: !!customer,
  };
}
