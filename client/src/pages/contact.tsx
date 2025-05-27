import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BearLogo } from "../components/bear-logo";
import { Link } from "wouter";
import { ArrowLeft, Send, Mail, Phone, Building } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    employeeCount: "",
    inquiryType: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // フォーム送信のシミュレーション
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "お問い合わせありがとうございます",
        description: "担当者より3営業日以内にご連絡いたします。",
      });

      // フォームリセット
      setFormData({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        employeeCount: "",
        inquiryType: "",
        message: ""
      });
    } catch (error) {
      toast({
        title: "送信に失敗しました",
        description: "しばらく時間をおいて再度お試しください。",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/landing">
              <div className="flex items-center space-x-2 cursor-pointer">
                <BearLogo />
                <span className="text-2xl font-bold text-gray-900">LevLetter</span>
              </div>
            </Link>
            <Link href="/landing">
              <Button variant="outline" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>ホームに戻る</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">お問い合わせ</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            LevLetterについてのご質問やお見積りなど、お気軽にお問い合わせください。
            担当者より3営業日以内にご連絡いたします。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* お問い合わせフォーム */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-[#3990EA]" />
                  <span>お問い合わせフォーム</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="companyName">会社名 *</Label>
                      <Input
                        id="companyName"
                        required
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        placeholder="株式会社◯◯"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactName">ご担当者名 *</Label>
                      <Input
                        id="contactName"
                        required
                        value={formData.contactName}
                        onChange={(e) => handleInputChange("contactName", e.target.value)}
                        placeholder="山田 太郎"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">メールアドレス *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="example@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">電話番号</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="03-1234-5678"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employeeCount">従業員規模</Label>
                      <Select onValueChange={(value) => handleInputChange("employeeCount", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10名</SelectItem>
                          <SelectItem value="11-50">11-50名</SelectItem>
                          <SelectItem value="51-100">51-100名</SelectItem>
                          <SelectItem value="101-500">101-500名</SelectItem>
                          <SelectItem value="501-1000">501-1,000名</SelectItem>
                          <SelectItem value="1001+">1,001名以上</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="inquiryType">お問い合わせ種別 *</Label>
                      <Select onValueChange={(value) => handleInputChange("inquiryType", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">無料トライアルについて</SelectItem>
                          <SelectItem value="pricing">料金プランについて</SelectItem>
                          <SelectItem value="features">機能について</SelectItem>
                          <SelectItem value="implementation">導入について</SelectItem>
                          <SelectItem value="demo">デモのご依頼</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">お問い合わせ内容 *</Label>
                    <Textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="LevLetterについてお聞きしたいことや、ご要望などをご記入ください。"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#3990EA] hover:bg-[#2563EB] text-white py-3"
                  >
                    {isSubmitting ? "送信中..." : "お問い合わせを送信"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー情報 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-[#3990EA]" />
                  <span>直接連絡</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">メール</Label>
                  <p className="text-gray-900">rei.abekura@leverages.jp</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">電話</Label>
                  <p className="text-gray-900">03-5774-1632</p>
                  <p className="text-sm text-gray-500">受付時間: 平日 9:00-18:00</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-[#3990EA]" />
                  <span>会社情報</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">株式会社レバレジーズ</p>
                  <p className="text-sm text-gray-600">
                    〒150-6190<br />
                    東京都渋谷区渋谷2-24-12<br />
                    渋谷スクランブルスクエア東棟24,25階
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#3990EA] text-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">30日間無料トライアル</h3>
                <p className="text-sm opacity-90 mb-4">
                  まずは無料でLevLetterの効果を実感してみませんか？
                </p>
                <Link href="/trial">
                  <Button variant="secondary" className="w-full bg-white text-[#3990EA] hover:bg-gray-50">
                    30日間無料トライアルの開始
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}