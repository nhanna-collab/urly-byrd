import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateFolderDialog({ open, onClose }: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      await apiRequest("POST", "/api/campaign-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-folders"] });
      toast({
        title: "Success",
        description: "Campaign folder created successfully. It's now available as a filter option.",
      });
      setFolderName("");
      setDescription("");
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create folder",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }
    createFolderMutation.mutate({
      name: folderName,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent data-testid="dialog-create-folder" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Campaign Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your offers. Once created, this folder will appear as a filter option on your Offers page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name *</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g., Holiday Promotions, Weekend Specials"
              data-testid="input-folder-name"
              required
            />
            <p className="text-xs text-muted-foreground">
              This name will appear in your filter dropdown
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder-description">Campaign Description</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the campaign goals, target products, or marketing strategy..."
              data-testid="input-folder-description"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Add details about this campaign for future reference
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createFolderMutation.isPending}
              data-testid="button-cancel-folder"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createFolderMutation.isPending}
              data-testid="button-submit-folder"
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
