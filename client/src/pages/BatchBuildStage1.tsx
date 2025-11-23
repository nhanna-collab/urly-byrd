import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PermutationCard, BatchBuildFormData } from "@/components/BatchBuild";

export default function BatchBuildStage1() {
  const [, setLocation] = useLocation();
  const [selection, setSelection] = useState<{
    permutations: PermutationCard[];
    formData: BatchBuildFormData;
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('batchBuildSelection');
    if (stored) {
      setSelection(JSON.parse(stored));
    }
  }, []);

  const handleAdvanceToStage2 = () => {
    setLocation('/batch-build-stage2');
  };

  if (!selection) {
    return (
      <>
        <AppHeader />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  const selectedPermutations = selection.permutations.filter(p => p.selected);

  return (
    <>
      <AppHeader />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stage 1: Financial Terms</h1>
          <p className="text-muted-foreground">Configure offer values for {selectedPermutations.length} test{selectedPermutations.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Campaign Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Offer Title</p>
                <p className="font-medium">{selection.formData.offerTitle}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Product/Service</p>
                <p className="font-medium">{selection.formData.product}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selected Permutations ({selectedPermutations.length})</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPermutations.map(p => (
                    <span key={p.id} className="px-2 py-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-xs">
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Fields - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms (Stage 1)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Coming soon: Dynamic financial fields based on selected offer types
              </p>
              <p className="text-xs text-muted-foreground">
                Fields will appear based on: {selectedPermutations.map(p => p.offerType).join(', ')}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation('/dashboard/create')}
            >
              Back
            </Button>
            <Button
              onClick={handleAdvanceToStage2}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue to Stage 2
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
