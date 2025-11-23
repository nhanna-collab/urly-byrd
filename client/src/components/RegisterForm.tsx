import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { businessCategories } from "@shared/businessCategories";
import type { MembershipTier } from "@shared/schema";
import { Eye, EyeOff } from "lucide-react";
import EmailVerification from "./EmailVerification";

interface RegisterFormProps {
  onSuccess?: () => void;
  selectedTier?: MembershipTier;
}

export function RegisterForm({ onSuccess, selectedTier = "NEST" }: RegisterFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [businessUrl, setBusinessUrl] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessStreet, setBusinessStreet] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const { toast } = useToast();

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await apiRequest("POST", "/api/auth/register", {
        businessName,
        businessUrl,
        businessCategory,
        businessStreet,
        businessCity,
        businessState,
        businessPhone,
        contactPhone,
        title,
        firstName,
        lastName,
        email,
        zipCode,
        password,
        membershipTier: selectedTier,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      return data;
    },
    onSuccess: (data) => {
      // Registration successful - now need to verify email
      if (data.requiresVerification) {
        setRegisteredEmail(data.email || email);
        setShowVerification(true);
        toast({
          title: "Check your email!",
          description: `We sent a verification code to ${data.email || email}`,
        });
      } else {
        // Fallback: if verification is not required (shouldn't happen)
        queryClient.setQueryData(["/api/auth/user"], data);
        toast({
          title: "Welcome to Urly Byrd!",
          description: "Your merchant account has been created successfully.",
        });
        onSuccess?.();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to create account",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate();
  };

  // Show email verification screen after successful registration
  if (showVerification && registeredEmail) {
    return <EmailVerification email={registeredEmail} onSuccess={onSuccess} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName" data-testid="label-business-name">Business Name</Label>
        <Input
          id="businessName"
          type="text"
          placeholder="Acme Corporation"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
          data-testid="input-business-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessUrl" data-testid="label-business-url">Business Website</Label>
        <Input
          id="businessUrl"
          type="url"
          placeholder="https://acmecorp.com"
          value={businessUrl}
          onChange={(e) => setBusinessUrl(e.target.value)}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
              setBusinessUrl(`https://${value}`);
            }
          }}
          required
          data-testid="input-business-url"
        />
        <p className="text-xs text-muted-foreground">
          Your official business website URL
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zipCode" data-testid="label-zip-code">Business ZIP Code</Label>
        <Input
          id="zipCode"
          type="text"
          placeholder="62701"
          value={zipCode}
          onChange={async (e) => {
            const value = e.target.value;
            setZipCode(value);
            
            // Auto-fill city and state when 5 digits are entered
            if (value.length === 5 && /^\d{5}$/.test(value)) {
              try {
                const res = await fetch(`/api/zip-to-location?zip=${value}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.city && data.state) {
                    setBusinessCity(data.city);
                    setBusinessState(data.state);
                  }
                }
              } catch (error) {
                console.error('Failed to lookup ZIP code:', error);
              }
            }
          }}
          required
          maxLength={10}
          data-testid="input-zip-code"
        />
        <p className="text-xs text-muted-foreground">
          We'll auto-fill your city and state
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessCity" data-testid="label-business-city">City</Label>
          <Input
            id="businessCity"
            type="text"
            placeholder="Auto-filled from ZIP"
            value={businessCity}
            onChange={(e) => setBusinessCity(e.target.value)}
            required
            data-testid="input-business-city"
            className="bg-muted/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessState" data-testid="label-business-state">State</Label>
          <Input
            id="businessState"
            type="text"
            placeholder="Auto-filled"
            value={businessState}
            onChange={(e) => setBusinessState(e.target.value.toUpperCase())}
            required
            maxLength={2}
            data-testid="input-business-state"
            className="bg-muted/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessStreet" data-testid="label-business-street">Street Address</Label>
        <Input
          id="businessStreet"
          type="text"
          placeholder="123 Main Street"
          value={businessStreet}
          onChange={(e) => setBusinessStreet(e.target.value)}
          required
          data-testid="input-business-street"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="businessCategory" data-testid="label-business-category">Business Type</Label>
        <Select value={businessCategory} onValueChange={setBusinessCategory} required>
          <SelectTrigger data-testid="select-business-category">
            <SelectValue placeholder="Select your business type" />
          </SelectTrigger>
          <SelectContent>
            {businessCategories.map((category) => (
              <SelectItem key={category} value={category} data-testid={`select-category-${category.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}`}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" data-testid="label-first-name">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            data-testid="input-first-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" data-testid="label-last-name">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            data-testid="input-last-name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" data-testid="label-title">Job Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="Owner, Manager, Marketing Director, etc."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          data-testid="input-title"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="businessPhone" data-testid="label-business-phone">Business Phone</Label>
          <Input
            id="businessPhone"
            type="tel"
            placeholder="(217) 555-0100"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            required
            data-testid="input-business-phone"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone" data-testid="label-contact-phone">Your Phone</Label>
          <Input
            id="contactPhone"
            type="tel"
            placeholder="(217) 555-0200"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
            data-testid="input-contact-phone"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" data-testid="label-email">Business Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@yourbusiness.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="input-email"
        />
        <p className="text-xs text-muted-foreground">
          Any email that links to your business URL (domain must match)
        </p>
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
        <p className="text-xs text-muted-foreground">
          Must be 8+ characters with uppercase, lowercase, and number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" data-testid="label-confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            data-testid="input-confirm-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-confirm-password"
          >
            {showConfirmPassword ? (
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
        disabled={registerMutation.isPending}
        data-testid="button-register"
      >
        {registerMutation.isPending ? "Creating Account..." : "Create Merchant Account"}
      </Button>
    </form>
  );
}
