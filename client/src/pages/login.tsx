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

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
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
      
      // ユーザーコンテキストを更新
      setUser(response.user);
      
      // 成功メッセージを表示
      toast({
        title: "ログイン成功",
        description: "LevLetterへようこそ！",
      });
      
      // 画面遷移のために十分な遅延を設定
      console.log("ホーム画面への遷移準備中...");
      
      // すぐにlocation.hrefで直接ページ遷移を行う（SPA内のルーティングをバイパス）
      window.location.href = "/";
    } catch (error) {
      console.error("ログインエラー:", error);
      toast({
        title: "ログインエラー",
        description: error instanceof Error ? error.message : "ログインに失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">ログイン</h1>
        <p className="text-muted-foreground">
          アカウント情報を入力してログインしてください
        </p>
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