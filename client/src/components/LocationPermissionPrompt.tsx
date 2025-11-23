import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, X } from "lucide-react";

export function LocationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user already made a choice
    const locationChoice = localStorage.getItem('location-permission-choice');
    if (locationChoice) {
      setDismissed(true);
      return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setDismissed(true);
      return;
    }

    // Show prompt after a short delay (let them see the page first)
    setTimeout(() => {
      setShowPrompt(true);
    }, 1500);
  }, []);

  const handleAllow = async () => {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Store the permission choice and location
            localStorage.setItem('location-permission-choice', 'granted');
            localStorage.setItem('user-latitude', position.coords.latitude.toString());
            localStorage.setItem('user-longitude', position.coords.longitude.toString());
            resolve(position);
          },
          (error) => {
            // User denied or error occurred
            localStorage.setItem('location-permission-choice', 'denied');
            reject(error);
          }
        );
      });
      
      setShowPrompt(false);
      setDismissed(true);
      
      // Reload to apply location filter
      window.location.reload();
    } catch (error) {
      console.error('Location permission error:', error);
      setShowPrompt(false);
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('location-permission-choice', 'dismissed');
    setShowPrompt(false);
    setDismissed(true);
  };

  // Don't show if dismissed or not ready
  if (dismissed || !showPrompt) {
    return null;
  }

  return (
    <Card 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 p-4 border-2 border-primary shadow-lg bg-background"
      data-testid="card-location-permission"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover-elevate rounded-md"
        aria-label="Dismiss"
        data-testid="button-dismiss-location"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1" data-testid="title-location-permission">
            Find Nearby Deals
          </h3>
          <p className="text-xs text-muted-foreground mb-3" data-testid="description-location-permission">
            Share your location to automatically see exclusive offers within 10 miles of you.
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleAllow}
              size="sm"
              className="flex-1"
              data-testid="button-allow-location"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Allow Location
            </Button>
            <Button
              onClick={handleDismiss}
              size="sm"
              variant="outline"
              className="flex-1"
              data-testid="button-not-now"
            >
              Not Now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
