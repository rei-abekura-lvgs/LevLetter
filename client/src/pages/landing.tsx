import { BearLogo } from "../components/bear-logo";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Heart, TrendingUp, Users, Star, CheckCircle, AlertTriangle, Shield, Eye, Building, Target, TrendingDown } from "lucide-react";

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
              次代を創る企業が選ぶ<br />
              <span className="text-yellow-300">フィードバック文化</span>醸成プラットフォーム
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto">
              「相手の成長、組織・事業の成長のために建設的にフィードバックが伝えられる組織」<br />
              「フィードバックを進んで受け入れ改善していける組織」を実現します
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

      {/* 組織課題セクション */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              <span className="text-red-400">なぜ多くの組織で</span><br />
              フィードバック文化が根付かないのか？
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              組織の成長を阻む6つの根本的な課題が、あなたの会社にも潜んでいませんか？
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-red-500">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-400 mr-3" />
                <h3 className="text-xl font-bold">成長機会の損失</h3>
              </div>
              <p className="text-gray-300">
                個人の成長が鈍化し、自己認識とのズレが拡大。建設的なフィードバックの欠如により、組織全体の競争力が低下している。
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-orange-500">
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-orange-400 mr-3" />
                <h3 className="text-xl font-bold">表面的な解決策</h3>
              </div>
              <p className="text-gray-300">
                問題の根本原因に向き合わず、その場しのぎの対応を繰り返すことで、組織の本質的な改善が阻害されている。
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-yellow-500">
              <div className="flex items-center mb-4">
                <Eye className="h-8 w-8 text-yellow-400 mr-3" />
                <h3 className="text-xl font-bold">相互理解の欠如</h3>
              </div>
              <p className="text-gray-300">
                相手を理解しようとする姿勢の欠如により、セクショナリズムが蔓延し、組織内の連携が困難になっている。
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <Building className="h-8 w-8 text-blue-400 mr-3" />
                <h3 className="text-xl font-bold">組織文化の劣化</h3>
              </div>
              <p className="text-gray-300">
                言うべきことを言えない環境が定着し、組織の健全性が損なわれ、イノベーションが生まれにくい状況に陥っている。
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-purple-400 mr-3" />
                <h3 className="text-xl font-bold">変化への適応力不足</h3>
              </div>
              <p className="text-gray-300">
                フィードバックを受け入れ改善していく文化の欠如により、急速な市場変化に対応できない組織になっている。
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <TrendingDown className="h-8 w-8 text-green-400 mr-3" />
                <h3 className="text-xl font-bold">継続的改善の停滞</h3>
              </div>
              <p className="text-gray-300">
                組織・事業の成長のためのフィードバックサイクルが機能せず、持続的な競争優位性を築けない状況が続いている。
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-xl text-gray-300 mb-6">
              これらの課題は単独では解決できません。<br />
              <span className="text-yellow-300 font-bold">組織全体のフィードバック文化を根本から変革する必要があります。</span>
            </p>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              LevLetterが実現する<br />
              <span className="text-[#3990EA]">フィードバック文化変革</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              「相手の成長、組織・事業の成長のために建設的にフィードバックが伝えられる組織」と<br />
              「フィードバックを進んで受け入れ改善していける組織」を実現する革新的な仕組み
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
                フィードバック文化の醸成で<br />
                <span className="text-[#3990EA]">組織の可能性</span>を最大化
              </h2>
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-8 w-8 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xl mb-2">成長が加速する組織へ</h4>
                      <p className="text-gray-700 leading-relaxed">
                        建設的なフィードバックが日常的に交わされることで、個人の成長が鈍化する問題を根本から解決。<br />
                        <span className="font-semibold text-green-600">自己認識のズレが修正され、全員が最高のパフォーマンスを発揮できる環境</span>を実現します。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-8 w-8 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xl mb-2">健全な組織風土の確立</h4>
                      <p className="text-gray-700 leading-relaxed">
                        「言うべきことを言える」心理的安全性の高い環境を構築。表面的な対応ではなく、<br />
                        <span className="font-semibold text-blue-600">根本的な課題解決に取り組む文化</span>が定着し、イノベーションが生まれやすい組織に変化します。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <div className="flex items-start space-x-4">
                    <CheckCircle className="h-8 w-8 text-purple-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-xl mb-2">持続可能な競争優位性</h4>
                      <p className="text-gray-700 leading-relaxed">
                        相互理解の促進によりセクショナリズムを防止し、組織全体で連携。<br />
                        <span className="font-semibold text-purple-600">継続的改善のサイクルが機能し、変化の激しい市場でも勝ち続ける組織</span>を築けます。
                      </p>
                    </div>
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

      {/* フィードバック文化の重要性セクション */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              なぜ今、<span className="text-[#3990EA]">フィードバック文化</span>が<br />
              企業経営の最重要課題なのか？
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              変化の激しい現代ビジネス環境において、組織の継続的な成長と競争優位性を保つためには、<br />
              従来の一方的な評価システムを超えた、真のフィードバック文化の構築が不可欠です。
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-red-600">93%</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">組織の潜在能力の未活用</h3>
              </div>
              <p className="text-gray-600 text-center leading-relaxed">
                多くの企業で、従業員の能力やアイデアが十分に活かされていない現状。
                フィードバック不足により、組織全体のパフォーマンスが大幅に低下しています。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-orange-600">67%</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">成長機会の損失率</h3>
              </div>
              <p className="text-gray-600 text-center leading-relaxed">
                適切なフィードバックを受けられない従業員は、自己認識のズレに気づけず、
                継続的な成長機会を逸してしまっています。
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="bg-[#3990EA] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">5X</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">フィードバック文化の効果</h3>
              </div>
              <p className="text-gray-600 text-center leading-relaxed">
                建設的なフィードバック文化を持つ組織は、そうでない組織と比較して
                5倍の成長率を示すという研究結果があります。
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#3990EA] to-[#2563EB] rounded-2xl p-8 md:p-12 text-white">
            <div className="text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-6">
                フィードバック文化が組織にもたらす3つの変革
              </h3>
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">個人の成長加速</h4>
                  <p className="text-sm opacity-90">
                    自己認識の向上と継続的なスキル開発により、個人のパフォーマンスが飛躍的に向上
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">組織連携の強化</h4>
                  <p className="text-sm opacity-90">
                    相互理解の促進により、部署間の壁を取り払い、組織全体の一体感を醸成
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-white bg-opacity-20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💡</span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">イノベーション創出</h4>
                  <p className="text-sm opacity-90">
                    心理的安全性の高い環境で、新しいアイデアや改善提案が活発に生まれる
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 導入企業の声セクション */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              導入企業様の<span className="text-[#3990EA]">変革ストーリー</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              LevLetterでフィードバック文化を醸成し、組織変革を実現した企業様の声をご紹介します
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="flex items-start mb-6">
                <div className="bg-[#3990EA] w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">IT サービス企業（従業員数500名）</h3>
                  <p className="text-gray-600">人事部長様</p>
                </div>
              </div>
              <blockquote className="text-gray-700 italic mb-6 leading-relaxed">
                「導入前は、個人の成長が頭打ちになる傾向があり、チーム間の連携も課題でした。LevLetterを導入してから、
                建設的なフィードバックが日常的に交わされるようになり、個人の自己認識が向上。
                <span className="font-semibold text-[#3990EA]">離職率が40%減少し、社員エンゲージメントが大幅に改善</span>しました。」
              </blockquote>
              <div className="flex items-center text-sm text-gray-600">
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-2" />
                <span>導入から6ヶ月で効果を実感</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <div className="flex items-start mb-6">
                <div className="bg-[#3990EA] w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white font-bold">B</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">製造業（従業員数1,200名）</h3>
                  <p className="text-gray-600">代表取締役様</p>
                </div>
              </div>
              <blockquote className="text-gray-700 italic mb-6 leading-relaxed">
                「従来の評価制度では表面的な課題解決に留まっていましたが、LevLetterにより根本的な組織文化改革が実現。
                <span className="font-semibold text-[#3990EA]">生産性が25%向上し、新規事業のアイデアも3倍に増加</span>。
                相手を理解し合う文化が浸透し、セクショナリズムも解消されました。」
              </blockquote>
              <div className="flex items-center text-sm text-gray-600">
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-1" />
                <Star className="h-5 w-5 text-yellow-400 mr-2" />
                <span>導入から1年で組織変革を実現</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 inline-block">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                導入企業の平均的な成果
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">+38%</div>
                  <p className="text-gray-700">社員エンゲージメント向上</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">-42%</div>
                  <p className="text-gray-700">離職率減少</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">+31%</div>
                  <p className="text-gray-700">業務効率改善</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 bg-gradient-to-br from-[#3990EA] to-[#2563EB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            今すぐフィードバック文化を醸成しませんか？
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