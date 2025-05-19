import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2, Building2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "@shared/schema";
import Departments from "./departments";

export default function Settings() {
  const { user, loading } = useAuth();

  // ユーザーが管理者かどうかをチェック
  const isAdmin = user ? true : false; // 現時点ではすべてのユーザーが部署管理できるように

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">設定</CardTitle>
            <CardDescription>アクセスが拒否されました</CardDescription>
          </CardHeader>
          <CardContent>
            <p>この機能にアクセスするには、ログインが必要です。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">システム設定</CardTitle>
          <CardDescription>LevLetterのシステム設定を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="departments">
            <TabsList className="mb-6">
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                部署管理
              </TabsTrigger>
              {/* 他の設定タブをここに追加 */}
            </TabsList>
            
            <TabsContent value="departments">
              <Departments />
            </TabsContent>
            
            {/* 他の設定コンテンツをここに追加 */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}