import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";
import EmailVerification from "./EmailVerification";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const SAVED_EMAIL_KEY = "urlybyrd_saved_email";
  
  const [email, setEmail] = useState(() => {
    return localStorage.getItem(SAVED_EMAIL_KEY) || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (email) {
      localStorage.setItem(SAVED_EMAIL_KEY, email);
    }
  }, [email]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });

      if (!res.ok) {
        const error = await res.json();
        // Check if email is not verified
        if (error.emailVerified === false) {
          const err: any = new Error(error.message || "Email not verified");
          err.unverifiedEmail = true;
          throw err;
        }
        throw new Error(error.message || "Failed to login");
      }

      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem(SAVED_EMAIL_KEY, email);
      queryClient.setQueryData(["/api/auth/user"], data);
      toast({
        title: "Welcome Back!",
        description: "You've successfully logged in.",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      // If email is unverified, show verification screen
      if (error.unverifiedEmail) {
        setUnverifiedEmail(email);
        setShowVerification(true);
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to continue. Check your inbox for the code.",
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  // Show email verification screen if user is unverified
  if (showVerification && unverifiedEmail) {
    return <EmailVerification email={unverifiedEmail} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" data-testid="label-email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="input-email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" data-testid="label-password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            data-testid="input-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-password"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loginMutation.isPending}
        data-testid="button-login"
      >
        {loginMutation.isPending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
