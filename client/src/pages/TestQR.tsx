import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone } from "lucide-react";

export default function TestQR() {
  const testUrl = `${window.location.origin}/customer-landing`;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">Test QR Code</CardTitle>
          <CardDescription>
            Scan this QR code with your phone to test the customer signup flow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-8 rounded-lg border-2 border-primary/20">
              <QRCodeSVG
                value={testUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="w-full space-y-3">
              <div className="p-4 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground mb-1">Test URL:</p>
                <p className="text-sm font-mono break-all">
                  {testUrl}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold text-primary">What to expect:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>1. <span className="font-medium">Landing Page</span> - Simple page with two options</p>
              <p className="ml-4">→ "Sign Up" - Create account with phone + ZIP</p>
              <p className="ml-4">→ "Log In" - Access existing account</p>
              
              <p className="mt-3">2. <span className="font-medium">After Signup/Login</span> - See offers and rewards</p>
              <p className="ml-4">→ Location Prompt (1.5 sec) - Find nearby deals</p>
              <p className="ml-4">→ PWA Install Prompt (3 sec) - Add to home screen</p>
              <p className="ml-4">→ Browse offers and claim deals</p>
            </div>
          </div>

          <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Note:</span> Each prompt only appears once per device. 
              Clear your browser's localStorage to reset and see them again.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
