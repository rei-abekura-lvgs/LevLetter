import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// パスワードリセットフォームのスキーマ
const resetPasswordSchema = z.object({
  token: z.string().optional(),
  password: z
    .string()
    .min(6, { message: "パスワードは6文字以上で入力してください" }),
  confirmPassword: z
    .string()
    .min(1, { message: "パスワード（確認）を入力してください" })
}).refine(data => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"]
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/reset-password");
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URLからトークンを取得
  useEffect(() => {
    // URLパスからトークンを取得を試みる
    const pathSegments = window.location.pathname.split('/');
    let tokenValue = null;
    
    if (pathSegments.length >= 3 && pathSegments[1] === 'reset-password') {
      // /reset-password/:token の形式
      tokenValue = pathSegments[2];
    } else {
      // クエリパラメータからも確認
      const searchParams = new URLSearchParams(window.location.search);
      tokenValue = searchParams.get("token");
    }
    
    if (!tokenValue) {
      setError("リセットトークンが見つかりません。URLをご確認ください。");
      return;
    }
    
    console.log("トークンを検出しました:", tokenValue.substring(0, 10) + "...");
    setToken(tokenValue);
  }, []);

  // フォームの初期化
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: ""
    }
  });

  // フォーム送信ハンドラ
  async function onSubmit(data: ResetPasswordFormValues) {
    // トークン入力欄から値を取得、もしくはURLから自動取得したトークンを使用
    const tokenToUse = data.token && data.token.trim() ? data.token.trim() : token;
    
    if (!tokenToUse) {
      setError("リセットトークンが見つかりません。メールに記載されたコードを入力してください。");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await apiRequest("POST", "/api/auth/password-reset", {
        token: tokenToUse,
        newPassword: data.password
      });
      
      setIsSuccess(true);
      toast({
        title: "パスワードリセット完了",
        description: "パスワードが正常にリセットされました。新しいパスワードでログインしてください。",
      });
      
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        setLocation("/login");
      }, 3000);
    } catch (error: any) {
      console.error("パスワードリセットエラー:", error);
      let errorMessage = "パスワードのリセットに失敗しました。";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">新しいパスワードを設定</CardTitle>
          <CardDescription className="text-center">
            新しいパスワードを入力して、アカウントへのアクセスを復元してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {isSuccess ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                パスワードが正常にリセットされました。まもなくログインページに移動します...
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新しいパスワード</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="6文字以上" 
                          {...field} 
                          type="password"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード（確認）</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="パスワードを再入力" 
                          {...field} 
                          type="password"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !token}
                >
                  {isSubmitting ? "処理中..." : "パスワードをリセット"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-center">
            <Link href="/login" className="text-primary hover:underline">
              ログインページに戻る
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}