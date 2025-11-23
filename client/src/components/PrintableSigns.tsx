import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Eye } from "lucide-react";
import type { User } from "@shared/schema";

type PrintSize = "5x7" | "8.5x11";

export function PrintableSigns() {
  const { toast } = useToast();
  const [storeName, setStoreName] = useState("");
  const [customText1, setCustomText1] = useState("");
  const [customText2, setCustomText2] = useState("");
  const [printSize, setPrintSize] = useState<PrintSize>("5x7");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Auto-fill store name from user's business name when user data loads
  useEffect(() => {
    if (user?.businessName && !storeName) {
      setStoreName(user.businessName);
    }
  }, [user, storeName]);

  // Load user's logo if they have one when user data loads
  useEffect(() => {
    if (user?.logoUrl && !logoPreview) {
      setLogoPreview(user.logoUrl);
    }
  }, [user, logoPreview]);

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/upload/logo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload logo");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setLogoPreview(data.logoUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logo Uploaded",
        description: "Your logo has been saved and will appear on all your signs.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image file (PNG, JPG, etc.).",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const dimensions = printSize === "5x7" ? { width: 5, height: 7 } : { width: 8.5, height: 11 };
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Sign - ${storeName}</title>
          <style>
            @page {
              size: ${dimensions.width}in ${dimensions.height}in;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              width: ${dimensions.width}in;
              height: ${dimensions.height}in;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    if (!printRef.current) return;

    toast({
      title: "Print Ready",
      description: "Your sign is ready to print. Use the Print button to save as PDF.",
    });

    handlePrint();
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  // Calculate dimensions for preview and print
  const isLandscape = printSize === "8.5x11";
  const previewScale = isLandscape ? 0.35 : 0.5;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-signs-title">Printable Signs</h2>
        <p className="text-muted-foreground" data-testid="text-signs-description">
          Create custom signs to promote your flash deals in-store
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20">
          <CardHeader>
            <CardTitle>Sign Details</CardTitle>
            <CardDescription>Customize your printable sign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName" data-testid="label-store-name">Store Name</Label>
              <Input
                id="storeName"
                placeholder="Your Store Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                data-testid="input-store-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customText1" data-testid="label-custom-text-1">Custom Text Line 1</Label>
              <Textarea
                id="customText1"
                placeholder="Add your own message (e.g., 'Follow us on Instagram @yourstore')"
                value={customText1}
                onChange={(e) => setCustomText1(e.target.value)}
                rows={2}
                data-testid="input-custom-text-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customText2" data-testid="label-custom-text-2">Custom Text Line 2</Label>
              <Textarea
                id="customText2"
                placeholder="Add another message (e.g., 'Scan to see today's deals')"
                value={customText2}
                onChange={(e) => setCustomText2(e.target.value)}
                rows={2}
                data-testid="input-custom-text-2"
              />
            </div>

            <div className="space-y-2">
              <Label data-testid="label-print-size">Print Size</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={printSize === "5x7" ? "default" : "outline"}
                  onClick={() => setPrintSize("5x7")}
                  className="flex-1"
                  data-testid="button-size-5x7"
                >
                  5" × 7" Table Sign
                </Button>
                <Button
                  type="button"
                  variant={printSize === "8.5x11" ? "default" : "outline"}
                  onClick={() => setPrintSize("8.5x11")}
                  className="flex-1"
                  data-testid="button-size-8.5x11"
                >
                  8.5" × 11" Main Sign
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                For signs, consider printing on transparencies for insertion into plastic stand
              </p>
            </div>

            <div className="space-y-2">
              <Label data-testid="label-logo">Store Logo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                  data-testid="button-choose-logo"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Logo
                </Button>
                {logoFile && (
                  <Button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={uploadLogoMutation.isPending}
                    data-testid="button-upload-logo"
                  >
                    {uploadLogoMutation.isPending ? "Uploading..." : "Save Logo"}
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-logo-file"
              />
              {logoPreview && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  Logo selected
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                onClick={handlePrint}
                disabled={!storeName}
                className="flex-1"
                data-testid="button-print-sign"
              >
                <Download className="w-4 h-4 mr-2" />
                Print Sign
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your sign will look when printed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center bg-muted/30 p-4 rounded-lg min-h-[400px]">
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  ref={printRef}
                  style={{
                    width: printSize === "5x7" ? "5in" : "8.5in",
                    height: printSize === "5x7" ? "7in" : "11in",
                    backgroundColor: "white",
                    border: "2px solid #e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: printSize === "5x7" ? "0.5in" : "0.75in",
                    gap: printSize === "5x7" ? "0.3in" : "0.5in",
                  }}
                  data-testid="preview-sign"
                >
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Store Logo"
                      style={{
                        maxWidth: printSize === "5x7" ? "2in" : "3in",
                        maxHeight: printSize === "5x7" ? "1.5in" : "2in",
                        objectFit: "contain",
                      }}
                    />
                  )}
                  
                  <div
                    style={{
                      fontSize: printSize === "5x7" ? "32px" : "48px",
                      fontWeight: "800",
                      textAlign: "center",
                      lineHeight: "1.2",
                      color: "#000",
                    }}
                  >
                    {storeName || "YOUR STORE NAME"}
                  </div>

                  <div
                    style={{
                      fontSize: printSize === "5x7" ? "20px" : "28px",
                      fontWeight: "700",
                      textAlign: "center",
                      lineHeight: "1.3",
                      color: "#1f2937",
                    }}
                  >
                    GET TEXTS ON OUR<br />FLASH DEALS
                  </div>

                  {customText1 && (
                    <div
                      style={{
                        fontSize: printSize === "5x7" ? "14px" : "18px",
                        textAlign: "center",
                        lineHeight: "1.4",
                        color: "#4b5563",
                      }}
                    >
                      {customText1}
                    </div>
                  )}

                  {customText2 && (
                    <div
                      style={{
                        fontSize: printSize === "5x7" ? "14px" : "18px",
                        textAlign: "center",
                        lineHeight: "1.4",
                        color: "#4b5563",
                      }}
                    >
                      {customText2}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
