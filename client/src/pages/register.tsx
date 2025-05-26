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
import { InfoIcon, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

interface GoogleAuthInfo {
  cognitoSub: string;
  email: string;
  name: string;
  familyName?: string;
  picture?: string;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { fetchUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [googleAuthInfo, setGoogleAuthInfo] = useState<GoogleAuthInfo | null>(null);
  const [isGoogleMode, setIsGoogleMode] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(extendedRegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // URLパラメータをチェックしてGoogle認証情報を取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isGoogleAuth = urlParams.get('google') === 'true';
    
    if (isGoogleAuth) {
      setIsGoogleMode(true);
      // Google認証情報を取得
      const fetchGoogleAuthInfo = async () => {
        try {
          const response = await fetch('/api/auth/google-pending');
          if (response.ok) {
            const authInfo = await response.json();
            setGoogleAuthInfo(authInfo);
            // フォームにGoogle情報を自動入力
            form.setValue('email', authInfo.email);
            console.log("✅ Google認証情報を取得:", authInfo);
          } else {
            console.log("❌ Google認証情報が見つかりません");
          }
        } catch (error) {
          console.error("Google認証情報取得エラー:", error);
        }
      };
      
      fetchGoogleAuthInfo();
    }
  }, [form]);

  // メール検証の状態管理
  const [verificationStatus, setVerificationStatus] = useState<{
    canRegister: boolean;
    isRegistered: boolean;
    message: string;
  }>({
    canRegister: false,
    isRegistered: false,
    message: ""
  });
  
  // メールアドレスの検証
  const verifyEmail = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setVerifyingEmail(true);
    try {
      // メールアドレスの検証リクエスト（直接fetchを使用）
      const response = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        throw new Error(`検証エラー: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`メール検証 (${email}) レスポンス:`, data);
      
      // レスポンスに基づいて状態を更新
      setEmailVerified(data.exists === true);
      setVerificationStatus({
        canRegister: data.exists === true,
        isRegistered: data.userExists === true && data.hasPassword === true,
        message: data.message || ""
      });
      
      // 検証結果メッセージをログに出力
      if (data.message) {
        console.log(`メール検証結果: ${data.message}`);
      }
    } catch (error) {
      console.error("メール検証エラー:", error);
      setEmailVerified(false);
      setVerificationStatus({
        canRegister: false,
        isRegistered: false,
        message: "メールアドレスの検証中にエラーが発生しました"
      });
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
    // パスワード設定済みのメールアドレスの場合（既にアカウント作成済み）
    if (verificationStatus.isRegistered) {
      toast({
        title: "既に登録済みです",
        description: "このメールアドレスは既に登録されています。ログイン画面からログインしてください。",
        variant: "destructive",
      });
      return;
    }
    
    // 事前に登録されていないメールアドレスの場合
    if (!verificationStatus.canRegister && !verificationStatus.isRegistered) {
      toast({
        title: "検証エラー",
        description: "このメールアドレスは管理者によって事前登録されていません。",
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
          Googleアカウントでの簡単登録を推奨しています
        </p>
      </div>

      {/* Google認証ボタン（推奨） */}
      <Button
        type="button"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => window.location.href = '/api/auth/google'}
      >
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
        Googleでアカウント作成（推奨）
      </Button>

      {/* メール・パスワード登録展開セクション */}
      <EmailPasswordToggleSection 
        onSubmit={onSubmit}
        form={form}
        verificationStatus={verificationStatus}
        verifyingEmail={verifyingEmail}
        isLoading={isLoading}
      />



      <div className="text-center text-sm">
        すでにアカウントをお持ちですか？{" "}
        <Link href="/login" className="text-primary hover:underline">ログイン</Link>
      </div>
    </div>
  );
}