import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Trash2, Edit, Plus, Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import type { Department } from "@shared/schema";
import { useAuth } from "@/context/auth-context";

const departmentSchema = z.object({
  name: z.string().min(1, { message: "部署名は必須です" }),
  description: z.string().optional(),
});

// 一括登録用のスキーマ
const batchDepartmentsSchema = z.object({
  departments: z.string().min(1, { message: "部署データを入力してください" }),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;
type BatchDepartmentsFormValues = z.infer<typeof batchDepartmentsSchema>;

interface DepartmentFormProps {
  department?: Department;
  onClose: () => void;
}

// 部署一括登録用のフォームコンポーネント
function BatchDepartmentsForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BatchDepartmentsFormValues>({
    resolver: zodResolver(batchDepartmentsSchema),
    defaultValues: {
      departments: "",
    },
  });

  async function onSubmit(data: BatchDepartmentsFormValues) {
    try {
      setIsSubmitting(true);
      
      // テキストを行ごとに分割
      const lines = data.departments.split('\n').filter(line => line.trim() !== '');
      
      // 各行をパースして部署データに変換
      const departmentList = lines.map(line => {
        const [name, description] = line.split('\t');
        return {
          name: name.trim(),
          description: description ? description.trim() : null
        };
      });
      
      // リクエストデータをログ出力
      const requestData = { departments: departmentList };
      console.log("一括登録リクエストデータ:", JSON.stringify(requestData));
      
      // サーバーに送信して一括登録
      const result = await apiRequest("POST", "/api/departments/batch", requestData);
      console.log("一括登録レスポンス:", result);
      
      // 成功メッセージを表示
      toast({
        title: "部署が一括登録されました",
        description: `${departmentList.length}件の部署を登録しました`,
      });
      
      // データを再取得
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      
      // フォームをリセット
      form.reset();
    } catch (error) {
      console.error("部署の一括登録エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: "部署の一括登録中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="departments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部署データを入力</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`部署名（タブ）説明\n例：\n営業部\t営業活動を担当\n技術部\t製品開発を担当\n人事部`}
                  className="min-h-[200px] font-mono"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground mt-2">
                部署名と説明はタブ区切りで入力してください。説明は省略可能です。
                各部署は改行で区切ります。
              </p>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          部署を一括登録
        </Button>
      </form>
    </Form>
  );
}

function DepartmentForm({ department, onClose }: DepartmentFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name || "",
      description: department?.description || "",
    },
  });

  async function onSubmit(data: DepartmentFormValues) {
    try {
      setIsSubmitting(true);
      if (department) {
        // 更新
        await apiRequest("PUT", `/api/departments/${department.id}`, data);
        toast({
          title: "部署が更新されました",
          description: `部署「${data.name}」を更新しました`,
        });
      } else {
        // 新規作成
        await apiRequest("POST", "/api/departments", data);
        toast({
          title: "部署が作成されました",
          description: `部署「${data.name}」を作成しました`,
        });
      }
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      onClose();
    } catch (error) {
      console.error("部署の保存エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: "部署の保存中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>部署名</FormLabel>
              <FormControl>
                <Input placeholder="例: マーケティング部" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="部署の説明や役割を入力してください"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {department ? "更新" : "作成"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function DepartmentsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: departments = [],
    isLoading: isDepartmentsLoading,
    error,
  } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "部署が削除されました",
        description: "部署を削除しました",
      });
      setShowDeleteDialog(false);
    },
    onError: (error) => {
      console.error("削除エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: "部署の削除中にエラーが発生しました。もう一度お試しください。",
        variant: "destructive",
      });
    },
  });

  const handleAddDepartment = () => {
    setSelectedDepartment(undefined);
    setShowDialog(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowDialog(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedDepartment) {
      deleteMutation.mutate(selectedDepartment.id);
    }
  };

  const loading = isDepartmentsLoading;

  return (
    <div>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">部署一覧</TabsTrigger>
          <TabsTrigger value="bulk">一括登録</TabsTrigger>
        </TabsList>
        
        {/* 部署一覧タブ */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddDepartment}>
              <Plus className="mr-2 h-4 w-4" />
              新規部署作成
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              部署情報の読み込み中にエラーが発生しました
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              部署が登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部署名</TableHead>
                  <TableHead>説明</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department: Department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditDepartment(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteDepartment(department)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        {/* 一括登録タブ */}
        <TabsContent value="bulk">
          <BatchDepartmentsForm />
        </TabsContent>
      </Tabs>

      {/* 部署作成・編集ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDepartment ? "部署を編集" : "新規部署作成"}
            </DialogTitle>
          </DialogHeader>
          <DepartmentForm
            department={selectedDepartment}
            onClose={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>部署の削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              部署「{selectedDepartment?.name}」を削除しますか？
              <br />
              この操作は元に戻せません。
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}