import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowUpDown, Calendar, TrendingUp, Search, ChevronDown, ChevronUp } from "lucide-react";
import { SortOrder } from "@/types/common";

interface FilterControlsProps {
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  departmentFilter?: string;
  onDepartmentChange?: (department: string) => void;
  departments?: Array<{ id: string; name: string; }>;
}

export function FilterControls({ 
  sortOrder, 
  onSortChange,
  searchQuery = "",
  onSearchChange,
  departmentFilter = "",
  onDepartmentChange,
  departments = []
}: FilterControlsProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="mb-4">
      {/* メインコントロール行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select value={sortOrder} onValueChange={(value: "newest" | "popular") => onSortChange(value)}>
            <SelectTrigger className="w-[120px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-2" />
                  新しい順
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  人気順
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 検索ボタン */}
          <Collapsible open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8">
                <Search className="h-3 w-3 mr-1" />
                詳細検索
                {isSearchOpen ? (
                  <ChevronUp className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="名前・メッセージで検索..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                
                {departments.length > 0 && (
                  <div className="w-[140px]">
                    <Select value={departmentFilter} onValueChange={onDepartmentChange}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="部署選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部署</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}