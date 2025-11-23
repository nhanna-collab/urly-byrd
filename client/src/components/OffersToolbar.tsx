import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Folder, Search, ArrowUp, ArrowDown } from "lucide-react";

type SortKey = "date" | "maxClicks" | "ctr" | "duration" | "budget" | "viewed";
type SortDirection = "asc" | "desc";

interface OffersToolbarProps {
  folderCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onCreateFolder: () => void;
}

export default function OffersToolbar({
  folderCount,
  searchQuery,
  onSearchChange,
  sortKey,
  sortDirection,
  onSort,
  onCreateFolder,
}: OffersToolbarProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            {folderCount} {folderCount === 1 ? 'Folder' : 'Folders'}
          </span>
        </div>
        <Button 
          onClick={onCreateFolder}
          data-testid="button-create-folder"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Folder
        </Button>
      </div>

      <div className="mb-6 p-4 rounded-md border bg-card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Sort by:</p>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              data-testid="input-search-folders"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortKey === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => onSort("date")}
            data-testid="button-sort-date"
            className="gap-1 px-2"
          >
            Date
            {sortKey === "date" && (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </Button>
          <Button
            variant={sortKey === "ctr" ? "default" : "outline"}
            size="sm"
            onClick={() => onSort("ctr")}
            data-testid="button-sort-ctr"
            className="gap-1"
          >
            CTR
            {sortKey === "ctr" && (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </Button>
          <Button
            variant={sortKey === "duration" ? "default" : "outline"}
            size="sm"
            onClick={() => onSort("duration")}
            data-testid="button-sort-duration"
            className="gap-1"
          >
            Duration
            {sortKey === "duration" && (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </Button>
          <Button
            variant={sortKey === "budget" ? "default" : "outline"}
            size="sm"
            onClick={() => onSort("budget")}
            data-testid="button-sort-budget"
            className="gap-1"
          >
            Budget
            {sortKey === "budget" && (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </Button>
          <Button
            variant={sortKey === "viewed" ? "default" : "outline"}
            size="sm"
            onClick={() => onSort("viewed")}
            data-testid="button-sort-viewed"
            className="gap-1"
          >
            Viewed
            {sortKey === "viewed" && (sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </Button>
        </div>
      </div>
    </>
  );
}
