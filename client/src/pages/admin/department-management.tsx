import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { PlusCircle, RefreshCw, Trash2, Edit, Save, X, AlertCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { Department, InsertDepartment } from "@shared/schema";

export default function DepartmentManagement() {
  const { toast } = useToast();
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // 部署一覧の取得
  const { data: departments, isLoading, error, refetch } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // 部署作成のミューテーション
  const createDepartment = useMutation({
    mutationFn: async (data: InsertDepartment) => {
      const response = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "部署の作成に失敗しました");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "部署を作成しました",
        description: "新しい部署が正常に追加されました",
      });
      setNewDeptName("");
      setNewDeptDesc("");
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message,
      });
    },
  });

  // 部署更新のミューテーション
  const updateDepartment = useMutation({
    mutationFn: async (data: Department) => {
      const response = await fetch(`/api/admin/departments/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, description: data.description }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "部署の更新に失敗しました");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "部署を更新しました",
        description: "部署情報が正常に更新されました",
      });
      setEditingDept(null);
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message,
      });
    },
  });

  // 部署削除のミューテーション
  const deleteDepartment = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "部署の削除に失敗しました");
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "部署を削除しました",
        description: "部署が正常に削除されました",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "エラーが発生しました",
        description: error.message,
      });
    },
  });

  // 一括インポート処理
  const handleBulkImport = () => {
    try {
      // 入力テキストを行ごとに分割
      const lines = bulkImportText.trim().split('\n');
      
      // 行ごとに処理
      const departmentsToAdd = lines
        .filter(line => line.trim() !== '')
        .map(line => {
          // タブまたはカンマで分割
          const parts = line.includes('\t') ? line.split('\t') : line.split(',');
          const name = parts[0]?.trim() || '';
          const description = parts[1]?.trim() || '';
          
          return { name, description };
        })
        .filter(dept => dept.name !== ''); // 名前が空の部署は除外
      
      // バルク作成処理 - 本来は一括処理をするAPIを実装するべきですが、
      // この例では個別に作成処理を呼び出します
      let successCount = 0;
      let errorCount = 0;
      
      departmentsToAdd.forEach(dept => {
        createDepartment.mutate(dept, {
          onSuccess: () => { successCount++; },
          onError: () => { errorCount++; }
        });
      });
      
      // 処理完了のトースト表示
      toast({
        title: "インポート完了",
        description: `${departmentsToAdd.length}件中 ${successCount}件の部署を追加しました。${errorCount > 0 ? `${errorCount}件のエラーがありました。` : ''}`,
      });
      
      // ダイアログを閉じる
      setBulkImportOpen(false);
      setBulkImportText("");
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "インポートエラー",
        description: "データの形式が正しくありません。",
      });
    }
  };

  // 新規部署追加
  const handleAddDepartment = () => {
    if (!newDeptName.trim()) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "部署名を入力してください",
      });
      return;
    }
    
    createDepartment.mutate({
      name: newDeptName,
      description: newDeptDesc || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>部署管理</CardTitle>
          <CardDescription>読み込み中...</CardDescription>
        </CardHeader>
        <CardContent className="h-40 flex items-center justify-center">
          <RefreshCw className="animate-spin h-8 w-8 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>部署管理</CardTitle>
          <CardDescription>エラーが発生しました</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>読み込みエラー</AlertTitle>
            <AlertDescription>
              部署情報の取得中にエラーが発生しました。再読み込みをお試しください。
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> 再読み込み
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>部署管理</CardTitle>
        <CardDescription>部署情報の追加・編集・削除</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-2">
            <Label htmlFor="dept-name">部署名</Label>
            <Input
              id="dept-name"
              placeholder="新しい部署名"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
            />
          </div>
          <div>
            <Label>&nbsp;</Label>
            <Button 
              className="w-full" 
              onClick={handleAddDepartment} 
              disabled={createDepartment.isPending}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              部署を追加
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <Label htmlFor="dept-desc">説明（オプション）</Label>
          <Textarea
            id="dept-desc"
            placeholder="部署の説明"
            value={newDeptDesc}
            onChange={(e) => setNewDeptDesc(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部署名</TableHead>
                <TableHead>説明</TableHead>
                <TableHead className="w-[150px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments && departments.length > 0 ? (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>
                      {editingDept?.id === dept.id ? (
                        <Input
                          value={editingDept.name}
                          onChange={(e) => setEditingDept({...editingDept, name: e.target.value})}
                        />
                      ) : (
                        <div className="font-medium">{dept.name}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingDept?.id === dept.id ? (
                        <Input
                          value={editingDept.description || ''}
                          onChange={(e) => setEditingDept({...editingDept, description: e.target.value || null})}
                        />
                      ) : (
                        <div>{dept.description || "-"}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingDept?.id === dept.id ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => updateDepartment.mutate(editingDept)}
                            disabled={updateDepartment.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingDept(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingDept(dept)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              if (window.confirm(`「${dept.name}」部署を削除してもよろしいですか？`)) {
                                deleteDepartment.mutate(dept.id);
                              }
                            }}
                            disabled={deleteDepartment.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    部署情報がありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="justify-between">
        <div>
          {departments && <span className="text-sm text-muted-foreground">合計 {departments.length} 部署</span>}
        </div>
        
        <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" /> 一括インポート
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>部署データの一括インポート</DialogTitle>
              <DialogDescription>
                CSVまたはタブ区切りのテキストを貼り付けてください。<br />
                形式: 「部署名, 説明」（説明はオプション）<br />
                例: 「営業部, 営業を担当する部署」
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="部署データを貼り付け..."
                rows={10}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkImportOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleBulkImport} disabled={!bulkImportText.trim()}>
                インポート
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}