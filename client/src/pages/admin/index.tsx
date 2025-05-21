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
import { useNavigate } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users, Building2, FileSpreadsheet } from "lucide-react";

// 管理者ページのコンポーネントをインポート
import UserManagement from "./user-management";
import DepartmentManagement from "./department-management";
import EmployeeImport from "./employee-import";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // 認証・権限チェック
  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
  }

  if (!isAuthenticated) {
    return (
      <AlertDialog open={true} onOpenChange={() => navigate("/login")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アクセス制限</AlertDialogTitle>
            <AlertDialogDescription>
              このページにアクセスするにはログインが必要です。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/login")}>
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
      <AlertDialog open={true} onOpenChange={() => navigate("/")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>権限エラー</AlertDialogTitle>
            <AlertDialogDescription>
              管理者専用ページへのアクセス権限がありません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/")}>
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