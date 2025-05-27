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
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3990EA] via-[#2563EB] to-[#1e40af]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent)] pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8 inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <BearLogo size={32} />
              <span className="text-white/90 text-sm font-medium tracking-wide">3,000+ 企業が導入済み</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-8 text-white leading-tight">
              組織の可能性を最大化する<br />
              <span className="text-yellow-300">
                フィードバック文化
              </span>
              <br />醸成プラットフォーム
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-5xl mx-auto leading-relaxed font-light">
              建設的なフィードバックが自然に行き交う組織へ。<br />
              心理学に基づいた科学的アプローチで、<span className="font-semibold text-yellow-200">真の組織変革</span>を実現します。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/login">
                <Button size="lg" className="group bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-bold px-10 py-5 text-lg rounded-xl shadow-2xl hover:shadow-yellow-400/25 transition-all duration-300 transform hover:scale-105">
                  無料トライアル開始
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#3990EA] px-10 py-5 text-lg rounded-xl backdrop-blur-sm bg-white/10 transition-all duration-300 font-semibold">
                お問い合わせ
              </Button>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                  <div className="text-3xl font-bold text-yellow-300 mb-2">30日間</div>
                  <div className="text-white/80">無料トライアル</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                  <div className="text-3xl font-bold text-yellow-300 mb-2">24/7</div>
                  <div className="text-white/80">専任サポート</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 group-hover:bg-white/15 transition-all duration-300">
                  <div className="text-3xl font-bold text-yellow-300 mb-2">100%</div>
                  <div className="text-white/80">カスタマイズ対応</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 装飾的な要素 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
      </section>

      {/* 組織課題セクション */}
      <section className="py-20 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-red-500/10 backdrop-blur-sm rounded-full px-6 py-3 border border-red-500/20 mb-6">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span className="text-red-300 text-sm font-medium">組織の課題</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-red-200 bg-clip-text text-transparent">
              なぜ多くの組織で<br />
              <span className="text-red-400">フィードバック文化が根付かない</span>のか？
            </h2>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              組織の成長を阻む6つの根本的な課題が、あなたの会社にも潜んでいませんか？
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 hover:border-red-500/30 transition-all duration-300 hover:transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="bg-red-500/20 p-3 rounded-full mr-4">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">成長機会の損失</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  個人の成長が鈍化し、自己認識とのズレが拡大。建設的なフィードバックの欠如により、組織全体の競争力が低下している。
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 hover:border-orange-500/30 transition-all duration-300 hover:transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="bg-orange-500/20 p-3 rounded-full mr-4">
                    <Shield className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">表面的な解決策</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  問題の根本原因に向き合わず、その場しのぎの対応を繰り返すことで、組織の本質的な改善が阻害されている。
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 hover:border-yellow-500/30 transition-all duration-300 hover:transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="bg-yellow-500/20 p-3 rounded-full mr-4">
                    <Eye className="h-6 w-6 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">相互理解の欠如</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  相手を理解しようとする姿勢の欠如により、セクショナリズムが蔓延し、組織内の連携が困難になっている。
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-500/20 p-3 rounded-full mr-4">
                    <Building className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">組織文化の劣化</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  言うべきことを言えない環境が定着し、組織の健全性が損なわれ、イノベーションが生まれにくい状況に陥っている。
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-500/20 p-3 rounded-full mr-4">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">変化への適応力不足</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  フィードバックを受け入れ改善していく文化の欠如により、急速な市場変化に対応できない組織になっている。
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 hover:transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center mb-6">
                  <div className="bg-green-500/20 p-3 rounded-full mr-4">
                    <TrendingDown className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">継続的改善の停滞</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  組織・事業の成長のためのフィードバックサイクルが機能せず、持続的な競争優位性を築けない状況が続いている。
                </p>
              </div>
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
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#3990EA] via-purple-500 to-[#3990EA] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-[#3990EA] to-[#2563EB] rounded-2xl p-10 text-white max-w-md backdrop-blur-sm border border-white/10">
                    <div className="text-center mb-8">
                      <div className="bg-white/15 backdrop-blur-sm rounded-full p-4 inline-block mb-4 border border-white/20">
                        <BearLogo size={64} useNewIcon={true} />
                      </div>
                      <h4 className="text-2xl font-bold bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">LevLetterで実現</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full flex-shrink-0"></div>
                        <span className="font-medium">継続的なフィードバック習慣</span>
                      </div>
                      <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full flex-shrink-0"></div>
                        <span className="font-medium">組織全体のエンゲージメント向上</span>
                      </div>
                      <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full flex-shrink-0"></div>
                        <span className="font-medium">データに基づいた改善サイクル</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ポジティブフィードバックの重要性セクション */}
      <section className="py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.05),transparent)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.05),transparent)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-500/20 mb-6">
              <Star className="h-5 w-5 text-blue-500" />
              <span className="text-blue-600 text-sm font-medium">科学的根拠</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              <span className="text-[#3990EA]">ポジティブフィードバック</span>が<br />
              組織に与える科学的効果
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              心理学研究で実証されたフィードバックの力を、あなたの組織でも活用できます
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="relative group mb-16">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-white rounded-2xl p-10 md:p-12 shadow-2xl backdrop-blur-sm border border-gray-100">
                <div className="text-center mb-10">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-6">
                    ポジティブフィードバックとは
                  </h3>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-8 mb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="relative">
                    <p className="text-gray-800 font-semibold mb-4 text-lg">
                      相手の行動や成果に対して前向きな評価や称賛を伝えること
                    </p>
                    <p className="text-gray-700 text-lg">
                      相手の強みや貢献に注目して、ポジティブなメッセージを伝える
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-4 right-4 w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">✓</span>
                    </div>
                    <h4 className="text-2xl font-bold text-green-800 mb-4">好ましい行動の強化</h4>
                    <div className="bg-white/70 rounded-lg p-4 mb-4">
                      <p className="text-green-700 font-medium">例：「今回"も"期限厳守で素晴らしい！」</p>
                    </div>
                    <p className="text-green-600">いつも期限を守る相手に、今後も守り続けてほしいから</p>
                  </div>
                  
                  <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200 hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xl">↗</span>
                    </div>
                    <h4 className="text-2xl font-bold text-blue-800 mb-4">好ましい行動への転換</h4>
                    <div className="bg-white/70 rounded-lg p-4 mb-4">
                      <p className="text-blue-700 font-medium">例：「今回"は"期限厳守で素晴らしい！」</p>
                    </div>
                    <p className="text-blue-600">期限を守れない相手に、期限厳守に変わってほしいから</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative group mb-16">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-10 md:p-12 border border-purple-200 backdrop-blur-sm">
                <div className="text-center mb-10">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-800 to-pink-800 bg-clip-text text-transparent">
                    ピグマリオン効果の活用
                  </h3>
                </div>
                
                <div className="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-12">
                  <div className="text-center group">
                    <div className="relative mb-6">
                      <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-xl">期待</span>
                      </div>
                      <div className="absolute -inset-2 bg-green-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">他者からの期待</h4>
                    <p className="text-gray-600 max-w-xs">学習成績が向上し、仕事での成果が上がる心理効果</p>
                  </div>
                  
                  <div className="flex items-center">
                    <ArrowRight className="h-10 w-10 text-purple-500 transform lg:rotate-0 rotate-90 animate-pulse" />
                  </div>
                  
                  <div className="text-center group">
                    <div className="relative mb-6">
                      <div className="bg-gradient-to-br from-blue-400 to-indigo-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-xl">成長</span>
                      </div>
                      <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">継続的な成長</h4>
                    <p className="text-gray-600 max-w-xs">期待に応えようとする意欲が成長を促進</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3990EA] via-blue-500 to-[#3990EA] rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-[#3990EA]/10 p-3 rounded-full mr-4">
                      <Users className="h-8 w-8 text-[#3990EA]" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                      現在 <span className="bg-gradient-to-r from-[#3990EA] to-blue-600 bg-clip-text text-transparent">3,000人以上</span> のユーザーが活用中
                    </h3>
                  </div>
                  <p className="text-xl text-gray-600">
                    様々な業界・規模の組織でフィードバック文化の醸成を実現
                  </p>
                </div>
              </div>
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