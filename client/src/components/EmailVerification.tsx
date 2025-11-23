import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw } from "lucide-react";

interface EmailVerificationProps {
  email: string;
  onSuccess?: () => void;
}

export default function EmailVerification({ email, onSuccess }: EmailVerificationProps) {
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const verifyMutation = useMutation({
    mutationFn: async (verificationCode: string) => {
      const res = await apiRequest("POST", "/api/auth/verify-email", {
        email,
        code: verificationCode,
      });
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Email verified!",
        description: "Your account has been activated.",
      });
      // Invalidate auth query
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      // Call onSuccess callback if provided (for dialog mode), otherwise navigate
      if (onSuccess) {
        onSuccess();
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/resend-verification", {
        email,
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Code sent!",
        description: "Check your email for a new verification code.",
      });
      setCode(""); // Clear the input
    },
    onError: (error: any) => {
      toast({
        title: "Failed to resend code",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(code);
  };

  const handleResend = () => {
    resendMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" data-testid="label-verification-code">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(value);
                }}
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest"
                data-testid="input-verification-code"
              />
              <p className="text-xs text-muted-foreground text-center">
                Code expires in 15 minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyMutation.isPending || code.length !== 6}
              data-testid="button-verify"
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={resendMutation.isPending}
              data-testid="button-resend"
            >
              {resendMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              For testing: Check your server console for the verification code
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
