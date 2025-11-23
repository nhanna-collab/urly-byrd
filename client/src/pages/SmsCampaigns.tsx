import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Send, Users, AlertCircle, CheckCircle2, Loader2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MerchantCustomer } from "@shared/schema";

interface ConfigStatus {
  configured: boolean;
  message: string;
}

export default function SmsCampaigns() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Please Sign In",
        description: "You need to sign in to access SMS campaigns",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, authLoading, toast, setLocation]);

  const { data: configStatus, isLoading: configLoading } = useQuery<ConfigStatus>({
    queryKey: ["/api/sms/config-status"],
    enabled: !!user,
  });

  const { data: customers, isLoading: customersLoading } = useQuery<MerchantCustomer[]>({
    queryKey: ["/api/merchant-customers"],
    enabled: !!user,
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (data: { message: string; customerIds: string[] }) => {
      return await apiRequest("POST", "/api/sms/send-campaign", data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "SMS Campaign Sent",
        description: `Successfully sent to ${data.sent} customers${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
      });
      setMessage("");
      setSelectedCustomerIds([]);
      setSelectAll(false);
      queryClient.invalidateQueries({ queryKey: ["/api/merchant-customers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Campaign",
        description: error.message || "An error occurred while sending the SMS campaign",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && customers) {
      setSelectedCustomerIds(customers.map(c => c.id));
    } else {
      setSelectedCustomerIds([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(prev => [...prev, customerId]);
    } else {
      setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
      setSelectAll(false);
    }
  };

  const handleSendCampaign = () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (selectedCustomerIds.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one customer",
        variant: "destructive",
      });
      return;
    }

    sendCampaignMutation.mutate({
      message: message.trim(),
      customerIds: selectedCustomerIds,
    });
  };

  const maxMessageLength = 160;
  const remainingChars = maxMessageLength - message.length;
  const isOverLimit = message.length > maxMessageLength;

  if (authLoading || configLoading || customersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-sms-campaigns" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="heading-sms-campaigns">SMS Campaigns</h1>
        </div>

        {!configStatus?.configured && (
          <Alert className="mb-6" data-testid="alert-twilio-not-configured">
            <Settings className="h-4 w-4" />
            <AlertTitle>Twilio Not Configured</AlertTitle>
            <AlertDescription>
              {configStatus?.message || "SMS service is not configured. Please set up your Twilio credentials in the Secrets tab to enable SMS messaging."}
            </AlertDescription>
          </Alert>
        )}

        {configStatus?.configured && (
          <Alert className="mb-6" data-testid="alert-twilio-configured">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>SMS Service Ready</AlertTitle>
            <AlertDescription>
              Twilio is configured and ready to send messages.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card data-testid="card-compose-message">
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
              <CardDescription>
                Create an SMS message to send to your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message-text" data-testid="label-message">
                  Message Text
                </Label>
                <Textarea
                  id="message-text"
                  data-testid="textarea-message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Your business name will be prepended automatically
                  </span>
                  <span 
                    className={isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}
                    data-testid="text-char-count"
                  >
                    {remainingChars} characters remaining
                  </span>
                </div>
                {isOverLimit && (
                  <p className="text-sm text-destructive" data-testid="text-over-limit">
                    Message exceeds recommended SMS length. Messages over 160 characters may be split into multiple texts.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label data-testid="label-recipients">Recipients</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground" data-testid="text-selected-count">
                    {selectedCustomerIds.length} customer{selectedCustomerIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSendCampaign}
                disabled={!configStatus?.configured || selectedCustomerIds.length === 0 || !message.trim() || sendCampaignMutation.isPending}
                className="w-full"
                data-testid="button-send-campaign"
              >
                {sendCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send SMS Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card data-testid="card-customer-list">
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                Select customers to receive your SMS message
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!customers || customers.length === 0 ? (
                <div className="text-center py-8" data-testid="text-no-customers">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No customers imported yet
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/dashboard")}
                    data-testid="button-import-customers"
                  >
                    Import Customers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-4 border-b">
                    <Checkbox
                      id="select-all"
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Select All ({customers.length} customers)
                    </label>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>ZIP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.map((customer) => (
                          <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCustomerIds.includes(customer.id)}
                                onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                                data-testid={`checkbox-customer-${customer.id}`}
                              />
                            </TableCell>
                            <TableCell data-testid={`text-name-${customer.id}`}>
                              {customer.firstName || customer.lastName
                                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                                : '—'}
                            </TableCell>
                            <TableCell data-testid={`text-phone-${customer.id}`}>
                              {customer.phoneNumber}
                            </TableCell>
                            <TableCell data-testid={`text-zip-${customer.id}`}>
                              {customer.zipCode || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
