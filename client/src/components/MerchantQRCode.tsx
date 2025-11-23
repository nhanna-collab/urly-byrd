import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface MerchantQRCodeProps {
  merchantId: string;
  merchantName: string;
}

export default function MerchantQRCode({ merchantId, merchantName }: MerchantQRCodeProps) {
  const { toast } = useToast();
  const merchantUrl = `${window.location.origin}/merchant/${merchantId}`;
  const [businessName, setBusinessName] = useState("");
  const [customText, setCustomText] = useState("");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Auto-fill business name when user data loads
  useEffect(() => {
    if (user?.businessName && !businessName) {
      setBusinessName(user.businessName);
    }
  }, [user, businessName]);

  const handleDownloadSign = () => {
    const svg = document.getElementById("merchant-qr-code");
    if (!svg) {
      console.error("QR code SVG element not found");
      toast({
        title: "Error",
        description: "QR code not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas context");
      toast({
        title: "Error",
        description: "Could not create canvas. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Starting printable QR sign generation...");

    // 4" x 6" at 300 DPI for print quality
    const width = 1200;
    const height = 1800;
    canvas.width = width;
    canvas.height = height;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    let currentY = 80;

    // Function to draw the rest of the sign
    const drawSignContent = () => {
      // Draw business name if provided
      if (businessName) {
        ctx.fillStyle = '#1e3a4a';
        const businessNameUpper = businessName.toUpperCase();
        let fontSize = 48;
        ctx.font = `bold ${fontSize}px Arial`;
        
        // Measure text and shrink if too long
        let textWidth = ctx.measureText(businessNameUpper).width;
        const maxWidth = width - 120;
        
        while (textWidth > maxWidth && fontSize > 24) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Arial`;
          textWidth = ctx.measureText(businessNameUpper).width;
        }
        
        ctx.textAlign = 'center';
        ctx.fillText(businessNameUpper, width / 2, currentY);
        currentY += fontSize + 30;
      }

      // Draw "GET TEXTS ON FLASH DEALS" headline
      ctx.fillStyle = '#e57233';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GET TEXTS ON', width / 2, currentY);
      currentY += 55;
      ctx.fillText('FLASH DEALS', width / 2, currentY);
      currentY += 80;

      // Draw custom text if provided
      if (customText) {
        ctx.fillStyle = '#1e3a4a';
        ctx.font = '28px Arial';
        
        // Word wrap for custom text
        const words = customText.split(' ');
        let line = '';
        const maxLineWidth = width - 120;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxLineWidth && i > 0) {
            ctx.fillText(line, width / 2, currentY);
            line = words[i] + ' ';
            currentY += 40;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, width / 2, currentY);
        currentY += 60;
      }

      // Convert QR code SVG to image and draw it
      const svgData = new XMLSerializer().serializeToString(svg);
      const qrImg = new Image();
      
      qrImg.onload = () => {
        console.log("QR code image loaded successfully");
        const qrSize = 550;
        const qrX = (width - qrSize) / 2;
        const qrY = currentY;
        
        // White background for QR code
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
        
        // Draw QR code
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Draw instruction text below QR
        currentY = qrY + qrSize + 50;
        ctx.fillStyle = '#6b7280';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DISPLAY IN STORE WHERE', width / 2, currentY);
        ctx.fillText('CUSTOMERS CAN SCAN WHILE WAITING', width / 2, currentY + 35);

        // Download the final image
        console.log("Generating PNG...");
        const pngFile = canvas.toDataURL("image/png");
        console.log("PNG generated, initiating download...");
        
        const downloadLink = document.createElement("a");
        const sanitizedName = (businessName || merchantName)
          .replace(/[<>:"/\\|?*]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .replace(/^-|-$/g, '');
        const filename = `${sanitizedName || 'Merchant'}-QR-Sign.png`;
        downloadLink.download = filename;
        downloadLink.href = pngFile;
        downloadLink.click();
        
        console.log("Download triggered:", filename);

        toast({
          title: "QR Sign Downloaded!",
          description: "Your printable QR code sign is ready. Print on 4×6 paper.",
        });
      };

      qrImg.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to generate QR code. Please try again.",
          variant: "destructive",
        });
      };

      qrImg.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    // If user has a logo, load and draw it first
    if (user?.logoUrl) {
      const merchantLogo = new Image();
      merchantLogo.onload = () => {
        console.log("Merchant logo loaded successfully");
        // Draw logo centered at top
        const logoWidth = 300;
        const logoHeight = (merchantLogo.height / merchantLogo.width) * logoWidth;
        const logoX = (width - logoWidth) / 2;
        const logoY = currentY;
        ctx.drawImage(merchantLogo, logoX, logoY, logoWidth, logoHeight);
        
        currentY = logoY + logoHeight + 50;
        drawSignContent();
      };

      merchantLogo.onerror = () => {
        console.error("Failed to load merchant logo, continuing without it");
        drawSignContent();
      };

      merchantLogo.src = user.logoUrl;
    } else {
      // No logo, just draw the content
      drawSignContent();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(merchantUrl);
    toast({
      title: "Link Copied",
      description: "Your merchant link has been copied to clipboard.",
    });
  };

  return (
    <Card data-testid="card-qr-code">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Your Merchant QR Code
        </CardTitle>
        <CardDescription>
          Customize and download your QR code sign for in-store display
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customization Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qr-business-name" data-testid="label-qr-business-name">Business Name</Label>
            <Input
              id="qr-business-name"
              placeholder="Your Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              data-testid="input-qr-business-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-custom-text" data-testid="label-qr-custom-text">Custom Text (Optional)</Label>
            <Textarea
              id="qr-custom-text"
              placeholder="Add your own message (e.g., 'Follow us @yourstore' or 'Scan for exclusive deals')"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={2}
              data-testid="input-qr-custom-text"
            />
          </div>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-6 rounded-lg">
            <QRCodeSVG
              id="merchant-qr-code"
              value={merchantUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="w-full space-y-3">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Your Merchant Link:</p>
              <p className="text-sm font-mono break-all" data-testid="text-merchant-url">
                {merchantUrl}
              </p>
            </div>

            <Button
              onClick={handleDownloadSign}
              variant="default"
              size="lg"
              className="w-full"
              data-testid="button-download-sign"
            >
              <Printer className="mr-2 h-5 w-5" />
              Download Printable QR Sign (4×6)
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="button-copy-link"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Your QR sign will include:</p>
          <p>✓ Your logo (if uploaded in Signs tab)</p>
          <p>✓ Your business name</p>
          <p>✓ "GET TEXTS ON FLASH DEALS" headline</p>
          <p>✓ Your custom message (optional)</p>
          <p>✓ QR code for customers to scan</p>
          <p>✓ Display instructions</p>
          <p className="pt-2">Perfect for counters, checkout areas, or waiting rooms!</p>
        </div>
      </CardContent>
    </Card>
  );
}
