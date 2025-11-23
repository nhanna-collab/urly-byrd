import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, User } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function CustomerProfile() {
  const [, setLocation] = useLocation();
  const { customer, isLoading } = useCustomerAuth();
  const { toast } = useToast();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !customer) {
      setLocation('/customer-landing');
    }
  }, [customer, isLoading, setLocation]);

  useEffect(() => {
    if (customer) {
      setDateOfBirth(customer.dateOfBirth ? String(customer.dateOfBirth) : "");
      setSex(customer.sex || "");
    }
  }, [customer]);

  const handleSave = async () => {
    if (!dateOfBirth || !sex) {
      toast({
        title: "Missing Information",
        description: "Please provide both date of birth and sex",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/customers/me", {
        dateOfBirth,
        sex,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });

      toast({
        title: "Profile Updated!",
        description: "You're now earning double rewards (2x points) on every share!",
      });

      setLocation('/customer-rewards');
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/customer-rewards')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rewards
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center text-2xl font-display">
              Complete Your Profile
            </CardTitle>
            <CardDescription className="text-center">
              Unlock double rewards by providing optional demographic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4 text-center" data-testid="alert-double-rewards-info">
              <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">Get 2x Points on Every Share!</p>
              <p className="text-xs text-muted-foreground">
                Complete your profile to earn double rewards
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  data-testid="input-date-of-birth"
                />
                <p className="text-xs text-muted-foreground">
                  Used only for targeted offers relevant to your age group
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger id="sex" data-testid="select-sex">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used only for targeted offers relevant to you
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={saving || !dateOfBirth || !sex}
                className="w-full"
                data-testid="button-save-profile"
              >
                {saving ? "Saving..." : "Activate Double Rewards"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                This information is optional and only used to personalize your experience
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
