import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, MapPin, Keyboard, Smartphone, Share } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CustomerSignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "location-method" | "phone" | "verify" | "success";
type LocationMethod = "browser" | "manual" | null;

export function CustomerSignupModal({ open, onOpenChange, onSuccess }: CustomerSignupModalProps) {
  const [step, setStep] = useState<Step>("location-method");
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>();
  const { toast } = useToast();

  // Detect if user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Check if PWA is already installed (running in standalone mode)
  const isPWAInstalled = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const getCleanPhoneNumber = () => {
    return phoneNumber.replace(/\D/g, "");
  };

  const handleRequestCode = async () => {
    const cleanPhone = getCleanPhoneNumber();
    
    if (cleanPhone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    if (zipCode.length < 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid ZIP code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(
        "POST",
        "/api/customers/request-code",
        { phoneNumber: cleanPhone, zipCode }
      );

      const data = await res.json();
      setCustomerId(data.customerId);
      setDevCode(data.devCode);
      setStep("verify");
      
      toast({
        title: "Code Sent!",
        description: `We sent a 6-digit code to ${phoneNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest(
        "POST",
        "/api/customers/verify",
        { 
          phoneNumber: getCleanPhoneNumber(),
          code: verificationCode,
        }
      );

      setStep("success");
      
      toast({
        title: "Verified!",
        description: "Your phone number has been verified",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services. Please enter your ZIP code manually.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await apiRequest("POST", "/api/location/find-zip", { latitude, longitude });
          
          const data = await response.json();
          
          if (data.zipCode) {
            setZipCode(data.zipCode);
            setLocationMethod("browser");
            setStep("phone");
            toast({
              title: "Location Detected!",
              description: `Found ZIP code: ${data.zipCode}. You can edit it if needed.`,
            });
          } else {
            setLocationMethod("browser");
            setStep("phone");
            toast({
              title: "Location Detected",
              description: "Please confirm your ZIP code below",
            });
          }
        } catch (error) {
          console.error("Error finding ZIP code:", error);
          setLocationMethod("browser");
          setStep("phone");
          toast({
            title: "Location Detected",
            description: "Please enter your ZIP code below",
          });
        }
        
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        let message = "Unable to detect your location";
        
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enter your ZIP code manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location unavailable. Please enter your ZIP code manually.";
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
        
        setLocationMethod("manual");
        setStep("phone");
      }
    );
  };

  const handleManualEntry = () => {
    setLocationMethod("manual");
    setStep("phone");
  };

  const handleClose = () => {
    setStep("location-method");
    setLocationMethod(null);
    setPhoneNumber("");
    setZipCode("");
    setVerificationCode("");
    setCustomerId("");
    setDevCode(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-customer-signup">
        {step === "location-method" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Get Flash Sale Alerts
              </DialogTitle>
              <DialogDescription>
                See local deals within 10 miles. Choose how to set your location:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button 
                onClick={handleUseLocation} 
                disabled={loading}
                className="w-full h-auto py-4 flex-col gap-2"
                data-testid="button-use-location"
              >
                <MapPin className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-semibold">Use My Location</span>
                  <span className="text-xs opacity-90">Help detect my ZIP code</span>
                </div>
              </Button>
              
              <Button 
                onClick={handleManualEntry}
                variant="outline"
                className="w-full h-auto py-4 flex-col gap-2"
                data-testid="button-manual-entry"
              >
                <Keyboard className="h-5 w-5" />
                <div className="flex flex-col">
                  <span className="font-semibold">Enter ZIP Code</span>
                  <span className="text-xs opacity-90">I'll type it in manually</span>
                </div>
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-4">
                We use your location only to show you nearby deals. No tracking.
              </p>
            </div>
          </>
        )}

        {step === "phone" && (
          <>
            <DialogHeader>
              <DialogTitle>Claim Your Deal</DialogTitle>
              <DialogDescription>
                Enter your info to get local deals within 10 miles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  data-testid="input-phone-number"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={14}
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  data-testid="input-zip-code"
                  placeholder="90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  maxLength={5}
                  autoComplete="postal-code"
                />
              </div>
              
              {!isPWAInstalled && (
                <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-xs text-center" data-testid="alert-install-app">
                  💡 <strong>Tip:</strong> Add Urly Byrd to your home screen for instant access
                  {isIOS && " (Tap Share → Add to Home Screen)"}
                  {isAndroid && " (Tap Menu → Add to Home Screen)"}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setStep("location-method")}
                  className="flex-1"
                  data-testid="button-back-to-method"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleRequestCode} 
                  disabled={loading || getCleanPhoneNumber().length !== 10 || zipCode.length < 5}
                  className="flex-1"
                  data-testid="button-request-code"
                >
                  {loading ? "Sending..." : "Send Code"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Enter Verification Code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to {phoneNumber}
                {devCode && (
                  <span className="block mt-2 text-primary font-mono font-bold">
                    DEV CODE: {devCode}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  data-testid="input-verification-code"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setStep("phone")}
                  className="flex-1"
                  data-testid="button-back"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                  data-testid="button-verify-code"
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                You're All Set!
              </DialogTitle>
              <DialogDescription>
                You'll now receive text alerts when merchants you follow post new flash offers
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Button 
                onClick={handleClose}
                className="w-full"
                data-testid="button-done"
              >
                Start Following Merchants
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
