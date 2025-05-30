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
  // 名前検索用のプロパティ
  users?: User[];
  selectedUsers?: User[];
  onUserSelect?: (user: User) => void;
  onUserRemove?: (userId: number) => void;
}

export function FilterControls({ 
  sortOrder, 
  onSortChange,
  searchQuery = "",
  onSearchChange,
  departmentFilter = "",
  onDepartmentChange,
  departments = [],
  organizationHierarchy = [],
  users = [],
  selectedUsers = [],
  onUserSelect,
  onUserRemove
}: FilterControlsProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5">
      <Select value={sortOrder} onValueChange={(value: "newest" | "popular") => onSortChange(value)}>
        <SelectTrigger className="w-[110px] h-7 text-xs whitespace-nowrap">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              新しい順
            </div>
          </SelectItem>
          <SelectItem value="popular">
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              人気順
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* 部署フィルター */}
      {organizationHierarchy.length > 0 && (
        <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={departmentOpen}
              className="h-7 px-2 text-xs whitespace-nowrap"
            >
              <Building2 className="h-3 w-3 mr-1" />
              {departmentFilter && departmentFilter !== "all"
                ? organizationHierarchy.find((org) => org.id === departmentFilter)?.name || departmentFilter
                : "部署"}
              <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
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
      )}

      {/* 名前検索と選択されたユーザー */}
      {users.length > 0 && onUserSelect && onUserRemove && (
        <div className="flex items-center gap-1">
          {/* 選択されたユーザー（横並び） */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-1">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                >
                  <span className="max-w-[60px] truncate">{user.displayName || user.name}</span>
                  <button
                    onClick={() => onUserRemove(user.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 検索ボタン */}
          <UserAutocomplete
            users={users}
            selectedUsers={selectedUsers}
            onUserSelect={onUserSelect}
            onUserRemove={onUserRemove}
            placeholder="検索"
            maxSelections={3}
            compact={true}
          />
        </div>
      )}
    </div>
  );
}