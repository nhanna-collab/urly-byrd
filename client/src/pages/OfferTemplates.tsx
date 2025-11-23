import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Package, Search, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import CreateFolderDialog from "@/components/CreateFolderDialog";
import type { CampaignFolder, Offer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function OfferTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates = [] } = useQuery<CampaignFolder[]>({
    queryKey: ["/api/campaign-folders"],
    enabled: !!user,
  });

  const { data: offers = [] } = useQuery<Offer[]>({
    queryKey: ["/api/my-offers"],
    enabled: !!user,
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await apiRequest("DELETE", `/api/campaign-folders/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    },
  });

  const templatesWithCounts = useMemo(() => {
    return templates.map(template => ({
      ...template,
      offerCount: offers.filter(o => o.campaignFolder === template.id).length,
    }));
  }, [templates, offers]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templatesWithCounts;
    const query = searchQuery.toLowerCase();
    return templatesWithCounts.filter(t => 
      t.name.toLowerCase().includes(query) || 
      (t.description?.toLowerCase().includes(query))
    );
  }, [templatesWithCounts, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <div className="flex-1 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-2xl mb-2">
                Offer Templates
              </h1>
              <p className="text-muted-foreground">
                Create templates to batch-generate multiple offer variations at once
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-template">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-templates"
              />
            </div>
          </div>

          {/* Templates List */}
          {filteredTemplates.length === 0 && !searchQuery ? (
            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardContent className="pt-6 text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Templates help you quickly create multiple offer variations for the same product
                </p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-template">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Template
                </Button>
              </CardContent>
            </Card>
          ) : filteredTemplates.length === 0 && searchQuery ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-muted-foreground">No templates match your search</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => {
                const templateOffers = offers.filter(o => o.campaignFolder === template.id);
                const primaryProduct = templateOffers.length > 0 ? templateOffers[0].menuItem : "No product set";

                return (
                  <Card key={template.id} data-testid={`template-card-${template.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-5 w-5 text-primary" />
                            <CardTitle>{template.name}</CardTitle>
                            <Badge variant="secondary">
                              {template.offerCount} {template.offerCount === 1 ? 'offer' : 'offers'}
                            </Badge>
                          </div>
                          {template.description && (
                            <CardDescription className="mt-2">
                              {template.description}
                            </CardDescription>
                          )}
                          <div className="mt-3 text-sm text-muted-foreground">
                            <span className="font-medium">Primary Product:</span> {primaryProduct}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          disabled={deleteTemplateMutation.isPending}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Use this template in the Create Offer form to generate multiple variations
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
