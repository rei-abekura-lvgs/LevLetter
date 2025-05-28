import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Building2, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// 管理者ページのコンポーネントをインポート
import UserManagement from "./user-management";
import DepartmentManagement from "./department-management";
import EmployeeImport from "./employee-import";

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 週次ポイントリセット機能
  const resetPointsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/reset-weekly-points", {});
    },
    onSuccess: (data) => {
      // ユーザー情報のキャッシュを無効化してサイドバーも更新
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      toast({
        title: "ポイントリセット完了！✨",
        description: data.message,
        duration: 4000
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラーが発生しました",
        description: error.message || "ポイントリセットに失敗しました",
        variant: "destructive"
      });
    }
  });

  // 認証・権限チェック
  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AlertDialog open={true} onOpenChange={() => setLocation("/login")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アクセス制限</AlertDialogTitle>
            <AlertDialogDescription>
              このページにアクセスするにはログインが必要です。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setLocation("/login")}>
              ログインページへ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // 管理者権限チェック
  if (!user?.isAdmin) {
    return (
      <AlertDialog open={true} onOpenChange={() => setLocation("/")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>権限エラー</AlertDialogTitle>
            <AlertDialogDescription>
              管理者専用ページへのアクセス権限がありません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setLocation("/")}>
              ホームに戻る
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">管理者設定</h1>
        <p className="text-muted-foreground mt-1">
          LevLetterシステムの設定や管理を行うための管理者専用ページです。
        </p>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>管理者権限での操作に注意</AlertTitle>
        <AlertDescription>
          このページでの変更はシステム全体に影響します。操作には十分注意してください。
        </AlertDescription>
      </Alert>

      {/* 週次ポイントリセット機能 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            週次ポイントリセット（テスト機能）
          </CardTitle>
          <CardDescription>
            全ユーザーの週次ポイントを500ptにリセットします。通常は毎週月曜日に自動実行されますが、テスト目的で手動実行できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => resetPointsMutation.mutate()}
            disabled={resetPointsMutation.isPending}
            className="bg-[#3990EA] hover:bg-[#2980d9]"
          >
            {resetPointsMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                実行中...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                ポイントリセット実行
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>ユーザー管理</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>部署管理</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>従業員データインポート</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="import">
          <EmployeeImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}