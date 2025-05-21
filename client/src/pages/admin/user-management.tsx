import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  ShieldX,
  RefreshCw,
  UserPlus
} from "lucide-react";
import type { User } from "@shared/schema";
import { getInitials } from "@/lib/utils";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // ユーザー一覧の取得
  const { data: users, isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // 検索機能の実装
  const filteredUsers = users?.filter(user => {
    // 非アクティブユーザーの表示制御
    if (!showInactive && !user.isActive) return false;
    
    // 検索条件に一致するユーザーのみ表示
    if (searchTerm.trim() === "") return true;
    
    const term = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.department?.toLowerCase().includes(term) ||
      user.employeeId?.toLowerCase().includes(term)
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ユーザー管理</CardTitle>
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
          <CardTitle>ユーザー管理</CardTitle>
          <CardDescription>エラーが発生しました</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>読み込みエラー</AlertTitle>
            <AlertDescription>
              ユーザー情報の取得中にエラーが発生しました。再読み込みをお試しください。
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
        <CardTitle>ユーザー管理</CardTitle>
        <CardDescription>ユーザーアカウントの管理と権限設定</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ユーザー名、メール、部署などで検索..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-inactive" 
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <label htmlFor="show-inactive">非アクティブユーザーを表示</label>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>メールアドレス</TableHead>
                <TableHead>部署</TableHead>
                <TableHead>従業員ID</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`bg-${user.avatarColor}`}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name}</span>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>{user.employeeId || "-"}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" /> アクティブ
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                          <AlertCircle className="mr-1 h-3 w-3" /> 無効
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">
                          <ShieldCheck className="mr-1 h-3 w-3" /> 管理者
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50">
                          一般ユーザー
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* 権限変更ボタン - 実際の処理は後で実装 */}
                      <Button variant="ghost" size="sm" className="h-8 px-2" title={user.isAdmin ? "管理者権限を削除" : "管理者権限を付与"}>
                        {user.isAdmin ? <ShieldX className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                      {/* アクティブ状態変更ボタン - 実際の処理は後で実装 */}
                      <Button variant="ghost" size="sm" className="h-8 px-2" title={user.isActive ? "ユーザーを無効化" : "ユーザーを有効化"}>
                        {user.isActive ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    ユーザーが見つかりません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div>
          {users && <span className="text-sm text-muted-foreground">全 {users.length} ユーザー中 {filteredUsers?.length || 0} 件表示</span>}
        </div>
        <Button className="ml-auto">
          <UserPlus className="mr-2 h-4 w-4" /> 新規ユーザー追加
        </Button>
      </CardFooter>
    </Card>
  );
}