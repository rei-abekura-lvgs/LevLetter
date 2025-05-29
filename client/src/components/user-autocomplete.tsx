import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, X, Building2, ChevronDown, ChevronRight, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserType {
  id: number;
  name: string;
  email?: string;
  displayName?: string;
  department?: string;
  searchKeywords: string;
}

interface OrganizationHierarchy {
  id: number;
  level: number;
  name: string;
  code?: string;
  parentId?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: OrganizationHierarchy[];
}

interface OrganizationTreeItemProps {
  org: OrganizationHierarchy & { children?: any[] };
  selectedDepartment: string;
  onSelect: (value: string) => void;
  level: number;
}

function OrganizationTreeItem({ org, selectedDepartment, onSelect, level }: OrganizationTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = org.children && org.children.length > 0;
  const isSelected = selectedDepartment === `org_${org.id}`;

  const getLevelIcon = (level: number) => {
    if (level === 0) return "🏢"; // 会社
    if (level === 1) return "🏬"; // 本部
    if (level === 2) return "🔧"; // 部
    if (level === 3) return "👥"; // グループ
    if (level === 4) return "🔹"; // チーム
    return "📍"; // ユニット
  };

  const getLevelColor = (level: number) => {
    if (level === 0) return "text-blue-600";
    if (level === 1) return "text-green-600";
    if (level === 2) return "text-purple-600";
    if (level === 3) return "text-orange-600";
    if (level === 4) return "text-pink-600";
    return "text-gray-600";
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors",
          "hover:bg-blue-50 active:bg-blue-100",
          isSelected ? "bg-blue-100 text-blue-900" : "text-gray-700"
        )}
        style={{ paddingLeft: `${12 + level * 20}px` }}
        onClick={() => onSelect(`org_${org.id}`)}
      >
        <Check
          className={cn(
            "mr-3 h-4 w-4 transition-opacity",
            isSelected ? "opacity-100 text-blue-600" : "opacity-0"
          )}
        />
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-2 p-1 rounded-md hover:bg-white/50 transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        <span className="mr-2 text-base">{getLevelIcon(level)}</span>
        <div className="flex-1 min-w-0">
          <span className={cn("font-medium truncate", getLevelColor(level))}>
            {org.name.replace("ANALYSIS", "NALYSIS")}
          </span>
          <span className="ml-2 text-xs text-gray-500">（配下全員）</span>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {org.children.map(child => (
            <OrganizationTreeItem
              key={child.id}
              org={child}
              selectedDepartment={selectedDepartment}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UserAutocompleteProps {
  users: UserType[];
  selectedUsers: UserType[];
  onUserSelect: (user: UserType) => void;
  onUserRemove: (userId: number) => void;
  maxSelections: number;
  placeholder: string;
  organizationHierarchy: OrganizationHierarchy[];
}

export function UserAutocomplete({
  users,
  selectedUsers,
  onUserSelect,
  onUserRemove,
  maxSelections,
  placeholder,
  organizationHierarchy
}: UserAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);

  // 組織階層ツリーを構築
  const hierarchyTree = useMemo(() => {
    if (!organizationHierarchy || !Array.isArray(organizationHierarchy)) {
      return [];
    }
    
    const buildTree = (orgs: OrganizationHierarchy[], parentId: number | null = null): any[] => {
      return orgs
        .filter(org => org.parentId === parentId)
        .map(org => ({
          ...org,
          children: buildTree(orgs, org.id)
        }));
    };
    
    return buildTree(organizationHierarchy);
  }, [organizationHierarchy]);

  // 検索可能なユーザーデータを準備
  const searchableUsers = useMemo(() => {
    return users.filter(user => !selectedUsers.some(selected => selected.id === user.id));
  }, [users, selectedUsers]);

  // 部署名一覧を取得
  const departments = useMemo(() => {
    const uniqueDepts = new Set<string>();
    users.forEach(user => {
      if (user.department) {
        uniqueDepts.add(user.department);
      }
    });
    return Array.from(uniqueDepts).sort();
  }, [users]);

  // フィルタリングされたユーザー
  const filteredUsers = useMemo(() => {
    let usersToFilter = searchableUsers;
    
    if (selectedDepartment !== "all") {
      if (selectedDepartment.startsWith("org_")) {
        const orgId = parseInt(selectedDepartment.replace("org_", ""));
        const org = organizationHierarchy.find(o => o.id === orgId);
        if (org) {
          usersToFilter = searchableUsers.filter(user => 
            user.department && user.department.includes(org.name)
          );
        }
      } else {
        usersToFilter = searchableUsers.filter(user => 
          user.department === selectedDepartment
        );
      }
    }

    // ランダムシャッフル関数
    const shuffleArray = (array: UserType[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    if (!inputValue.trim()) {
      return shuffleArray(usersToFilter).slice(0, 50);
    }
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    const filtered = usersToFilter
      .filter(user => 
        user.searchKeywords.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    
    return shuffleArray(filtered).slice(0, 50);
  }, [searchableUsers, inputValue, selectedDepartment, organizationHierarchy]);

  const handleUserSelect = (user: UserType) => {
    if (selectedUsers.length >= maxSelections) return;
    onUserSelect(user);
    setInputValue("");
  };

  const openModal = () => {
    setIsModalOpen(true);
    setInputValue("");
  };

  return (
    <div className="space-y-2">
      {/* 選択されたユーザー */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="px-2 py-1">
              {user.displayName || user.name}
              <button
                onClick={() => onUserRemove(user.id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
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
        <DialogContent className="sm:max-w-[600px] h-[85vh] p-0">
          <div className="flex flex-col h-full">
            <DialogHeader className="flex-shrink-0 p-6 pb-4">
              <DialogTitle className="text-lg font-semibold">名前で検索</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col gap-4 flex-1 min-h-0 px-6 pb-6">
              {/* 部署・組織選択 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Building2 className="h-4 w-4 text-gray-500" />
                <Popover open={isDepartmentOpen} onOpenChange={setIsDepartmentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isDepartmentOpen}
                      className="w-full justify-between h-10 px-3 text-sm"
                    >
                      {selectedDepartment === "all" 
                        ? "すべての部署・組織" 
                        : selectedDepartment.startsWith("org_")
                          ? (() => {
                              const orgId = parseInt(selectedDepartment.replace("org_", ""));
                              const org = organizationHierarchy.find(o => o.id === orgId);
                              return org ? `${org.name.replace("ANALYSIS", "NALYSIS")}（全体）` : "組織選択";
                            })()
                          : selectedDepartment.replace("ANALYSIS", "NALYSIS")
                      }
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[480px] p-0 shadow-lg border">
                    <div className="bg-white rounded-md max-h-[400px] overflow-y-auto">
                      <div className="p-3 space-y-1">
                        {/* 全体選択 */}
                        <div
                          className={cn(
                            "flex items-center px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors",
                            "hover:bg-blue-50",
                            selectedDepartment === "all" ? "bg-blue-100 text-blue-900" : "text-gray-700"
                          )}
                          onClick={() => {
                            setSelectedDepartment("all");
                            setIsDepartmentOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4",
                              selectedDepartment === "all" ? "opacity-100 text-blue-600" : "opacity-0"
                            )}
                          />
                          <span className="font-medium">すべての部署・組織</span>
                        </div>

                        {/* 階層組織 */}
                        {hierarchyTree.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-t mt-3 pt-3">
                              組織階層
                            </div>
                            {hierarchyTree.map(org => (
                              <OrganizationTreeItem 
                                key={org.id}
                                org={org}
                                selectedDepartment={selectedDepartment}
                                onSelect={(value: string) => {
                                  setSelectedDepartment(value);
                                  setIsDepartmentOpen(false);
                                }}
                                level={0}
                              />
                            ))}
                          </>
                        )}

                        {/* 従来の部署名 */}
                        {departments.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-t mt-3 pt-3">
                              その他の部署
                            </div>
                            {departments.map((dept) => (
                              <div
                                key={dept}
                                className={cn(
                                  "flex items-center px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors",
                                  "hover:bg-blue-50",
                                  selectedDepartment === dept ? "bg-blue-100 text-blue-900" : "text-gray-700"
                                )}
                                onClick={() => {
                                  setSelectedDepartment(dept);
                                  setIsDepartmentOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-3 h-4 w-4",
                                    selectedDepartment === dept ? "opacity-100 text-blue-600" : "opacity-0"
                                  )}
                                />
                                <span>{dept.replace("ANALYSIS", "NALYSIS")}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 検索入力 */}
              <div className="relative flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="名前（漢字・ひらがな・カタカナ・ローマ字）で検索..."
                  className="pl-10 h-10 text-sm border-gray-300"
                  autoFocus
                />
              </div>

              {/* 検索結果 */}
              <div className="flex-1 min-h-0 border rounded-lg bg-gray-50">
                <div className="h-full overflow-y-auto">
                  <div className="p-2">
                    {filteredUsers.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-gray-500">
                        <div className="text-center">
                          <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">該当するユーザーが見つかりません</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-gray-500 mb-2 px-1">
                          {filteredUsers.length}人表示（ランダム順）
                        </div>
                        <div className="space-y-1">
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => handleUserSelect(user)}
                              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg bg-white hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                            >
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-medium">
                                  {(user.displayName || user.name).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {user.displayName || user.name}
                                </div>
                                {user.department && (
                                  <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {user.department.replace("ANALYSIS", "NALYSIS")}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
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

export default UserAutocomplete;