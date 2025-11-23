import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, CampaignFolder } from "@shared/schema";

interface MakeCampaignDialogProps {
  open: boolean;
  onClose: () => void;
  folder: CampaignFolder;
}

export default function MakeCampaignDialog({ open, onClose, folder }: MakeCampaignDialogProps) {
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const { toast } = useToast();

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: open,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: { campaignId?: string; campaignName?: string; folderId: string }) => {
      return apiRequest("POST", "/api/campaigns/add-folder", data);
    },
    onSuccess: () => {
      toast({
        title: "Folder promoted",
        description: `Folder "${folder.name}" has been promoted to campaign status and removed from Drafts.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-offers"] });
      onClose();
      setNewCampaignName("");
      setSelectedCampaignId("");
      setMode("new");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (mode === "existing" && !selectedCampaignId) {
      toast({
        title: "Error",
        description: "Please select a campaign",
        variant: "destructive",
      });
      return;
    }

    if (mode === "new" && !newCampaignName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      campaignId: mode === "existing" ? selectedCampaignId : undefined,
      campaignName: mode === "new" ? newCampaignName.trim() : undefined,
      folderId: folder.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-make-campaign">
        <DialogHeader>
          <DialogTitle>Promote to Campaign</DialogTitle>
          <DialogDescription>
            Promote folder "{folder.name}" to a campaign. This will remove it from Drafts and make it live with performance tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Campaign Type</Label>
            <Select value={mode} onValueChange={(val) => setMode(val as "existing" | "new")}>
              <SelectTrigger data-testid="select-campaign-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Create New Campaign</SelectItem>
                <SelectItem value="existing">Add to Existing Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "existing" && (
            <div className="space-y-2">
              <Label htmlFor="campaign-select">Select Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger id="campaign-select" data-testid="select-existing-campaign">
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                  {campaigns.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No campaigns yet
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === "new" && (
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Enter campaign name..."
                data-testid="input-campaign-name"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-campaign">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createCampaignMutation.isPending}
            data-testid="button-submit-campaign"
          >
            {createCampaignMutation.isPending ? "Promoting..." : "Promote to Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
