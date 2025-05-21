import { useState, useEffect } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { InfoIcon, CheckCircle, XCircle } from "lucide-react";

// バリデーションルールを拡張
const extendedRegisterSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください" }),
  confirmPassword: z.string().min(6, { message: "パスワードは6文字以上で入力してください" })
}).refine(data => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof extendedRegisterSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { fetchUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // メールアドレスの検証
  const verifyEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setVerifyingEmail(true);
    try {
      // メールアドレスの検証リクエスト
      const response = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      console.log(`メール検証 (${email}) レスポンス:`, data);
      
      // レスポンスに基づいて状態を更新
      setEmailVerified(data.exists === true);
    } catch (error) {
      console.error("メール検証エラー:", error);
      setEmailVerified(false);
    } finally {
      setVerifyingEmail(false);
    }
  };

  // メールアドレスが変更されたときに検証
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.email) {
        const timer = setTimeout(() => {
          if (value.email) verifyEmail(value.email);
        }, 1000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  async function onSubmit(data: RegisterFormValues) {
    if (emailVerified !== true) {
      toast({
        title: "検証エラー",
        description: "メールアドレスが事前登録されていないため、アカウントを作成できません。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 登録データを準備
      const registerData = {
        email: data.email,
        password: data.password,
      };
      
      console.log("送信データ:", registerData);
      const response = await registerUser(registerData);
      
      console.log("登録成功レスポンス:", response);
      
      // ユーザーコンテキストを更新
      await fetchUser();
      
      // 成功メッセージを表示
      toast({
        title: "登録成功",
        description: "LevLetterへようこそ！",
      });
      
      // ホームページに遷移
      setLocation("/");
    } catch (error) {
      console.error("登録エラー:", error);
      if (error instanceof Response) {
        const errorText = await error.text();
        console.error("サーバーエラー詳細:", errorText);
        toast({
          title: "登録エラー",
          description: `サーバーエラー: ${errorText}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "登録エラー",
          description: error instanceof Error ? error.message : "登録に失敗しました。もう一度お試しください。",
          variant: "destructive",
        });
      }
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

      <Alert className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          アカウント作成には管理者が事前登録したメールアドレスが必要です。
        </AlertDescription>
      </Alert>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex justify-between">
            <span>メールアドレス</span>
            {emailVerified !== null && !verifyingEmail && (
              <span className="flex items-center text-xs">
                {emailVerified ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-600">登録済みアドレス</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-600">未登録アドレス</span>
                  </>
                )}
              </span>
            )}
          </Label>
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || emailVerified !== true}
        >
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