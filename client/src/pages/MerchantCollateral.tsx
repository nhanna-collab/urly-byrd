import AppHeader from "@/components/AppHeader";
import MerchantQRCode from "@/components/MerchantQRCode";
import { PrintableSigns } from "@/components/PrintableSigns";
import CustomerImport from "@/components/CustomerImport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MerchantCollateral() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="font-display font-bold text-xl mb-2">
              Company Collateral
            </h1>
            <p className="text-muted-foreground">
              Access your QR codes and marketing materials to promote your flash deals
            </p>
          </div>

          <Tabs defaultValue="customers" className="space-y-6">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="customers" data-testid="tab-customers" className="flex-1 min-w-[120px]">
                Customers
              </TabsTrigger>
              <TabsTrigger value="qr-code" data-testid="tab-qr-code" className="flex-1 min-w-[120px]">
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="signs" data-testid="tab-signs" className="flex-1 min-w-[120px]">
                <FileText className="w-4 h-4 mr-2" />
                Printable Signs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers">
              <CustomerImport />
            </TabsContent>

            <TabsContent value="qr-code">
              <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20">
                <CardHeader>
                  <CardTitle>Your Merchant QR Code</CardTitle>
                  <CardDescription>
                    Download and display this QR code in your store. Customers can scan it to see your active flash deals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MerchantQRCode 
                    merchantId={user.id} 
                    merchantName={user.businessName || user.email} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signs">
              <PrintableSigns />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
