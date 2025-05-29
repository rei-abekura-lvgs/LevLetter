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
          "flex items-center px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100",
          isSelected && "bg-blue-50"
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(`org_${org.id}`)}
      >
        <Check
          className={cn(
            "mr-2 h-4 w-4",
            isSelected ? "opacity-100" : "opacity-0"
          )}
        />
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-1 p-0.5 rounded hover:bg-gray-200"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
        <span className="mr-2">{getLevelIcon(level)}</span>
        <span className={cn("font-medium", getLevelColor(level))}>
          {org.name}
        </span>
        <span className="ml-2 text-xs text-gray-400">（全体）</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div>
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

    if (!inputValue.trim()) return usersToFilter.slice(0, 10); // 初期状態では10人まで表示
    
    const searchTerm = inputValue.toLowerCase().trim();
    
    return usersToFilter
      .filter(user => 
        user.searchKeywords.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10); // 最大10件まで表示
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
        <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>名前で検索</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 部署・組織選択 */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <Popover open={isDepartmentOpen} onOpenChange={setIsDepartmentOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isDepartmentOpen}
                    className="w-full justify-between"
                  >
                    {selectedDepartment === "all" 
                      ? "すべての部署・組織" 
                      : selectedDepartment.startsWith("org_")
                        ? (() => {
                            const orgId = parseInt(selectedDepartment.replace("org_", ""));
                            const org = organizationHierarchy.find(o => o.id === orgId);
                            return org ? `${org.name}（全体）` : "組織選択";
                          })()
                        : selectedDepartment
                    }
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <div className="max-h-[300px] overflow-auto p-2">
                      {/* 全体選択 */}
                      <div
                        className={cn(
                          "flex items-center px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100",
                          selectedDepartment === "all" && "bg-blue-50"
                        )}
                        onClick={() => {
                          setSelectedDepartment("all");
                          setIsDepartmentOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedDepartment === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        すべての部署・組織
                      </div>

                      {/* 階層組織 */}
                      {hierarchyTree.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-medium text-gray-500 border-t mt-2 pt-2">
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
                          <div className="px-2 py-1 text-xs font-medium text-gray-500 border-t mt-2 pt-2">
                            その他の部署
                          </div>
                          {departments.map((dept) => (
                            <div
                              key={dept}
                              className={cn(
                                "flex items-center px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100",
                                selectedDepartment === dept && "bg-blue-50"
                              )}
                              onClick={() => {
                                setSelectedDepartment(dept);
                                setIsDepartmentOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedDepartment === dept ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {dept}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
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