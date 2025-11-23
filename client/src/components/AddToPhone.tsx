import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect iOS Safari
const isIOS = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

export function AddToPhone() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setDismissed(true);
      return;
    }

    // Check if user already dismissed
    const wasDismissed = localStorage.getItem('pwa-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if iOS
    const iosDevice = isIOS();
    setIsIOSDevice(iosDevice);

    if (iosDevice) {
      // For iOS, show prompt after delay (no beforeinstallprompt event)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    } else {
      // For Android/Chrome, listen for the beforeinstallprompt event
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        
        // Show prompt after a short delay to let user see the offers first
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
      };

      window.addEventListener('beforeinstallprompt', handler);

      return () => {
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  // Don't show if already dismissed or (not iOS and no prompt available)
  if (dismissed || !showPrompt || (!isIOSDevice && !deferredPrompt)) {
    return null;
  }

  return (
    <Card 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 p-4 border-2 border-primary shadow-lg bg-background"
      data-testid="card-add-to-phone"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-dismiss-pwa"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1" data-testid="title-add-to-phone">
            Fast Access to Your Rewards
          </h3>
          <p className="text-xs text-muted-foreground mb-3" data-testid="description-add-to-phone">
            Add the beautiful Urly Byrd link to your home screen for instant access to your rewards and exclusive flash deals!
          </p>
          
          {isIOSDevice ? (
            <div className="space-y-2">
              <p className="text-xs font-medium">To add to your home screen:</p>
              <ol className="text-xs text-muted-foreground space-y-1 pl-4 list-decimal">
                <li>Tap the <Share className="inline h-3 w-3 mx-1" /> Share button below</li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full"
              data-testid="button-install-pwa"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Add to Home Screen
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
