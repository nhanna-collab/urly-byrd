import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, MessageSquare, Users } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface BankAllocationProps {
  user: User;
}

export default function BankAllocation({ user }: BankAllocationProps) {
  const { toast } = useToast();
  const [textBudget, setTextBudget] = useState("");
  const [ripsBudget, setRipsBudget] = useState("");
  const [displayBank, setDisplayBank] = useState(0);

  // Initialize from user data
  useEffect(() => {
    const currentText = Math.round(parseFloat(user.merchantTextBudget as any || "0"));
    const currentRips = Math.round(parseFloat(user.merchantRipsBudget as any || "0"));
    const currentBank = Math.round(parseFloat(user.merchantBank as any || "0"));
    
    setTextBudget(currentText.toString());
    setRipsBudget(currentRips.toString());
    setDisplayBank(currentBank);
  }, [user]);

  const currentTextBudget = parseFloat(user.merchantTextBudget as any || "0");
  const currentRipsBudget = parseFloat(user.merchantRipsBudget as any || "0");
  const actualBank = parseFloat(user.merchantBank as any || "0");

  const allocateMutation = useMutation({
    mutationFn: async (data: { textBudget: number; ripsBudget: number }) => {
      const response = await apiRequest("POST", "/api/bank/allocate", data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Update user data in cache immediately
      queryClient.setQueryData(["/api/auth/user"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          merchantBank: data.merchantBank,
          merchantTextBudget: data.merchantTextBudget,
          merchantRipsBudget: data.merchantRipsBudget,
        };
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to allocate budget",
      });
      // Reset to actual values on error
      setDisplayBank(actualBank);
      setTextBudget(Math.round(currentTextBudget).toString());
      setRipsBudget(Math.round(currentRipsBudget).toString());
    },
  });

  const handleAllocate = (newTextBudget: string, newRipsBudget: string) => {
    const textValue = parseFloat(newTextBudget) || 0;
    const ripsValue = parseFloat(newRipsBudget) || 0;

    // Calculate the difference from current allocations
    const textDiff = textValue - currentTextBudget;
    const ripsDiff = ripsValue - currentRipsBudget;
    const totalDiff = textDiff + ripsDiff;

    // Update display immediately
    const newBank = actualBank - totalDiff;
    setDisplayBank(Math.round(newBank));

    // Check if there's enough bank balance
    if (totalDiff > actualBank) {
      toast({
        variant: "destructive",
        title: "Insufficient Funds",
        description: `You need $${Math.round(totalDiff)} but only have $${Math.round(actualBank)} available`,
      });
      // Reset display
      setDisplayBank(Math.round(actualBank));
      return;
    }

    // Only send if values actually changed
    if (textValue === currentTextBudget && ripsValue === currentRipsBudget) {
      return;
    }

    allocateMutation.mutate({
      textBudget: textValue,
      ripsBudget: ripsValue,
    });
  };

  const handleTextChange = (value: string) => {
    setTextBudget(value);
    handleAllocate(value, ripsBudget);
  };

  const handleRipsChange = (value: string) => {
    setRipsBudget(value);
    handleAllocate(textBudget, value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Bank Allocation
        </CardTitle>
        <CardDescription className="text-xs">
          Type amounts - updates in real time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            Bank Balance
          </Label>
          <div className="h-10 px-4 rounded-md border bg-muted flex items-center text-lg font-bold">
            ${displayBank}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
