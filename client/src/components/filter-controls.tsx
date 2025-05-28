import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Calendar, TrendingUp } from "lucide-react";

interface FilterControlsProps {
  sortOrder: "newest" | "popular";
  onSortChange: (order: "newest" | "popular") => void;
}

export function FilterControls({ sortOrder, onSortChange }: FilterControlsProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <ArrowUpDown className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">並び順:</span>
      </div>
      
      <Select value={sortOrder} onValueChange={(value: "newest" | "popular") => onSortChange(value)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>新しい順</span>
            </div>
          </SelectItem>
          <SelectItem value="popular">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>人気順</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}