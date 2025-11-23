import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  onSearch?: (query: string) => void;
  onSortChange?: (sort: string) => void;
  onCategoryChange?: (category: string) => void;
}

export default function FilterBar({
  onSearch,
  onSortChange,
  onCategoryChange,
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>

        <div className="flex gap-2">
          <Select onValueChange={onCategoryChange} defaultValue="all">
            <SelectTrigger className="w-[180px]" data-testid="select-category">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="food">Food & Dining</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="home">Home & Garden</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={onSortChange} defaultValue="ending-soon">
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="discount">Highest Discount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
