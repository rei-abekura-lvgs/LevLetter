import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { loginSchema } from "@shared/schema";
import { login } from "@/lib/auth";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BearLogo } from "@/components/bear-logo";
import { ChevronDown, ChevronUp } from "lucide-react";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login: authLogin, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [location, setLocation] = useLocation();
  
  // URLパラメータからエラーをチェック
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  // エラーメッセージの表示
  React.useEffect(() => {
    if (error === 'employee_not_found') {
      toast({
        title: "認証エラー",
        description: "このメールアドレスは従業員として登録されていません。管理者にお問い合わせください。",
        variant: "destructive",
      });
    } else if (error === 'auth_failed') {
      toast({
        title: "認証エラー",
        description: "Google認証に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } else if (error === 'config_error') {
      toast({
        title: "設定エラー",
        description: "認証設定に問題があります。管理者にお問い合わせください。",
        variant: "destructive",
      });
    } else if (error === 'token_exchange_failed') {
      toast({
        title: "認証エラー",
        description: "トークン取得に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } else if (error) {
      toast({
        title: "認証エラー",
        description: `認証処理中にエラーが発生しました: ${error}`,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      console.log("ログイン試行:", data.email);
      
      // auth contextのlogin関数を使用
      const success = await authLogin(data.email, data.password);
      
      if (success) {
        console.log("ログイン成功");
        
        // 成功メッセージを表示
        toast({
          title: "ログイン成功",
          description: "LevLetterへようこそ！",
          duration: 3000,
        });

        // 認証情報を更新
        await refreshUser();
        console.log("認証情報更新完了");

        // 画面遷移の準備
        console.log("ホーム画面への遷移準備中...");
        
        // 少し遅延してから確実に遷移
        setTimeout(() => {
          setLocation("/");
        }, 200);
      } else {
        throw new Error("ログインに失敗しました");
      }
    } catch (error) {
      console.error("ログインエラー:", error);
      toast({
        title: "ログインエラー",
        description:
          error instanceof Error
            ? error.message
            : "ログインに失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <BearLogo size={60} />
          </div>
          <h2 className="text-2xl font-semibold">ログイン</h2>
        </div>
      </div>

      {/* Google認証ボタン（推奨） */}
      <Button
        type="button"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isGoogleLoading}
        onClick={() => {
          setIsGoogleLoading(true);
          window.location.href = '/api/auth/google';
        }}
      >
        {isGoogleLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            認証中...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleでログイン（推奨）
          </>
        )}
      </Button>

      {/* メール・パスワードログイン展開セクション */}
      <div className="space-y-4">
        {/* 展開ボタン */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2 text-muted-foreground"
          onClick={() => setShowEmailPassword(!showEmailPassword)}
        >
          メール・パスワードでログイン
          {showEmailPassword ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* 展開可能なフォーム */}
        {showEmailPassword && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">メール・パスワードでログイン</span>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">パスワード</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    パスワードをお忘れですか？
                  </Link>
                </div>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </>
        )}
      </div>



      <div className="text-center text-sm">
        アカウントをお持ちでないですか？{" "}
        <Link href="/register" className="text-primary hover:underline">
          新規登録
        </Link>
      </div>
    </div>
  );
}
