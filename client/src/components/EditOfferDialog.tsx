import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Offer } from "@shared/schema";

interface EditOfferDialogProps {
  offer: Offer;
  isOpen: boolean;
  onClose: () => void;
  onSave: (offerId: string, newEndDate: Date, notifyOnTargetMet: boolean, notifyOnPoorPerformance: boolean) => void;
  isPending?: boolean;
}

export default function EditOfferDialog({ 
  offer, 
  isOpen, 
  onClose, 
  onSave, 
  isPending = false 
}: EditOfferDialogProps) {
  const { toast } = useToast();
  const [newEndDate, setNewEndDate] = useState(() => {
    const date = new Date(offer.endDate);
    return date.toISOString().slice(0, 16);
  });
  const [notifyOnTargetMet, setNotifyOnTargetMet] = useState(offer.notifyOnTargetMet || false);
  const [notifyOnPoorPerformance, setNotifyOnPoorPerformance] = useState(offer.notifyOnPoorPerformance || false);

  // Reset the form whenever the offer changes
  useEffect(() => {
    const date = new Date(offer.endDate);
    setNewEndDate(date.toISOString().slice(0, 16));
    setNotifyOnTargetMet(offer.notifyOnTargetMet || false);
    setNotifyOnPoorPerformance(offer.notifyOnPoorPerformance || false);
  }, [offer.id, offer.endDate, offer.notifyOnTargetMet, offer.notifyOnPoorPerformance]);

  const handleSave = () => {
    const date = new Date(newEndDate);
    if (date <= new Date()) {
      toast({
        title: "Invalid Date",
        description: "End date must be in the future",
        variant: "destructive",
      });
      return;
    }
    onSave(offer.id, date, notifyOnTargetMet, notifyOnPoorPerformance);
  };

  const minDate = new Date();
  minDate.setHours(minDate.getHours() + 1);
  const minDateString = minDate.toISOString().slice(0, 16);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="dialog-edit-offer">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Extend Offer Time
          </DialogTitle>
          <DialogDescription>
            Update the end date for "{offer.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-end-date">Current End Date</Label>
            <Input
              id="current-end-date"
              type="text"
              value={new Date(offer.endDate).toLocaleString()}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-end-date">New End Date</Label>
            <Input
              id="new-end-date"
              type="datetime-local"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              min={minDateString}
              required
              data-testid="input-new-end-date"
            />
            <p className="text-xs text-muted-foreground">
              Select a new end date and time for this offer
            </p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Offer Updates</h4>
              <p className="text-xs text-muted-foreground">
                Select all that apply - we'll text you when:
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-target-met"
                checked={notifyOnTargetMet}
                onCheckedChange={(checked) => setNotifyOnTargetMet(checked as boolean)}
                data-testid="checkbox-notify-target-met"
              />
              <Label htmlFor="notify-target-met" className="font-normal cursor-pointer text-sm">
                Offer meets clicks early
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-poor-performance"
                checked={notifyOnPoorPerformance}
                onCheckedChange={(checked) => setNotifyOnPoorPerformance(checked as boolean)}
                data-testid="checkbox-notify-poor-performance"
              />
              <Label htmlFor="notify-poor-performance" className="font-normal cursor-pointer text-sm">
                Offer is not performing to time/number of clicks after the first half hour of offer launch
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            data-testid="button-save-edit"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
