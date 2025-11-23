import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { infoSections, InfoCard } from "@/data/infoSections";

interface InfoSheetProps {
  cardId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoSheet({ cardId, open, onOpenChange }: InfoSheetProps) {
  // Find the card by ID across all sections
  const card = infoSections
    .flatMap(section => section.cards)
    .find(c => c.id === cardId);

  if (!card) {
    return null;
  }

  const Icon = card.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl overflow-y-auto"
        data-testid="info-sheet"
      >
        <SheetHeader>
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-primary" />}
            <SheetTitle data-testid="info-sheet-title">{card.title}</SheetTitle>
          </div>
          <SheetDescription data-testid="info-sheet-description">
            {card.description}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6" data-testid="info-sheet-content">
          {card.content}
        </div>
      </SheetContent>
    </Sheet>
  );
}
