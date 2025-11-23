import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

const OBJECTIVES = [
  "Declining Sales",
  "Drive More Sales",
  "Growth Planning",
  "Impulse Purchases",
  "Introduce Product",
  "New Customers",
  "Reduce Inventory",
  "Rising Competition",
  "Scale Purchasing",
  "Slow Periods",
  "Slow Season",
  "Weather Barriers",
];

interface CampaignObjectivePriorityProps {
  value?: string[];
  onChange: (priorities: string[]) => void;
}

export default function CampaignObjectivePriority({ value = [], onChange }: CampaignObjectivePriorityProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<"available" | "priority" | null>(null);

  const priorities = value.slice(0, 9);
  const availableObjectives = OBJECTIVES.filter(obj => !priorities.includes(obj));

  const handleDragStart = (objective: string, from: "available" | "priority") => {
    setDraggedItem(objective);
    setDraggedFrom(from);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnPriority = (targetIndex: number) => {
    if (!draggedItem) return;

    const newPriorities = [...priorities];

    if (draggedFrom === "available") {
      // Adding new item to priority slot
      if (newPriorities.length < 9) {
        newPriorities.splice(targetIndex, 0, draggedItem);
      } else {
        // Replace the target slot
        newPriorities[targetIndex] = draggedItem;
      }
    } else if (draggedFrom === "priority") {
      // Reordering within priorities
      const currentIndex = newPriorities.indexOf(draggedItem);
      newPriorities.splice(currentIndex, 1);
      newPriorities.splice(targetIndex, 0, draggedItem);
    }

    onChange(newPriorities.slice(0, 9));
    setDraggedItem(null);
    setDraggedFrom(null);
  };

  const handleRemovePriority = (index: number) => {
    const newPriorities = priorities.filter((_, i) => i !== index);
    onChange(newPriorities);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedFrom(null);
  };

  return (
    <div className="space-y-3">
      <Label>Campaign Objectives <span className="text-sm text-muted-foreground font-normal">(Optional - Recommended)</span></Label>
      <p className="text-xs text-muted-foreground -mt-2">Drag objectives and order them by priority</p>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Column 1: Most Important */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Most Important</div>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="relative"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnPriority(index);
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  #{index + 1}
                </div>
                {priorities[index] ? (
                  <div
                    draggable
                    onDragStart={() => handleDragStart(priorities[index], "priority")}
                    onDragEnd={handleDragEnd}
                    className="flex-1 flex items-center justify-between bg-card border rounded-md px-3 py-2 cursor-move hover-elevate active-elevate-2"
                    data-testid={`priority-${index + 1}`}
                  >
                    <span className="font-medium">{priorities[index]}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePriority(index)}
                      className="text-muted-foreground hover:text-foreground"
                      data-testid={`remove-priority-${index + 1}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-muted-foreground/30 rounded-md px-3 py-2 text-sm text-muted-foreground bg-muted/20">
                    Drag an objective here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Column 2: Next Three */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Next Three</div>
          {[3, 4, 5].map((index) => (
            <div
              key={index}
              className="relative"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnPriority(index);
              }}
            >
              {priorities[index] ? (
                <div
                  draggable
                  onDragStart={() => handleDragStart(priorities[index], "priority")}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between bg-card border rounded-md px-3 py-2 cursor-move hover-elevate active-elevate-2"
                  data-testid={`priority-${index + 1}`}
                >
                  <span className="font-medium">{priorities[index]}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePriority(index)}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid={`remove-priority-${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-md px-3 py-2 text-sm text-muted-foreground bg-muted/20">
                  Drag an objective here
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Column 3: Last Three */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Last Three</div>
          {[6, 7, 8].map((index) => (
            <div
              key={index}
              className="relative"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnPriority(index);
              }}
            >
              {priorities[index] ? (
                <div
                  draggable
                  onDragStart={() => handleDragStart(priorities[index], "priority")}
                  onDragEnd={handleDragEnd}
                  className="flex items-center justify-between bg-card border rounded-md px-3 py-2 cursor-move hover-elevate active-elevate-2"
                  data-testid={`priority-${index + 1}`}
                >
                  <span className="font-medium">{priorities[index]}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePriority(index)}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid={`remove-priority-${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/30 rounded-md px-3 py-2 text-sm text-muted-foreground bg-muted/20">
                  Drag an objective here
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available Objectives - 2 rows of 6 */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Available Objectives</div>
        <div className="grid grid-cols-6 gap-2">
          {availableObjectives.map((objective) => (
            <div
              key={objective}
              draggable
              onDragStart={() => handleDragStart(objective, "available")}
              onDragEnd={handleDragEnd}
              className="bg-card border rounded-md px-3 py-2 cursor-move hover-elevate active-elevate-2 text-sm text-center"
              data-testid={`available-objective-${objective}`}
            >
              {objective}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
