import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, Users, Mail, MapPin, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MerchantCustomer } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportStats {
  total: number;
  withEmail: number;
  withZip: number;
  lastImportDate: Date | null;
}

export default function CustomerImport() {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);

  // Fetch customers
  const { data: customersData, isLoading: loadingCustomers } = useQuery<{ customers: MerchantCustomer[] }>({
    queryKey: ['/api/merchant-customers'],
  });

  // Fetch stats
  const { data: stats } = useQuery<ImportStats>({
    queryKey: ['/api/merchant-customers/stats'],
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const res = await apiRequest('POST', '/api/merchant-customers/import', { csvData });
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Successful!",
        description: data.message || `Imported ${data.imported} customers`,
      });
      setCsvData("");
      queryClient.invalidateQueries({ queryKey: ['/api/merchant-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant-customers/stats'] });
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some rows had errors",
          description: `${data.errors.length} rows could not be imported. Check console for details.`,
          variant: "destructive",
        });
        console.error("Import errors:", data.errors);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import customers",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await apiRequest('DELETE', `/api/merchant-customers/${customerId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer Deleted",
        description: "Customer removed from your list",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant-customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/merchant-customers/stats'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste your CSV data",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(csvData);
  };

  const handleDownloadTemplate = () => {
    const template = "phone,firstname,lastname,email,zip,notes\n5551234567,John,Doe,john@example.com,12345,VIP customer\n5559876543,Jane,Smith,jane@example.com,12346,Regular customer";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const customers = customersData?.customers || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20" data-testid="card-total-customers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Customers</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-customers">
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20" data-testid="card-with-email">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">With Email</h3>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-with-email">
              {stats?.withEmail || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20" data-testid="card-with-zip">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">With ZIP</h3>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-with-zip">
              {stats?.withZip || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Section */}
      <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20" data-testid="card-import">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Customers
          </CardTitle>
          <CardDescription>
            If you have existing customers, import them here to build targeted campaigns. Paste your customer data in CSV format. Required: phone number. Optional: firstname, lastname, email, zip, notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadTemplate}
              data-testid="button-download-template"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowTemplate(!showTemplate)}
              data-testid="button-show-template"
            >
              {showTemplate ? "Hide" : "Show"} Example
            </Button>
          </div>

          {showTemplate && (
            <Alert data-testid="alert-template-example">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs whitespace-pre">
                {`phone,firstname,lastname,email,zip,notes\n5551234567,John,Doe,john@example.com,12345,VIP customer\n5559876543,Jane,Smith,jane@example.com,12346,Regular customer`}
              </AlertDescription>
            </Alert>
          )}

          <Textarea
            placeholder="Paste your CSV data here..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            data-testid="textarea-csv-input"
          />

          <Button 
            onClick={handleImport}
            disabled={importMutation.isPending || !csvData.trim()}
            data-testid="button-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            {importMutation.isPending ? "Importing..." : "Import Customers"}
          </Button>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card className="bg-fuchsia-100 dark:bg-fuchsia-900/20" data-testid="card-customer-list">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Manage your imported customer database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCustomers ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-customers">
              No customers imported yet. Use the form above to import your customer list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>ZIP</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Imported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer, index) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customer.firstName || customer.lastName 
                          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                          : '-'}
                      </TableCell>
                      <TableCell>{customer.phoneNumber}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.zipCode || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{customer.notes || '-'}</TableCell>
                      <TableCell>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(customer.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${customer.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
