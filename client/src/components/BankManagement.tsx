import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Plus, TrendingUp, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { CustomerAcquisitionClick } from "@shared/schema";

export default function BankManagement() {
  const [addAmount, setAddAmount] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: clicks = [] } = useQuery<CustomerAcquisitionClick[]>({
    queryKey: ["/api/bank/transactions"],
    enabled: !!user,
  });

  const addFundsMutation = useMutation({
    mutationFn: async (amountInDollars: number) => {
      return await apiRequest("POST", "/api/bank/add-funds", {
        amountInDollars: amountInDollars,
      });
    },
    onSuccess: () => {
      toast({
        title: "Funds added successfully",
        description: "Your bank balance has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank/transactions"] });
      setAddAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add funds",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid dollar amount",
        variant: "destructive",
      });
      return;
    }
    if (amount > 1000) {
      toast({
        title: "Amount too large",
        description: "Maximum $1,000 per transaction",
        variant: "destructive",
      });
      return;
    }
    addFundsMutation.mutate(amount);
  };

  const currentBalance = parseFloat(user?.merchantBank as any || "0");
  const balanceInDollars = currentBalance.toFixed(2);

  const totalSpent = clicks
    .filter(c => c.wasCharged)
    .reduce((sum, c) => sum + parseFloat(c.costInDollars as any || "0"), 0);
  const totalSpentInDollars = totalSpent.toFixed(2);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Your bank is used to pay for customer acquisition. Each new customer costs $1.65.
          Add funds here to enable the "Get New Customers" feature when creating offers.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Current Balance
            </CardTitle>
            <CardDescription>Available funds for customer acquisition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${balanceInDollars}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {Math.floor(currentBalance / 1.65)} new customers available at $1.65 each
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Total Spent
            </CardTitle>
            <CardDescription>Lifetime customer acquisition spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">${totalSpentInDollars}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {clicks.filter(c => c.wasCharged).length} new customers tracked
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Funds
          </CardTitle>
          <CardDescription>
            Top up your bank to continue acquiring new customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFunds} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addAmount">Amount (USD)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="addAmount"
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="10.00"
                    className="pl-7"
                    data-testid="input-add-funds"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={addFundsMutation.isPending || !addAmount}
                  data-testid="button-add-funds"
                >
                  {addFundsMutation.isPending ? "Adding..." : "Add Funds"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Funds will be added to your bank immediately (max $1,000 per transaction)
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Track clicks from your customer acquisition campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clicks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Enable "Get New Customers" on your offers to start.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Offer ID</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clicks.slice(0, 10).map((click) => (
                  <TableRow key={click.id}>
                    <TableCell>
                      {new Date(click.createdAt!).toLocaleDateString()} {new Date(click.createdAt!).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {click.offerId.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      ${parseFloat(click.costInDollars as any || "0").toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {click.wasCharged ? (
                        <span className="text-green-600 dark:text-green-400">Charged</span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400">Insufficient Balance</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
