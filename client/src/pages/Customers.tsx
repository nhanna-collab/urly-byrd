import CustomerImport from "@/components/CustomerImport";

export default function Customers() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-customers">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Import and manage your customer list for targeted campaigns
          </p>
        </div>
        
        <CustomerImport />
      </div>
    </div>
  );
}
