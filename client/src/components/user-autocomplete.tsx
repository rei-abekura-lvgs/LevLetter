import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Search, User, Building2 } from "lucide-react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

  // 選択済みユーザーを除外したユーザーリスト
  const availableUsers = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map(u => u.id));
    return users.filter(user => !selectedIds.has(user.id));
  }, [users, selectedUsers]);

  // 部署リストを取得
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    users.forEach(user => {
      if (user.department) {
        deptSet.add(user.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [users]);

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
    // 部署フィルタリング
    let usersToFilter = searchableUsers;
    if (selectedDepartment !== "all") {
      usersToFilter = searchableUsers.filter(user => 
        user.department === selectedDepartment
      );
    }

    if (!inputValue.trim()) return usersToFilter.slice(0, 10); // 初期状態では10人まで表示
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    return usersToFilter
      .filter(user => 
        user.searchKeywords.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10); // 最大10件まで表示
  }, [searchableUsers, inputValue, selectedDepartment]);

  const handleUserSelect = (user: UserType) => {
    if (selectedUsers.length >= maxSelections) return;
    
    onUserSelect(user);
    setInputValue("");
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setInputValue("");
    setSelectedDepartment("all");
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

      {/* 検索ボタン */}
      <Button 
        variant="outline" 
        onClick={openModal}
        disabled={selectedUsers.length >= maxSelections}
        className="w-full justify-start text-gray-500 font-normal"
      >
        <Search className="h-4 w-4 mr-2" />
        {selectedUsers.length >= maxSelections ? `最大${maxSelections}人まで選択可能` : placeholder}
      </Button>

      {/* 検索モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>名前で検索</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 部署選択 */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="すべての部署" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての部署</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 検索入力 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="名前（漢字・ひらがな・カタカナ・ローマ字）で検索..."
                className="pl-10"
                autoFocus
              />
            </div>

            {/* 検索結果 */}
            <div className="border rounded-md">
              <Command>
                <CommandList className="max-h-[300px] overflow-auto">
                  {filteredUsers.length === 0 ? (
                    <CommandEmpty className="py-6">該当するユーザーが見つかりません</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleUserSelect(user)}
                          className="flex items-center gap-3 cursor-pointer p-3 hover:bg-gray-50"
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
                            {user.department && (
                              <div className="text-xs text-gray-500">
                                {user.department}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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