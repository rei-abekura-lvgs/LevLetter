import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// パスワードリセットリクエストフォームのスキーマ
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: "メールアドレスを入力してください" })
    .email({ message: "有効なメールアドレスを入力してください" })
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // フォームの初期化
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  // フォーム送信ハンドラ
  async function onSubmit(data: ForgotPasswordFormValues) {
    try {
      setIsSubmitting(true);
      
      await apiRequest("POST", "/api/auth/password-reset-request", data);
      
      setIsSuccess(true);
      toast({
        title: "メール送信完了",
        description: "パスワードリセット用のメールを送信しました。メールをご確認ください。",
      });
    } catch (error) {
      console.error("パスワードリセットリクエストエラー:", error);
      toast({
        title: "エラー",
        description: "パスワードリセットメールの送信に失敗しました。後ほど再試行してください。",
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
          <CardTitle className="text-2xl font-bold text-center">パスワードをお忘れですか？</CardTitle>
          <CardDescription className="text-center">
            登録したメールアドレスを入力してください。
            パスワードリセット用のリンクをお送りします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                パスワードリセット用のメールを送信しました。メールをご確認の上、記載されているリンクからパスワードのリセットを行ってください。
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="your-email@example.com" 
                          {...field} 
                          type="email"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "送信中..." : "パスワードリセットリンクを送信"}
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