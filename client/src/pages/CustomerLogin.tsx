import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, LogIn } from "lucide-react";

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simple login check - verify phone exists in localStorage
    const storedPhone = localStorage.getItem('customer-phone');
    
    if (storedPhone === phone) {
      toast({
        title: "Welcome Back!",
        description: "You're now logged in. Browse exclusive offers!",
      });
      setLocation('/merchant/test-full-access-001');
    } else {
      toast({
        title: "Account Not Found",
        description: "Please sign up first or check your phone number",
        variant: "destructive",
      });
      setIsLoading(false);
    }
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
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-display">Log In</CardTitle>
          <CardDescription className="text-center">
            Access your account to view offers and rewards
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

          <Button
            onClick={handleLogin}
            size="lg"
            className="w-full"
            disabled={isLoading}
            data-testid="button-submit-login"
          >
            {isLoading ? "Logging In..." : "Log In"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              onClick={() => setLocation('/customer-signup')}
              className="text-primary hover:underline"
              data-testid="link-signup"
            >
              Sign Up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
