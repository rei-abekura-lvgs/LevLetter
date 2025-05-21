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
    name: string;
    description: string;
  }>({
    name: "",
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
      name: string;
      description: string | null;
    }) => {
      return apiRequest('/api/departments', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsAddDialogOpen(false);
      setNewDepartment({
        name: "",
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
        name: string; 
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
    if (!newDepartment.name.trim()) {
      toast({
        title: "エラー",
        description: "部署名を入力してください",
        variant: "destructive",
      });
      return;
    }

    createDepartmentMutation.mutate({
      name: newDepartment.name.trim(),
      description: newDepartment.description?.trim() || null,
    });
  };

  // 部署編集ハンドラー
  const handleEditDepartment = () => {
    if (!selectedDepartment) return;
    
    if (!selectedDepartment.name.trim()) {
      toast({
        title: "エラー",
        description: "部署名を入力してください",
        variant: "destructive",
      });
      return;
    }

    updateDepartmentMutation.mutate({
      id: selectedDepartment.id,
      data: {
        name: selectedDepartment.name.trim(),
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
                  <Label htmlFor="name">部署名（階層は '/' で区切ってください）</Label>
                  <Input
                    id="name"
                    placeholder="例: システム本部/レバテック開発部/ITRプロダクト開発グループ/オウンドITRチーム"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    階層構造を表現する場合は、スラッシュで区切って入力してください。
                  </p>
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
                  <TableHead>部署階層</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      部署が見つかりませんでした
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept: Department) => {
                    // 部署名を階層に分割（スラッシュで区切られている場合）
                    const hierarchyLevels = dept.name.split('/');
                    
                    return (
                      <TableRow key={dept.id}>
                        <TableCell>
                          <div className="space-y-0.5">
                            {hierarchyLevels.map((level, index) => (
                              <div key={index} className={`${index > 0 ? `pl-${index * 4}` : ''} ${index === 0 ? 'text-emerald-700 font-medium' : 'text-emerald-600'}`}>
                                {level.trim()}
                              </div>
                            ))}
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
                                setSelectedDepartment(dept);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              編集
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDepartment(dept);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
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
              <DialogTitle>部署情報を編集</DialogTitle>
              <DialogDescription>
                部署の情報を更新することができます。
              </DialogDescription>
            </DialogHeader>
            {selectedDepartment && (
              <div className="grid gap-4 py-4">                
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">部署名</Label>
                  <Input
                    id="edit-name"
                    placeholder="例: 情報システム部"
                    value={selectedDepartment.name}
                    onChange={(e) => setSelectedDepartment({ ...selectedDepartment, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">説明 (任意)</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="部署の説明や役割などを入力"
                    value={selectedDepartment.description || ""}
                    onChange={(e) => setSelectedDepartment({ ...selectedDepartment, description: e.target.value })}
                  />
                </div>
              </div>
            )}
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
              <DialogTitle>部署削除の確認</DialogTitle>
              <DialogDescription>
                この部署を削除してもよろしいですか？この操作は元に戻せません。
              </DialogDescription>
            </DialogHeader>
            {selectedDepartment && (
              <div className="py-4">
                <div className="rounded-md bg-muted p-4 mb-4">
                  <p><strong>部署名:</strong> {selectedDepartment.name}</p>
                  <p><strong>説明:</strong> {selectedDepartment.description || "-"}</p>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  この部署を削除すると、関連するすべてのデータも削除されます。
                </p>
              </div>
            )}
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