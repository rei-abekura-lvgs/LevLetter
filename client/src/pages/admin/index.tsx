import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, Building2, Upload } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // 認証状態の確認
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  // 未認証または非管理者の場合はリダイレクト
  if (!isAuthenticated || !user?.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">管理者ダッシュボード</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="users">ユーザー管理</TabsTrigger>
          <TabsTrigger value="departments">部署管理</TabsTrigger>
          <TabsTrigger value="import">データインポート</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ユーザー管理</CardTitle>
                <CardDescription>アカウントの有効化・管理者権限の設定</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-primary mr-2" />
                    <span className="text-2xl font-bold">--</span>
                  </div>
                  <Button onClick={() => setActiveTab("users")} variant="outline">
                    管理する
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>部署管理</CardTitle>
                <CardDescription>部署の作成・編集・削除</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Building2 className="w-8 h-8 text-primary mr-2" />
                    <span className="text-2xl font-bold">--</span>
                  </div>
                  <Button onClick={() => setActiveTab("departments")} variant="outline">
                    管理する
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>従業員データインポート</CardTitle>
                <CardDescription>CSVからのユーザーデータ一括登録</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Upload className="w-8 h-8 text-primary mr-2" />
                  </div>
                  <Button onClick={() => setActiveTab("import")} variant="outline">
                    インポート
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
              <CardDescription>システム内のユーザーアカウントを管理します</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 my-12">ユーザー管理機能開発中...</p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  概要に戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>部署管理</CardTitle>
              <CardDescription>部署の作成・編集・削除を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 my-12">部署管理機能開発中...</p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  概要に戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>従業員データインポート</CardTitle>
              <CardDescription>CSVファイルから従業員データをインポートします</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 my-12">インポート機能開発中...</p>
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  概要に戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}