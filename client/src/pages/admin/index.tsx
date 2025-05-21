import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import UserManagement from "./user-management";
import DepartmentManagement from "./department-management";
import EmployeeImport from "./employee-import";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  // 認証済みかつ管理者権限を持つユーザーのみアクセス可能
  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>アクセス権限がありません</AlertTitle>
          <AlertDescription>
            この画面は管理者のみアクセスできます。
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.history.back()}>前のページに戻る</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>管理者ダッシュボード</CardTitle>
          <CardDescription>
            LevLetterシステムの管理機能にアクセスできます
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 grid w-full grid-cols-3">
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="departments">部署管理</TabsTrigger>
          <TabsTrigger value="import">従業員データインポート</TabsTrigger>
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