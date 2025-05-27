import { BearLogo } from "../components/bear-logo";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Heart, TrendingUp, Users, Star, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BearLogo size={40} useTransparent={true} bgColor="bg-[#3990EA]" />
              <span className="text-xl font-bold text-gray-900">LevLetter</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-[#3990EA]">
                  ログイン
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-[#3990EA] hover:bg-[#2563EB] text-white">
                  無料で始める
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-[#3990EA] to-[#2563EB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              企業の<span className="text-yellow-300">フィードバック文化</span>を<br />
              革新する
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              LevLetterで、建設的なフィードバックが飛び交う組織を実現し、<br />
              個人の成長と組織の継続的改善を促進します
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-4 text-lg">
                  無料トライアル開始
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#3990EA] px-8 py-4 text-lg">
                お問い合わせ
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              フィードバック文化不足の課題を解決
            </h2>
            <p className="text-xl text-gray-600">
              組織の成長を阻害する根本的な問題に対処する4つの特徴
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="bg-[#3990EA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">建設的フィードバック</h3>
                <p className="text-gray-600">
                  成長につながる具体的なフィードバックを簡単に送信。自己認識のズレを解消します。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="bg-[#3990EA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">継続的改善</h3>
                <p className="text-gray-600">
                  フィードバックを受け入れ改善していく文化を醸成し、組織の成長を促進します。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="bg-[#3990EA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">相互理解促進</h3>
                <p className="text-gray-600">
                  相手を理解しようとする姿勢を育み、セクショナリズムを防止します。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="bg-[#3990EA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">適切な意見表明</h3>
                <p className="text-gray-600">
                  言うべきことを言える組織風土を構築し、組織の健全性を保ちます。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 導入効果セクション */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                フィードバック文化の構築で<br />
                <span className="text-[#3990EA]">組織力</span>が劇的に向上
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg">成長機会の創出</h4>
                    <p className="text-gray-600">個人の成長鈍化を解消し、自己認識のズレを修正</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg">組織風土の改善</h4>
                    <p className="text-gray-600">言うべきことを言える文化で、健全な組織運営を実現</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg">連携力の強化</h4>
                    <p className="text-gray-600">相互理解の促進でセクショナリズムを防止</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#3990EA] to-[#2563EB] rounded-2xl p-8 text-white">
              <div className="text-center">
                <div className="mx-auto mb-6">
                  <BearLogo size={80} useTransparent={true} bgColor="bg-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4">今すぐ無料で体験</h3>
                <p className="mb-6 opacity-90">
                  設定は5分で完了。<br />
                  30日間すべての機能を無料でお試しいただけます。
                </p>
                <Link href="/login">
                  <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold w-full">
                    無料トライアル開始
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 導入実績セクション */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            様々な業界・規模の企業で導入実績
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold text-[#3990EA] mb-2">500+</div>
              <div className="text-gray-600">導入企業数</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold text-[#3990EA] mb-2">50,000+</div>
              <div className="text-gray-600">利用ユーザー数</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="text-3xl font-bold text-[#3990EA] mb-2">1M+</div>
              <div className="text-gray-600">送信された感謝カード</div>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            IT企業 / 製造業 / 金融業 / 医療・介護 / 教育機関 / 小売業など<br />
            あらゆる業界で組織改善を実現
          </p>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 bg-gradient-to-br from-[#3990EA] to-[#2563EB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            今すぐフィードバック文化を始めませんか？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            LevLetterで、建設的なフィードバックが飛び交う組織を実現し、<br />
            次代を創る企業への成長を加速させましょう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-4 text-lg">
                30日間無料トライアル
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#3990EA] px-8 py-4 text-lg">
              お問い合わせ
            </Button>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BearLogo size={32} useTransparent={true} bgColor="bg-[#3990EA]" />
                <span className="text-lg font-bold">LevLetter</span>
              </div>
              <p className="text-gray-400">
                企業の感謝文化を育む<br />
                組織改善プラットフォーム
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-gray-400">
                <li>機能一覧</li>
                <li>料金プラン</li>
                <li>導入事例</li>
                <li>サポート</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">企業情報</h4>
              <ul className="space-y-2 text-gray-400">
                <li>会社概要</li>
                <li>お知らせ</li>
                <li>採用情報</li>
                <li>お問い合わせ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">リソース</h4>
              <ul className="space-y-2 text-gray-400">
                <li>ヘルプセンター</li>
                <li>プライバシーポリシー</li>
                <li>利用規約</li>
                <li>セキュリティ</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LevLetter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}