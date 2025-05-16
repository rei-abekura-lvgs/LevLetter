import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { registerSchema } from "@shared/schema";
import { register as registerUser } from "@/lib/auth";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// バリデーションルールを使用
const extendedRegisterSchema = registerSchema;

type RegisterFormValues = z.infer<typeof extendedRegisterSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      // 確認用のパスワードを除外
      const { confirmPassword, ...registerData } = data;
      
      // 部署名が空の場合はデフォルト値を設定
      if (!registerData.department) {
        registerData.department = "未設定";
      }
      
      console.log("送信データ:", registerData); // デバッグ用
      const response = await registerUser(registerData);
      setUser(response.user);
      setLocation("/");
      toast({
        title: "登録成功",
        description: "LevLetterへようこそ！",
      });
    } catch (error) {
      console.error("登録エラー:", error);
      toast({
        title: "登録エラー",
        description: error instanceof Error ? error.message : "登録に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">アカウント作成</h1>
        <p className="text-muted-foreground">
          必要な情報を入力して新規登録してください
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">名前</Label>
          <Input
            id="name"
            placeholder="山田 太郎"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

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
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">パスワード（確認）</Label>
          <Input
            id="confirmPassword"
            type="password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">部署名</Label>
          <Input
            id="department"
            placeholder="開発部"
            {...form.register("department")}
          />
          {form.formState.errors.department && (
            <p className="text-sm text-red-500">{form.formState.errors.department.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "登録中..." : "アカウント作成"}
        </Button>
      </form>

      <div className="text-center text-sm">
        すでにアカウントをお持ちですか？{" "}
        <Link href="/login" className="text-primary hover:underline">ログイン</Link>
      </div>
    </div>
  );
}