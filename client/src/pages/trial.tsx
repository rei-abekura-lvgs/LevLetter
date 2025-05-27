import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { BearLogo } from "@/components/bear-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Users, Calendar, Settings, Mail, Phone, MessageCircle } from "lucide-react";

const trialSchema = z.object({
  companyName: z.string().min(1, "会社名を入力してください"),
  contactName: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
  employeeCount: z.string().min(1, "従業員数を選択してください"),
  department: z.string().optional(),
  currentTool: z.string().optional(),
  requirements: z.string().optional(),
});

type TrialFormValues = z.infer<typeof trialSchema>;

const employeeCountOptions = [
  { value: "1-10", label: "1-10名" },
  { value: "11-50", label: "11-50名" },
  { value: "51-100", label: "51-100名" },
  { value: "101-300", label: "101-300名" },
  { value: "301-1000", label: "301-1000名" },
  { value: "1000+", label: "1000名以上" },
];

export default function Trial() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TrialFormValues>({
    resolver: zodResolver(trialSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      employeeCount: "",
      department: "",
      currentTool: "",
      requirements: "",
    },
  });

  const onSubmit = async (data: TrialFormValues) => {
    setIsSubmitting(true);
    try {
      // トライアル申し込み処理（実際のAPIエンドポイントに送信）
      console.log("トライアル申し込みデータ:", data);
      
      toast({
        title: "お申し込みありがとうございます！",
        description: "担当者より3営業日以内にご連絡いたします。デモ環境の準備を開始いたします。",
      });
      
      // フォームをリセット
      form.reset();
    } catch (error) {
      toast({
        title: "エラー",
        description: "申し込みの送信に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/contact">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <BearLogo size={40} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">LevLetter</h1>
              <p className="text-sm text-gray-600">30日間無料トライアル</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              30日間無料トライアル
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              LevLetterを実際にお試しいただけます。導入支援から運用サポートまで、
              専任担当者が丁寧にサポートいたします。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* トライアル特典 */}
            <div className="lg:col-span-1">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    トライアル特典
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">30日間完全無料</h4>
                      <p className="text-sm text-gray-600">すべての機能をお試しいただけます</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">専任サポート</h4>
                      <p className="text-sm text-gray-600">導入から運用まで専門スタッフがサポート</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">カスタマイズ対応</h4>
                      <p className="text-sm text-gray-600">企業様のニーズに合わせた設定</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">データ移行支援</h4>
                      <p className="text-sm text-gray-600">既存システムからのスムーズな移行</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    お急ぎの方
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">お電話でのお問い合わせ</p>
                    <a 
                      href="tel:03-5774-1632" 
                      className="block text-lg font-medium text-blue-600 hover:text-blue-700"
                    >
                      03-5774-1632
                    </a>
                    <p className="text-xs text-gray-500">平日 9:00-18:00</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 申し込みフォーム */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>トライアル申し込み</CardTitle>
                  <CardDescription>
                    必要事項をご入力ください。担当者より3営業日以内にご連絡いたします。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">会社名 *</Label>
                        <Input
                          id="companyName"
                          {...form.register("companyName")}
                          placeholder="株式会社○○"
                        />
                        {form.formState.errors.companyName && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.companyName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactName">ご担当者名 *</Label>
                        <Input
                          id="contactName"
                          {...form.register("contactName")}
                          placeholder="山田 太郎"
                        />
                        {form.formState.errors.contactName && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.contactName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">メールアドレス *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
                          placeholder="example@company.co.jp"
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">電話番号 *</Label>
                        <Input
                          id="phone"
                          {...form.register("phone")}
                          placeholder="03-1234-5678"
                        />
                        {form.formState.errors.phone && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="employeeCount">従業員数 *</Label>
                        <Select
                          value={form.watch("employeeCount")}
                          onValueChange={(value) => form.setValue("employeeCount", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeCountOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.employeeCount && (
                          <p className="text-sm text-red-600">
                            {form.formState.errors.employeeCount.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">部署名</Label>
                        <Input
                          id="department"
                          {...form.register("department")}
                          placeholder="人事部"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentTool">現在利用中のツール</Label>
                      <Input
                        id="currentTool"
                        {...form.register("currentTool")}
                        placeholder="Slack、Teams、社内独自システム等"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requirements">ご要望・ご質問</Label>
                      <Textarea
                        id="requirements"
                        {...form.register("requirements")}
                        placeholder="導入時期、カスタマイズのご要望、ご質問等がございましたらお聞かせください"
                        rows={4}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "送信中..." : "30日間無料トライアルを申し込む"}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      ご入力いただいた情報は、お客様へのご連絡以外の目的では使用いたしません。
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}