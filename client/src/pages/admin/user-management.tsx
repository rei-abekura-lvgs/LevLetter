import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, ShieldCheck, Shield, UserCog } from "lucide-react";
import { format } from "date-fns";

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // ユーザー一覧を取得
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: true,
  });

  // フィルタリングされたユーザー
  const filteredUsers = users.filter((user: User) => {
    const lowerQuery = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      (user.department && user.department.toLowerCase().includes(lowerQuery))
    );
  });

  // 管理者権限更新ミューテーション
  const updateAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/admin`, {
        method: "PATCH",
        data: { isAdmin },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "更新完了",
        description: "ユーザーの管理者権限を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "管理者権限の更新に失敗しました",
        variant: "destructive",
      });
    }
  });

  // アクティブ状態更新ミューテーション
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        data: { isActive },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "更新完了",
        description: "ユーザーの状態を更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "ユーザー状態の更新に失敗しました",
        variant: "destructive",
      });
    }
  });

  // 管理者権限の切り替え処理
  const toggleAdminStatus = (user: User) => {
    // rei.abekura@leverages.jpは特別アカウントとして保護
    if (user.email === "rei.abekura@leverages.jp" && user.isAdmin) {
      toast({
        title: "権限エラー",
        description: "このアカウントの管理者権限は削除できません",
        variant: "destructive",
      });
      return;
    }

    updateAdminMutation.mutate({
      userId: user.id,
      isAdmin: !user.isAdmin,
    });
  };

  // アクティブ状態の切り替え処理
  const toggleActiveStatus = (user: User) => {
    // rei.abekura@leverages.jpは特別アカウントとして保護
    if (user.email === "rei.abekura@leverages.jp") {
      toast({
        title: "権限エラー",
        description: "このアカウントの状態は変更できません",
        variant: "destructive",
      });
      return;
    }

    updateStatusMutation.mutate({
      userId: user.id,
      isActive: !user.isActive,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ユーザー管理</CardTitle>
        <CardDescription>
          システム内のユーザーアカウントを管理します。管理者権限の付与や、
          退職者のアカウント無効化などを行えます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ユーザー検索..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メールアドレス</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      ユーザーが見つかりませんでした
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.isAdmin && (
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-600 border-amber-200">
                            <ShieldCheck className="h-3 w-3 mr-1" />管理者
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department || "未設定"}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                            アクティブ
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                            無効
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? format(new Date(user.createdAt), 'yyyy/MM/dd') : "不明"}
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
                              onClick={() => toggleAdminStatus(user)}
                              disabled={
                                updateAdminMutation.isPending ||
                                (user.email === "rei.abekura@leverages.jp" && user.isAdmin)
                              }
                            >
                              {user.isAdmin ? (
                                <>
                                  <Shield className="h-4 w-4 mr-2" />
                                  管理者権限を削除
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  管理者権限を付与
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActiveStatus(user)}
                              disabled={
                                updateStatusMutation.isPending ||
                                user.email === "rei.abekura@leverages.jp"
                              }
                            >
                              <UserCog className="h-4 w-4 mr-2" />
                              {user.isActive ? "アカウントを無効化" : "アカウントを有効化"}
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
      </CardContent>
    </Card>
  );
}