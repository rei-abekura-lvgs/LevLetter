import { BearLogo } from "../components/bear-logo";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Heart, TrendingUp, Users, Star, CheckCircle, AlertTriangle, Shield, Eye, Building, Target, TrendingDown, Lightbulb, MessageSquare } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <BearLogo />
              <span className="text-2xl font-bold text-gray-900">LevLetter</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="border-[#3990EA] text-[#3990EA] hover:bg-[#3990EA] hover:text-white">
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
              組織の可能性を最大化する<br />
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
              <span className="text-[#3990EA]">包括的フィードバック文化醸成</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              単なる感謝カード送信ツールを超えた、組織全体のコミュニケーション変革プラットフォーム
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-[#3990EA]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">リアルタイム感謝カード</h3>
                <p className="text-gray-600 leading-relaxed">
                  日々の小さな貢献から大きな成果まで、瞬時に感謝の気持ちを伝え、
                  ポジティブな組織文化を醸成します。
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">360度フィードバック</h3>
                <p className="text-gray-600 leading-relaxed">
                  上司、同僚、部下からの多角的なフィードバックにより、
                  バランスの取れた自己認識と成長機会を提供します。
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
              <CardContent className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">データドリブン分析</h3>
                <p className="text-gray-600 leading-relaxed">
                  フィードバックパターンの分析により、組織の健康状態を可視化し、
                  効果的な改善策を提案します。
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                  組織変革の第一歩を<br />
                  <span className="text-[#3990EA]">今すぐ始めませんか？</span>
                </h3>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">30日間無料トライアル</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">専任サポートによる導入支援</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">カスタマイズ可能な組織設定</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">詳細な効果測定レポート</span>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed mb-6">
                  フィードバック文化の醸成は、一朝一夕には実現できません。
                  しかし、適切なツールとサポートがあれば、確実に組織は変わります。
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

      {/* ポジティブフィードバックの重要性セクション */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              <span className="text-[#3990EA]">ポジティブフィードバック</span>が<br />
              組織に与える科学的効果
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              心理学研究で実証されたフィードバックの力を、あなたの組織でも活用できます
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl mb-12">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">ポジティブフィードバックとは</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-[#3990EA] p-6 rounded-lg mb-8">
                <p className="text-gray-700 font-medium mb-3 text-lg">
                  相手の行動や成果に対して前向きな評価や称賛を伝えること
                </p>
                <p className="text-gray-600 text-lg">
                  相手の強みや貢献に注目して、ポジティブなメッセージを伝える
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-xl font-bold text-green-800 mb-4">好ましい行動の強化</h4>
                  <p className="text-green-700 mb-3">例：「今回"も"期限厳守で素晴らしい！」</p>
                  <p className="text-green-600 text-sm">いつも期限を守る相手に、今後も守り続けてほしいから</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="text-xl font-bold text-blue-800 mb-4">好ましい行動への転換</h4>
                  <p className="text-blue-700 mb-3">例：「今回"は"期限厳守で素晴らしい！」</p>
                  <p className="text-blue-600 text-sm">期限を守れない相手に、期限厳守に変わってほしいから</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 md:p-12 border border-purple-200">
              <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">ピグマリオン効果の活用</h3>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="text-center">
                  <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-lg">期待</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">他者からの期待</h4>
                  <p className="text-gray-600 text-sm">学習成績が向上し、仕事での成果が上がる心理効果</p>
                </div>
                <ArrowRight className="h-8 w-8 text-[#3990EA] transform md:rotate-0 rotate-90" />
                <div className="text-center">
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">成長</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">継続的な成長</h4>
                  <p className="text-gray-600 text-sm">期待に応えようとする意欲が成長を促進</p>
                </div>
              </div>
            </div>

            <div className="text-center bg-white rounded-2xl p-8 shadow-lg mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                現在 <span className="text-[#3990EA]">3,000人以上</span> のユーザーが活用中
              </h3>
              <p className="text-gray-600">
                様々な業界・規模の組織でフィードバック文化の醸成を実現
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* フィードバック文化醸成の効果セクション */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              フィードバック文化が<br />
              <span className="text-[#3990EA]">組織にもたらす変化</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              組織心理学の理論により実証された、フィードバック文化醸成による組織変革の効果
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border border-green-200">
              <div className="flex items-center mb-6">
                <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">個人の成長加速</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">自己認識の向上</h4>
                  <p className="text-gray-700 text-sm">
                    継続的なフィードバックにより、自分の強みと改善点を正確に把握できるようになる
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">スキル開発の促進</h4>
                  <p className="text-gray-700 text-sm">
                    具体的な改善提案により、効率的なスキルアップが可能になる
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">モチベーション向上</h4>
                  <p className="text-gray-700 text-sm">
                    ポジティブフィードバックにより、仕事への意欲と自信が高まる
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">組織連携の強化</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">相互理解の促進</h4>
                  <p className="text-gray-700 text-sm">
                    相手の立場や考えを理解しようとする姿勢が組織全体に浸透
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">心理的安全性の向上</h4>
                  <p className="text-gray-700 text-sm">
                    建設的な意見交換ができる環境により、チーム内の信頼関係が強化
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2">セクショナリズムの解消</h4>
                  <p className="text-gray-700 text-sm">
                    部署間の壁を越えた協力体制が自然に形成される
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                フィードバック文化醸成による期待効果
              </h3>
              <p className="text-gray-700">
                組織心理学の理論に基づく、フィードバック文化が組織にもたらす変化
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-700 font-medium mb-2">エンゲージメント向上</p>
                <p className="text-gray-600 text-sm">ポジティブフィードバックによる意欲向上</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-700 font-medium mb-2">離職率減少</p>
                <p className="text-gray-600 text-sm">心理的安全性の向上効果</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-700 font-medium mb-2">生産性向上</p>
                <p className="text-gray-600 text-sm">組織連携の強化による効果</p>
              </div>
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-gray-700 font-medium mb-2">イノベーション創出</p>
                <p className="text-gray-600 text-sm">アイデア提案の活性化</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* チャットボットセクション（デモ用） */}
      <section className="py-16 bg-gradient-to-br from-[#3990EA] to-[#2563EB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              AIアシスタントに<br />
              <span className="text-yellow-300">フィードバック文化</span>について質問してみませんか？
            </h2>
            <p className="text-xl opacity-90">
              LevLetterに関するご質問や、フィードバック文化の醸成についてお気軽にお聞きください
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <div className="space-y-4">
              {/* チャットボット画面 */}
              <div className="bg-gray-50 rounded-lg p-4 min-h-[300px] flex flex-col">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[#3990EA] w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-gray-800">
                        こんにちは！LevLetterのAIアシスタントです。<br />
                        フィードバック文化の醸成や組織改善について、どのようなことでもお気軽にご質問ください！
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 入力エリア */}
                <div className="mt-4 flex space-x-2">
                  <input
                    type="text"
                    placeholder="フィードバック文化について質問してください..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3990EA] text-gray-800"
                    disabled
                  />
                  <button
                    className="bg-[#3990EA] text-white px-6 py-2 rounded-lg hover:bg-[#2563EB] transition-colors disabled:opacity-50"
                    disabled
                  >
                    送信
                  </button>
                </div>
              </div>
              
              {/* サンプル質問 */}
              <div className="text-center">
                <p className="text-gray-600 mb-3">よくある質問：</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors" disabled>
                    フィードバック文化のメリットは？
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors" disabled>
                    導入にはどのくらい期間がかかる？
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition-colors" disabled>
                    料金プランを教えて
                  </button>
                </div>
                <p className="text-gray-500 text-sm mt-4">
                  ※ これはデモ画面です。実際のチャットボット機能は製品版でご利用いただけます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-16 bg-gradient-to-br from-[#3990EA] to-[#2563EB] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            今すぐフィードバック文化の醸成を始めませんか？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            30日間無料でLevLetterの全機能をお試しいただけます
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
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <BearLogo />
                <span className="text-2xl font-bold">LevLetter</span>
              </div>
              <p className="text-gray-400">
                フィードバック文化で組織を変革する次世代プラットフォーム
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">製品</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">機能紹介</a></li>
                <li><a href="#" className="hover:text-white transition-colors">料金プラン</a></li>
                <li><a href="#" className="hover:text-white transition-colors">導入事例</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">よくある質問</a></li>
                <li><a href="#" className="hover:text-white transition-colors">ヘルプセンター</a></li>
                <li><a href="#" className="hover:text-white transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">会社情報</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">私たちについて</a></li>
                <li><a href="#" className="hover:text-white transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" className="hover:text-white transition-colors">利用規約</a></li>
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