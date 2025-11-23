import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus } from "lucide-react";
import type { Customer } from "@shared/schema";

export default function CustomerSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");

  const signupMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; zipCode: string }) => {
      const res = await apiRequest("POST", "/api/customers/signup", data);
      return await res.json();
    },
    onSuccess: (data: Customer & { smsDispatched?: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      
      const smsMessage = data.smsDispatched 
        ? "Check your phone for a text with an icon link to add Urly Byrd to your home screen!"
        : "If you didn't get the icon link, you can still browse exclusive offers now!";
      
      toast({
        title: "Welcome to Urly Byrd!",
        description: smsMessage,
      });
      setLocation('/merchant/test-merchant-001');
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSignup = async () => {
    if (!phone || !zipCode) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number and ZIP code",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate({ phoneNumber: phone, zipCode });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-2"
            onClick={() => setLocation('/customer-landing')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-display">Sign Up</CardTitle>
          <CardDescription className="text-center">
            Create your account to access exclusive flash deals and rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone" data-testid="label-phone">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode" data-testid="label-zip">
              ZIP Code
            </Label>
            <Input
              id="zipCode"
              type="text"
              placeholder="12345"
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              data-testid="input-zip"
            />
            <p className="text-xs text-muted-foreground">
              We'll show you offers within 10 miles
            </p>
          </div>

          <Button
            onClick={handleSignup}
            size="lg"
            className="w-full"
            disabled={signupMutation.isPending}
            data-testid="button-submit-signup"
          >
            {signupMutation.isPending ? "Creating Account..." : "Create Account"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
