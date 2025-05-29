import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { X, Search, User, Building2, ChevronRight, ChevronDown, Check } from "lucide-react";
import { convertToSearchableFormats } from "@/hooks/useSearch";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@shared/schema";

interface OrganizationTreeItemProps {
  org: OrganizationHierarchy & { children: any[] };
  selectedDepartment: string;
  onSelect: (value: string) => void;
  level: number;
}

function OrganizationTreeItem({ org, selectedDepartment, onSelect, level }: OrganizationTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = org.children.length > 0;
  const isSelected = selectedDepartment === `org_${org.id}`;
  
  const getLevelColor = (level: number) => {
    const colors = [
      "text-red-600", "text-orange-600", "text-yellow-600", 
      "text-green-600", "text-blue-600", "text-purple-600"
    ];
    return colors[level] || "text-gray-600";
  };

  const getLevelIcon = (level: number) => {
    if (level === 0) return "🏢"; // 会社
    if (level === 1) return "🏬"; // 本部
    if (level === 2) return "🏪"; // 部
    if (level === 3) return "👥"; // グループ
    if (level === 4) return "🔹"; // チーム
    return "📍"; // ユニット
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
  placeholder?: string;
  maxSelections?: number;
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
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);

  // 選択済みユーザーを除外したユーザーリスト
  const availableUsers = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map(u => u.id));
    return users.filter(user => !selectedIds.has(user.id));
  }, [users, selectedUsers]);

  // 組織階層データを取得
  const { data: organizationHierarchy = [] } = useQuery<OrganizationHierarchy[]>({
    queryKey: ["/api/admin/organizations"],
    retry: false,
  });

  // 階層構造を構築
  const buildHierarchy = (orgs: OrganizationHierarchy[]) => {
    const orgMap = new Map<number, OrganizationHierarchy & { children: (OrganizationHierarchy & { children: any[] })[] }>();
    
    // まず全ての組織をマップに追加
    orgs.forEach(org => {
      orgMap.set(org.id, { ...org, children: [] });
    });
    
    // 階層構造を構築
    const roots: (OrganizationHierarchy & { children: any[] })[] = [];
    orgs.forEach(org => {
      const orgWithChildren = orgMap.get(org.id)!;
      if (org.parentId && orgMap.has(org.parentId)) {
        orgMap.get(org.parentId)!.children.push(orgWithChildren);
      } else {
        roots.push(orgWithChildren);
      }
    });
    
    return roots;
  };

  const hierarchyTree = useMemo(() => buildHierarchy(organizationHierarchy), [organizationHierarchy]);

  // 部署リストを取得（従来の文字列部署名も含む）
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    users.forEach(user => {
      if (user.department) {
        deptSet.add(user.department);
      }
    });
    return Array.from(deptSet).sort();
  }, [users]);

  // 選択された組織配下の全ユーザーを取得
  const getUsersInOrganization = (orgId: number): UserType[] => {
    const findDescendantOrgs = (org: OrganizationHierarchy & { children: any[] }): number[] => {
      const ids = [org.id];
      org.children.forEach(child => {
        ids.push(...findDescendantOrgs(child));
      });
      return ids;
    };

    const findOrgInTree = (tree: any[], targetId: number): any => {
      for (const org of tree) {
        if (org.id === targetId) return org;
        const found = findOrgInTree(org.children, targetId);
        if (found) return found;
      }
      return null;
    };

    const targetOrg = findOrgInTree(hierarchyTree, orgId);
    if (!targetOrg) return [];

    const descendantIds = findDescendantOrgs(targetOrg);
    
    // 組織階層に属するユーザーを検索（部署名でマッチング）
    return users.filter(user => {
      if (!user.department) return false;
      
      // 完全一致または部分一致で組織名と部署名をマッチング
      return descendantIds.some(id => {
        const org = organizationHierarchy.find(o => o.id === id);
        return org && user.department && (
          user.department === org.name ||
          user.department.includes(org.name) ||
          org.name.includes(user.department)
        );
      });
    });
  };

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
      if (selectedDepartment.startsWith("org_")) {
        // 組織階層での選択
        const orgId = parseInt(selectedDepartment.replace("org_", ""));
        const orgUsers = getUsersInOrganization(orgId);
        const orgUserIds = new Set(orgUsers.map(u => u.id));
        usersToFilter = searchableUsers.filter(user => orgUserIds.has(user.id));
      } else {
        // 従来の部署名での選択
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
      // 初期状態ではランダムに並び替えて50人まで表示
      return shuffleArray(usersToFilter).slice(0, 50);
    }
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    const filtered = usersToFilter
      .filter(user => 
        user.searchKeywords.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    
    // 検索結果もランダムに並び替えて50件まで表示
    return shuffleArray(filtered).slice(0, 50);
  }, [searchableUsers, inputValue, selectedDepartment, hierarchyTree, organizationHierarchy, users]);

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
                <PopoverContent 
                  className="w-[480px] p-0 shadow-lg border max-h-[420px] overflow-hidden"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="bg-white rounded-md h-full flex flex-col">
                    <div 
                      className="overflow-y-auto overscroll-contain"
                      style={{ 
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent',
                        maxHeight: '400px'
                      }}
                      onWheel={(e) => {
                        // スクロールイベントが親に伝播するのを防ぐ
                        e.stopPropagation();
                      }}
                    >
                      <div className="p-3 space-y-1 min-h-0">
                        {/* 全体選択 */}
                        <div
                          className={cn(
                            "flex items-center px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors",
                            "hover:bg-blue-50 active:bg-blue-100",
                            selectedDepartment === "all" ? "bg-blue-100 text-blue-900" : "text-gray-700"
                          )}
                          onClick={() => {
                            setSelectedDepartment("all");
                            setIsDepartmentOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-3 h-4 w-4 transition-opacity",
                              selectedDepartment === "all" ? "opacity-100 text-blue-600" : "opacity-0"
                            )}
                          />
                          <span className="font-medium">すべての部署・組織</span>
                        </div>

                        {/* 階層組織 */}
                        {hierarchyTree.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t mt-3 pt-3">
                              組織階層
                            </div>
                            <div className="space-y-0.5">
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
                            </div>
                          </>
                        )}

                        {/* 従来の部署名 */}
                        {departments.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t mt-3 pt-3">
                              その他の部署
                            </div>
                            <div className="space-y-0.5">
                              {departments.map((dept) => (
                                <div
                                  key={dept}
                                  className={cn(
                                    "flex items-center px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors",
                                    "hover:bg-blue-50 active:bg-blue-100",
                                    selectedDepartment === dept ? "bg-blue-100 text-blue-900" : "text-gray-700"
                                  )}
                                  onClick={() => {
                                    setSelectedDepartment(dept);
                                    setIsDepartmentOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-3 h-4 w-4 transition-opacity",
                                      selectedDepartment === dept ? "opacity-100 text-blue-600" : "opacity-0"
                                    )}
                                  />
                                  <span>{dept.replace("ANALYSIS", "NALYSIS")}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
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
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="名前（漢字・ひらがな・カタカナ・ローマ字）で検索..."
                className="pl-10 h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* 検索結果 */}
            <div className="flex-1 min-h-0 border rounded-lg bg-gray-50">
              <div 
                className="h-full overflow-y-auto overscroll-contain"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 transparent'
                }}
              >
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
                            className="flex items-center gap-3 p-3 cursor-pointer rounded-lg bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border border-transparent hover:border-blue-200"
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