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
import { Trash2, Edit, Plus } from "lucide-react";
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
import { apiRequest } from "@/lib/queryClient";
import type { Department } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

const departmentSchema = z.object({
  name: z.string().min(1, { message: "部署名は必須です" }),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  department?: Department;
  onClose: () => void;
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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | undefined>(undefined);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: departments = [],
    isLoading: isDepartmentsLoading,
    error,
  } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">部署管理</CardTitle>
          <CardDescription>部署の追加、編集、削除を行うことができます</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddDepartment}>
              <Plus className="mr-2 h-4 w-4" />
              新規部署作成
            </Button>
          </div>

          {isDepartmentsLoading ? (
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
                {departments.map((department) => (
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
        </CardContent>
      </Card>

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