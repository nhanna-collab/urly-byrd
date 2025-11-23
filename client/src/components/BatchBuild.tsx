import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Zap, GripHorizontal } from "lucide-react";

export interface PermutationCard {
  id: string;
  offerType: string;
  adType: string;
  label: string;
  selected: boolean;
}

interface BatchBuildProps {
  onAdvance: (selectedPermutations: PermutationCard[], formData: BatchBuildFormData) => void;
}

export interface BatchBuildFormData {
  offerTitle: string;
  product: string;
  description: string;
  originalPrice: string;
  maxClicks: number;
  clickBudget: string;
  zipCode: string;
}

const OFFER_TYPES = ["PCT", "DOL", "BOGO", "XY", "XYF"];
const AD_TYPES = ["Countdown", "CountdownQTY"];

// Generate all 15 permutations with naming convention: TYPE-REDEMPTION-DELIVERY-MM_D_YYYY
const generatePermutations = (): PermutationCard[] => {
  let id = 0;
  const permutations: PermutationCard[] = [];
  
  // Get today's date in MM_D_YYYY format
  const today = new Date();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString();
  const year = today.getFullYear();
  const dateStr = `${month}_${day}_${year}`;
  
  // Batch Build uses: REDEMPTION=MP (Must Pay), DELIVERY=1 (Coupon Codes)
  const redemptionCode = "MP";
  const deliveryCode = "1";
  
  OFFER_TYPES.forEach(offerType => {
    AD_TYPES.forEach(adType => {
      // Full naming convention for folder: TYPE-REDEMPTION-DELIVERY-MM_D_YYYY
      const folderName = `${offerType}-${redemptionCode}-${deliveryCode}-${dateStr}`;
      
      permutations.push({
        id: String(id++),
        offerType,
        adType,
        label: folderName,
        selected: false,
      });
    });
  });
  
  console.log("✅ Generated NEW 15 permutations with naming convention:", permutations.map(p => p.label));
  return permutations;
};

export default function BatchBuild({ onAdvance }: BatchBuildProps) {
  const [batchCreated, setBatchCreated] = useState(false);
  const [permutations, setPermutations] = useState<PermutationCard[]>([]);
  const [formData, setFormData] = useState<BatchBuildFormData>({
    offerTitle: "",
    product: "",
    description: "",
    originalPrice: "",
    maxClicks: 100,
    clickBudget: "",
    zipCode: "",
  });

  // Reset state when component mounts (when user comes back from Stage 1)
  useEffect(() => {
    console.log("🔄 BatchBuild component mounted - RESETTING all state");
    setBatchCreated(false);
    setPermutations([]);
    setFormData({
      offerTitle: "",
      product: "",
      description: "",
      originalPrice: "",
      maxClicks: 100,
      clickBudget: "",
      zipCode: "",
    });
  }, []);

  const selectedCount = permutations.filter(p => p.selected).length;

  const handleCreateBatch = () => {
    setBatchCreated(true);
    setPermutations(generatePermutations());
    // Smooth scroll to bucket after animation completes
    setTimeout(() => {
      const bucketElement = document.querySelector('[data-testid="bucket-card"]');
      bucketElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  };

  const togglePermutation = (id: string) => {
    setPermutations(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectAll = () => {
    setPermutations(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setPermutations(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const handleAdvance = () => {
    if (selectedCount === 0) {
      console.warn("No permutations selected");
      return;
    }

    const selected = permutations.filter(p => p.selected);
    console.log("Advancing to Stage 1 with selected permutations:", selected, "formData:", formData);
    onAdvance(selected, formData);
  };

  return (
    <div className="space-y-6">
      {/* Start Batch Build Button */}
      {!batchCreated && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleCreateBatch}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-create-batch"
            >
              Create Batch (10 Permutations)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Permutation Selection Grid */}
      {batchCreated && (
      <div className="space-y-6">
        {/* Permutation Grid - Full Width */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Select Permutations</CardTitle>
              <CardDescription>Click cards to add to selection below</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAll} data-testid="button-select-all">
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAll} data-testid="button-deselect-all">
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Full width 5 column grid with tall cards */}
            <div className="grid grid-cols-5 gap-3 w-full">
              {permutations.map(perm => (
                <PermutationButton
                  key={perm.id}
                  permutation={perm}
                  onToggle={togglePermutation}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selection Display Below */}
        <Card data-testid="bucket-card">
          <CardHeader>
            <CardTitle>Selected Tests ({selectedCount})</CardTitle>
            <CardDescription>{selectedCount} test{selectedCount !== 1 ? 's' : ''} chosen for Stage 1</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCount === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click permutation cards above to select tests
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {permutations.filter(p => p.selected).map(perm => (
                  <div
                    key={perm.id}
                    className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded flex justify-between items-center"
                  >
                    <span className="text-sm font-medium break-words">
                      {perm.label}
                    </span>
                    <button
                      onClick={() => togglePermutation(perm.id)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0 ml-2"
                      data-testid={`button-remove-${perm.id}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Action Button */}
      {batchCreated && (
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleAdvance}
          disabled={selectedCount === 0}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-advance-to-stage1"
        >
          Advance {selectedCount > 0 ? `${selectedCount} Test${selectedCount !== 1 ? 's' : ''}` : 'Tests'} to Stage 1
        </Button>
      </div>
      )}
    </div>
  );
}

interface PermutationButtonProps {
  permutation: PermutationCard;
  onToggle: (id: string) => void;
}

function PermutationButton({ permutation, onToggle }: PermutationButtonProps) {
  return (
    <button
      onClick={() => onToggle(permutation.id)}
      className={`relative p-6 rounded-md border-2 transition-all min-h-48 ${
        permutation.selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300"
      }`}
      data-testid={`button-permutation-${permutation.id}`}
    >
      <div className="flex flex-col items-center justify-center gap-3 h-full">
        <GripHorizontal className="h-6 w-6 text-muted-foreground opacity-50" />
        <div className="text-base font-semibold text-center break-words line-clamp-4">{permutation.label}</div>
      </div>
    </button>
  );
}
