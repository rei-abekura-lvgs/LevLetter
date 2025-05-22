import { useState } from "react";
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

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { fetchUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await login(data.email, data.password);
      console.log("ログイン成功:", response);
      
      // 認証コンテキストを更新（ユーザー情報を再取得）
      await fetchUser();
      
      // 成功メッセージを表示
      toast({
        title: "ログイン成功",
        description: "LevLetterへようこそ！",
      });
      
      // 画面遷移の準備
      console.log("ホーム画面への遷移準備中...");
      
      // 少し遅延させてからページ遷移する（ステート更新が完了するのを待つ）
      setTimeout(() => {
        // SPAルーティングを使用して画面遷移
        setLocation("/");
      }, 300);
    } catch (error) {
      console.error("ログインエラー:", error);
      toast({
        title: "ログインエラー",
        description: error instanceof Error ? error.message : "ログインに失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-center">
        {/* 可愛いクマのロゴ */}
        <div className="flex flex-col items-center space-y-3">
          <BearLogo size={80} />
          <h1 className="text-3xl font-bold text-[#3990EA]">LevLetter</h1>
        </div>
        <div className="pt-4">
          <h2 className="text-2xl font-semibold">ログイン</h2>
          <p className="text-muted-foreground">
            アカウント情報を入力してログインしてください
          </p>
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
            <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">パスワード</Label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              パスワードをお忘れですか？
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "ログイン中..." : "ログイン"}
        </Button>
      </form>

      <div className="text-center text-sm">
        アカウントをお持ちでないですか？{" "}
        <Link href="/register" className="text-primary hover:underline">新規登録</Link>
      </div>
    </div>
  );
}