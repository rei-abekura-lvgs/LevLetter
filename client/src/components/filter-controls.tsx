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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowUpDown, Calendar, TrendingUp, Search, ChevronDown, ChevronUp, Building2, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortOrder } from "@/types/common";
import { UserAutocomplete } from "./user-autocomplete";
import type { User } from "@shared/schema";

interface FilterControlsProps {
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  departmentFilter?: string;
  onDepartmentChange?: (department: string) => void;
  departments?: Array<{ id: string; name: string; }>;
  organizationHierarchy?: Array<{ id: string; name: string; fullPath: string; level: number; }>;
}

export function FilterControls({ 
  sortOrder, 
  onSortChange,
  searchQuery = "",
  onSearchChange,
  departmentFilter = "",
  onDepartmentChange,
  departments = [],
  organizationHierarchy = []
}: FilterControlsProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);

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
                
                {/* 組織階層検索可能フィルタ（実際の5階層部署管理システムから） */}
                {organizationHierarchy.length > 0 && (
                  <div className="w-[180px]">
                    <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={departmentOpen}
                          className="w-full h-8 justify-between text-sm"
                        >
                          <Building2 className="h-3 w-3 mr-2" />
                          {departmentFilter && departmentFilter !== "all"
                            ? organizationHierarchy.find((org) => org.id === departmentFilter)?.name || departmentFilter
                            : "部署で絞り込み"}
                          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="部署を検索..." className="h-9" />
                          <CommandEmpty>該当する部署が見つかりません</CommandEmpty>
                          <CommandList className="max-h-[200px] overflow-auto">
                            <CommandGroup>
                              <CommandItem
                                value="all"
                                onSelect={() => {
                                  onDepartmentChange?.("all");
                                  setDepartmentOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    departmentFilter === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                全部署
                              </CommandItem>
                              {organizationHierarchy.map((org) => (
                                <CommandItem
                                  key={org.id}
                                  value={org.fullPath}
                                  onSelect={() => {
                                    onDepartmentChange?.(org.id);
                                    setDepartmentOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      departmentFilter === org.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{org.name}</span>
                                    <span className="text-xs text-muted-foreground">{org.fullPath}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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