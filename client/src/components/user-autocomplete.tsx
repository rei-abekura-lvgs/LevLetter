import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Search, User } from "lucide-react";
import { convertToSearchableFormats } from "@/hooks/useSearch";
import type { User as UserType } from "@shared/schema";

interface UserAutocompleteProps {
  users: UserType[];
  selectedUsers: UserType[];
  onUserSelect: (user: UserType) => void;
  onUserRemove: (userId: number) => void;
  placeholder?: string;
  maxSelections?: number;
}

export function UserAutocomplete({
  users,
  selectedUsers,
  onUserSelect,
  onUserRemove,
  placeholder = "名前を入力して検索...",
  maxSelections = 10
}: UserAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // 選択済みユーザーを除外したユーザーリスト
  const availableUsers = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map(u => u.id));
    return users.filter(user => !selectedIds.has(user.id));
  }, [users, selectedUsers]);

  // 検索可能な形式に変換されたユーザーデータ
  const searchableUsers = useMemo(() => {
    return availableUsers.map(user => {
      const displayName = user.displayName || user.name;
      const searchFormats = convertToSearchableFormats(displayName);
      
      return {
        ...user,
        displayName,
        searchKeywords: searchFormats.combined
      };
    });
  }, [availableUsers]);

  // 検索結果をフィルタリング
  const filteredUsers = useMemo(() => {
    if (!inputValue.trim()) return searchableUsers.slice(0, 10); // 初期状態では10人まで表示
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    return searchableUsers
      .filter(user => 
        user.searchKeywords.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10); // 最大10件まで表示
  }, [searchableUsers, inputValue]);

  const handleUserSelect = (user: UserType) => {
    if (selectedUsers.length >= maxSelections) return;
    
    onUserSelect(user);
    setInputValue("");
    setIsOpen(false);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(value.length > 0 || filteredUsers.length > 0);
  };

  return (
    <div className="space-y-3">
      {/* 選択済みユーザー表示エリア */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map(user => (
            <Badge 
              key={user.id} 
              variant="secondary" 
              className="flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {(user.displayName || user.name).charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>{user.displayName || user.name}</span>
              <button 
                type="button" 
                onClick={() => onUserRemove(user.id)}
                className="rounded-full hover:bg-gray-200 p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 検索入力エリア */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={selectedUsers.length >= maxSelections ? `最大${maxSelections}人まで選択可能` : placeholder}
          disabled={selectedUsers.length >= maxSelections}
          className="pl-10"
          onFocus={() => setIsOpen(filteredUsers.length > 0)}
        />
        
        {/* 検索結果ポップオーバー（フローティング表示） */}
        {filteredUsers.length > 0 && isOpen && (
          <div className="fixed top-20 left-4 right-4 z-[9999] bg-white border border-gray-200 rounded-md shadow-xl max-h-[300px] overflow-auto">
            <Command>
              <CommandList className="max-h-[200px] overflow-auto">
                {filteredUsers.length === 0 ? (
                  <CommandEmpty>該当するユーザーが見つかりません</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => handleUserSelect(user)}
                        className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {(user.displayName || user.name).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {user.displayName || user.name}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {/* 状態表示 */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {selectedUsers.length > 0 && `${selectedUsers.length}人選択中`}
        </span>
        <span>
          {selectedUsers.length >= maxSelections && `最大${maxSelections}人まで`}
        </span>
      </div>
    </div>
  );
}