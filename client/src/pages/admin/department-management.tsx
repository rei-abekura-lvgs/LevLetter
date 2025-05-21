import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Department } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function DepartmentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState<{
    code: string;
    name: string;
    level1: string;
    level2: string;
    level3: string;
    level4: string;
    level5: string;
    fullPath: string;
    parentId: number | null;
    description: string;
  }>({
    code: "",
    name: "",
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    level5: "",
    fullPath: "",
    parentId: null,
    description: ""
  });

  // 部署一覧を取得
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["/api/departments"],
  });

  // フィルタリングされた部署
  const filteredDepartments = departments.filter((dept: Department) => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(lowerQuery) ||
      (dept.description && dept.description.toLowerCase().includes(lowerQuery))
    );
  });

  // 部署作成ミューテーション
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      level1: string | null;
      level2: string | null;
      level3: string | null;
      level4: string | null;
      level5: string | null;
      fullPath: string | null;
      parentId: number | null;
      description: string | null;
    }) => {
      return apiRequest('/api/departments', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsAddDialogOpen(false);
      setNewDepartment({
        code: "",
        name: "",
        level1: "",
        level2: "",
        level3: "",
        level4: "",
        level5: "",
        fullPath: "",
        parentId: null,
        description: ""
      });
      toast({
        title: "部署作成完了",
        description: "新しい部署を作成しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "部署の作成に失敗しました",
        variant: "destructive",
      });
    }
  });

  // 部署更新ミューテーション
  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { 
      id: number; 
      data: { 
        code: string; 
        name: string; 
        level1: string | null; 
        level2: string | null; 
        level3: string | null; 
        level4: string | null; 
        level5: string | null; 
        fullPath: string | null; 
        parentId: number | null; 
        description: string | null; 
      } 
    }) => {
      return apiRequest(`/api/departments/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      toast({
        title: "部署更新完了",
        description: "部署情報を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "部署の更新に失敗しました",
        variant: "destructive",
      });
    }
  });

  // 部署削除ミューテーション
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/departments/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
      toast({
        title: "部署削除完了",
        description: "部署を削除しました",
      });
    },
    onError: (error: any) => {
      console.error('部署削除エラー:', error);
      toast({
        title: "エラー",
        description: error.message || "部署の削除に失敗しました",
        variant: "destructive",
      });
    }
  });

  // 部署追加ハンドラー
  const handleAddDepartment = () => {
    if (!newDepartment.code.trim()) {
      toast({
        title: "エラー",
        description: "部署コードを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (!newDepartment.name.trim()) {
      toast({
        title: "エラー",
        description: "部署正式名称を入力してください",
        variant: "destructive",
      });
      return;
    }

    // 階層構造を生成
    const fullPath = [
      newDepartment.level1, 
      newDepartment.level2, 
      newDepartment.level3, 
      newDepartment.level4, 
      newDepartment.level5
    ].filter(Boolean).join('/');

    createDepartmentMutation.mutate({
      code: newDepartment.code.trim(),
      name: newDepartment.name.trim(),
      level1: newDepartment.level1 ? newDepartment.level1.trim() : null,
      level2: newDepartment.level2 ? newDepartment.level2.trim() : null,
      level3: newDepartment.level3 ? newDepartment.level3.trim() : null,
      level4: newDepartment.level4 ? newDepartment.level4.trim() : null,
      level5: newDepartment.level5 ? newDepartment.level5.trim() : null,
      fullPath: fullPath || null,
      parentId: newDepartment.parentId,
      description: newDepartment.description.trim() || null,
    });
  };

  // 部署編集ハンドラー
  const handleEditDepartment = () => {
    if (!selectedDepartment) return;
    
    if (!selectedDepartment.code.trim()) {
      toast({
        title: "エラー",
        description: "部署コードを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDepartment.name.trim()) {
      toast({
        title: "エラー",
        description: "部署正式名称を入力してください",
        variant: "destructive",
      });
      return;
    }

    // フルパスを生成
    const fullPath = [
      selectedDepartment.level1, 
      selectedDepartment.level2, 
      selectedDepartment.level3, 
      selectedDepartment.level4, 
      selectedDepartment.level5
    ].filter(Boolean).join('/');

    updateDepartmentMutation.mutate({
      id: selectedDepartment.id,
      data: {
        code: selectedDepartment.code.trim(),
        name: selectedDepartment.name.trim(),
        level1: selectedDepartment.level1 ? selectedDepartment.level1.trim() : null,
        level2: selectedDepartment.level2 ? selectedDepartment.level2.trim() : null,
        level3: selectedDepartment.level3 ? selectedDepartment.level3.trim() : null,
        level4: selectedDepartment.level4 ? selectedDepartment.level4.trim() : null,
        level5: selectedDepartment.level5 ? selectedDepartment.level5.trim() : null,
        fullPath: fullPath || null,
        parentId: selectedDepartment.parentId,
        description: selectedDepartment.description?.trim() || null,
      }
    });
  };

  // 部署削除ハンドラー
  const handleDeleteDepartment = () => {
    if (!selectedDepartment) return;
    
    console.log("部署削除処理開始:", selectedDepartment);
    deleteDepartmentMutation.mutate(selectedDepartment.id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>部署管理</CardTitle>
        <CardDescription>
          システム内の部署情報を管理します。部署の追加・編集・削除を行えます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="部署検索..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                部署を追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新しい部署を追加</DialogTitle>
                <DialogDescription>
                  新しい部署の情報を入力してください。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">部署コード</Label>
                  <Input
                    id="code"
                    placeholder="例: IT"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">短い部署コード（略称）を入力してください</p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="name">部署正式名称</Label>
                  <Input
                    id="name"
                    placeholder="例: 情報システム部"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <h3 className="text-sm font-semibold">部署階層構造</h3>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="level1">第1階層</Label>
                    <Input
                      id="level1"
                      placeholder="例: 全社"
                      value={newDepartment.level1}
                      onChange={(e) => setNewDepartment({ ...newDepartment, level1: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="level2">第2階層</Label>
                    <Input
                      id="level2"
                      placeholder="例: 技術本部"
                      value={newDepartment.level2}
                      onChange={(e) => setNewDepartment({ ...newDepartment, level2: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="level3">第3階層</Label>
                    <Input
                      id="level3"
                      placeholder="例: システム統括部"
                      value={newDepartment.level3}
                      onChange={(e) => setNewDepartment({ ...newDepartment, level3: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="level4">第4階層</Label>
                    <Input
                      id="level4"
                      placeholder="例: 情報システム部"
                      value={newDepartment.level4}
                      onChange={(e) => setNewDepartment({ ...newDepartment, level4: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="level5">第5階層</Label>
                    <Input
                      id="level5"
                      placeholder="例: インフラチーム"
                      value={newDepartment.level5}
                      onChange={(e) => setNewDepartment({ ...newDepartment, level5: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">説明 (任意)</Label>
                  <Textarea
                    id="description"
                    placeholder="部署の説明や役割などを入力"
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  />
                </div>
                
                <div className="bg-muted/50 p-2 rounded-md">
                  <p className="text-xs text-muted-foreground">
                    フルパス: {[
                      newDepartment.level1, 
                      newDepartment.level2, 
                      newDepartment.level3, 
                      newDepartment.level4, 
                      newDepartment.level5
                    ].filter(Boolean).join('/') || '(未入力)'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">キャンセル</Button>
                </DialogClose>
                <Button 
                  onClick={handleAddDepartment}
                  disabled={createDepartmentMutation.isPending || !newDepartment.name.trim()}
                >
                  {createDepartmentMutation.isPending ? "作成中..." : "部署を作成"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部署コード</TableHead>
                  <TableHead>正式名称</TableHead>
                  <TableHead>階層構造/パス</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      部署が見つかりませんでした
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept: Department) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.code}</TableCell>
                      <TableCell>{dept.name}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {dept.fullPath ? (
                            <span 
                              className="text-sm text-muted-foreground cursor-help hover:text-foreground transition-colors" 
                              title={dept.fullPath}
                            >
                              {dept.fullPath}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{dept.description || "-"}</TableCell>
                      <TableCell>
                        {dept.createdAt ? format(new Date(dept.createdAt), 'yyyy/MM/dd') : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>アクション</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                // すべての必要なプロパティを確実に含める
                                setSelectedDepartment({
                                  ...dept,
                                  code: dept.code || "",
                                  level1: dept.level1 || "",
                                  level2: dept.level2 || "",
                                  level3: dept.level3 || "",
                                  level4: dept.level4 || "",
                                  level5: dept.level5 || "",
                                  fullPath: dept.fullPath || "",
                                  parentId: dept.parentId || null
                                });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // 削除時にも必要な情報をすべて含める
                                setSelectedDepartment({
                                  ...dept,
                                  code: dept.code || "",
                                  level1: dept.level1 || "",
                                  level2: dept.level2 || "",
                                  level3: dept.level3 || "",
                                  level4: dept.level4 || "",
                                  level5: dept.level5 || "",
                                  fullPath: dept.fullPath || "",
                                  parentId: dept.parentId || null
                                });
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* 部署編集ダイアログ */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>部署を編集</DialogTitle>
              <DialogDescription>
                部署情報を変更します。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">部署コード</Label>
                <Input
                  id="edit-code"
                  value={selectedDepartment?.code || ""}
                  onChange={(e) => setSelectedDepartment(prev => 
                    prev ? { ...prev, code: e.target.value } : null
                  )}
                />
                <p className="text-xs text-muted-foreground">短い部署コード（略称）</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-name">部署正式名称</Label>
                <Input
                  id="edit-name"
                  value={selectedDepartment?.name || ""}
                  onChange={(e) => setSelectedDepartment(prev => 
                    prev ? { ...prev, name: e.target.value } : null
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <h3 className="text-sm font-semibold">部署階層構造</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-level1">第1階層</Label>
                  <Input
                    id="edit-level1"
                    placeholder="例: 全社"
                    value={selectedDepartment?.level1 || ""}
                    onChange={(e) => setSelectedDepartment(prev => 
                      prev ? { ...prev, level1: e.target.value } : null
                    )}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-level2">第2階層</Label>
                  <Input
                    id="edit-level2"
                    placeholder="例: 技術本部"
                    value={selectedDepartment?.level2 || ""}
                    onChange={(e) => setSelectedDepartment(prev => 
                      prev ? { ...prev, level2: e.target.value } : null
                    )}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-level3">第3階層</Label>
                  <Input
                    id="edit-level3"
                    placeholder="例: システム統括部"
                    value={selectedDepartment?.level3 || ""}
                    onChange={(e) => setSelectedDepartment(prev => 
                      prev ? { ...prev, level3: e.target.value } : null
                    )}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-level4">第4階層</Label>
                  <Input
                    id="edit-level4"
                    placeholder="例: 情報システム部"
                    value={selectedDepartment?.level4 || ""}
                    onChange={(e) => setSelectedDepartment(prev => 
                      prev ? { ...prev, level4: e.target.value } : null
                    )}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-level5">第5階層</Label>
                  <Input
                    id="edit-level5"
                    placeholder="例: インフラチーム"
                    value={selectedDepartment?.level5 || ""}
                    onChange={(e) => setSelectedDepartment(prev => 
                      prev ? { ...prev, level5: e.target.value } : null
                    )}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">説明 (任意)</Label>
                <Textarea
                  id="edit-description"
                  value={selectedDepartment?.description || ""}
                  onChange={(e) => setSelectedDepartment(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>
              
              <div className="bg-muted/50 p-2 rounded-md">
                <p className="text-xs text-muted-foreground">
                  フルパス: {[
                    selectedDepartment?.level1, 
                    selectedDepartment?.level2, 
                    selectedDepartment?.level3, 
                    selectedDepartment?.level4, 
                    selectedDepartment?.level5
                  ].filter(Boolean).join('/') || '(未入力)'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">キャンセル</Button>
              </DialogClose>
              <Button 
                onClick={handleEditDepartment}
                disabled={updateDepartmentMutation.isPending || !selectedDepartment?.name.trim()}
              >
                {updateDepartmentMutation.isPending ? "更新中..." : "部署を更新"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 部署削除確認ダイアログ */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>部署を削除</DialogTitle>
              <DialogDescription>
                この部署を削除しますか？この操作は取り消せません。
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500">
                部署「<span className="font-medium text-foreground">{selectedDepartment?.name}</span>」を削除します。
                部署に所属していたユーザーは所属なしとなります。
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">キャンセル</Button>
              </DialogClose>
              <Button 
                variant="destructive"
                onClick={handleDeleteDepartment}
                disabled={deleteDepartmentMutation.isPending}
              >
                {deleteDepartmentMutation.isPending ? "削除中..." : "部署を削除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}