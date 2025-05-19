import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { registerSchema } from "@shared/schema";
import { register as registerUser } from "@/lib/auth";
import { getDepartments } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// バリデーションルールを拡張
const extendedRegisterSchema = registerSchema.extend({
  // フロント側でのみ検証するフィールド - APIには送信しない
  confirmPassword: z.string().min(6, { message: "パスワードは6文字以上で入力してください" })
}).refine(data => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof extendedRegisterSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    // 部署一覧を取得
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("部署一覧取得エラー:", error);
        toast({
          title: "エラー",
          description: "部署情報の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    fetchDepartments();
  }, [toast]);

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
      // 確認用のパスワードを除外し、新しいオブジェクトを作成
      const registerData = {
        email: data.email,
        name: data.name,
        password: data.password,
        department: data.department || "未設定"
      };
      
      console.log("送信データ:", registerData); // デバッグ用
      const response = await registerUser(registerData);
      
      console.log("登録成功レスポンス:", response);
      
      // ユーザーコンテキストを更新
      setUser(response.user);
      
      // 成功メッセージを表示
      toast({
        title: "登録成功",
        description: "LevLetterへようこそ！",
      });
      
      // SPAルーティングを使用して画面遷移
      console.log("ホーム画面への遷移を実行します");
      setLocation("/");
    } catch (error) {
      console.error("登録エラー:", error);
      // エラーの詳細情報を表示
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
          <Label htmlFor="department">部署</Label>
          <Select 
            onValueChange={(value) => form.setValue("department", value)}
            defaultValue={form.getValues("department")}
          >
            <SelectTrigger>
              <SelectValue placeholder="部署を選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>部署一覧</SelectLabel>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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