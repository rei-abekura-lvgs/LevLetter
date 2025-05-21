import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { User } from "@shared/schema";

export default function Settings() {
  const { user, loading } = useAuth();

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
          <CardTitle className="text-2xl font-bold">ユーザー設定</CardTitle>
          <CardDescription>LevLetterの個人設定を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>現在設定可能な項目はありません。</p>
            <p className="mt-2">管理者設定は管理者メニューからアクセスしてください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}