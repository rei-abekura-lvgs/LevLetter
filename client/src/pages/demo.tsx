import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { BearLogo } from "../components/bear-logo";
import { Link } from "wouter";
import { Heart, MessageCircle, ArrowLeft, Star, TrendingUp, Users, Target } from "lucide-react";

export default function Demo() {
  const [likedCards, setLikedCards] = useState<Set<number>>(new Set());

  // デモ用のサンプルデータ
  const demoUser = {
    name: "デモユーザー",
    email: "demo@example.com",
    department: "営業部",
    weeklyPoints: 450,
    avatarColor: "#3990EA"
  };

  const demoCards = [
    {
      id: 1,
      senderName: "田中マネージャー",
      senderDepartment: "営業部",
      recipientName: "佐藤さん",
      recipientDepartment: "マーケティング部",
      message: "新商品のプレゼン資料、とても分かりやすかったです！お客様への説明がスムーズに進みました。ありがとうございました！",
      category: "感謝",
      likes: 12,
      createdAt: "2024-05-27",
      senderColor: "#FF6B6B",
      recipientColor: "#4ECDC4"
    },
    {
      id: 2,
      senderName: "山田リーダー",
      senderDepartment: "開発部",
      recipientName: "鈴木さん",
      recipientDepartment: "品質管理部",
      message: "バグの発見と詳細な報告書をありがとうございました。迅速な対応のおかげで、リリース前に修正できました。",
      category: "協力",
      likes: 8,
      createdAt: "2024-05-26", 
      senderColor: "#95E1D3",
      recipientColor: "#F8B500"
    },
    {
      id: 3,
      senderName: "高橋部長",
      senderDepartment: "人事部",
      recipientName: "営業チーム",
      recipientDepartment: "営業部",
      message: "今月の売上目標達成、お疲れ様でした！チーム一丸となって取り組む姿勢が素晴らしいです。",
      category: "称賛",
      likes: 25,
      createdAt: "2024-05-25",
      senderColor: "#A8E6CF",
      recipientColor: "#FFB6C1"
    },
    {
      id: 4,
      senderName: "伊藤さん",
      senderDepartment: "総務部",
      recipientName: "新入社員の皆さん",
      recipientDepartment: "全部署",
      message: "研修期間中の積極的な質問や取り組み姿勢が印象的でした。これからの活躍を楽しみにしています！",
      category: "激励",
      likes: 18,
      createdAt: "2024-05-24",
      senderColor: "#DDA0DD",
      recipientColor: "#98FB98"
    }
  ];

  const handleLike = (cardId: number) => {
    setLikedCards(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(cardId)) {
        newLiked.delete(cardId);
      } else {
        newLiked.add(cardId);
      }
      return newLiked;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* デモ専用ヘッダー */}
      <header className="bg-white border-b border-gray-200 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/landing">
                <Button variant="outline" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>ランディングページに戻る</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BearLogo size={32} />
                <span className="text-2xl font-bold text-gray-900">LevLetter</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">デモ版</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{demoUser.name}</p>
                <p className="text-xs text-gray-500">{demoUser.department}</p>
              </div>
              <Avatar>
                <AvatarFallback style={{ backgroundColor: demoUser.avatarColor, color: 'white' }}>
                  デ
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {/* デモ説明バナー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg font-semibold mb-2">🎉 LevLetterデモ版へようこそ！</h2>
          <p className="text-sm opacity-90">
            このページでは実際のシステムの雰囲気を体験できます。カードにいいねを押したり、機能を確認してみてください。
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* サイドバー - 統計情報 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-[#3990EA]" />
                  今週のポイント
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#3990EA] mb-2">{demoUser.weeklyPoints}</div>
                <p className="text-sm text-gray-600">残り50pt / 500pt</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  今月の実績
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">送信したカード</span>
                  <span className="font-semibold">15枚</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">受信したカード</span>
                  <span className="font-semibold">12枚</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">いいね数</span>
                  <span className="font-semibold">68</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  部署ランキング
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">営業部</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-semibold">1位</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">開発部</span>
                  <span className="text-sm font-semibold">2位</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">マーケティング部</span>
                  <span className="text-sm font-semibold">3位</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メインエリア - カード一覧 */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">フィードバックカード</h1>
              <Button className="bg-[#3990EA] hover:bg-[#2563EB]">
                <MessageCircle className="h-4 w-4 mr-2" />
                カードを送る
              </Button>
            </div>

            <div className="space-y-6">
              {demoCards.map((card) => (
                <Card key={card.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback style={{ backgroundColor: card.senderColor, color: 'white' }}>
                            {card.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{card.senderName}</p>
                          <p className="text-sm text-gray-500">{card.senderDepartment}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">{card.category}</Badge>
                        <p className="text-sm text-gray-500">{card.createdAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-gray-600">→</span>
                      <Avatar size="sm">
                        <AvatarFallback style={{ backgroundColor: card.recipientColor, color: 'white' }}>
                          {card.recipientName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-gray-900">{card.recipientName}</span>
                        <span className="text-sm text-gray-500 ml-2">{card.recipientDepartment}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 leading-relaxed">{card.message}</p>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleLike(card.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          likedCards.has(card.id)
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            likedCards.has(card.id) ? 'fill-current' : ''
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {card.likes + (likedCards.has(card.id) ? 1 : 0)}
                        </span>
                      </button>
                      <div className="text-xs text-gray-400">
                        デモデータです
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* お問い合わせCTA */}
            <Card className="mt-8 bg-gradient-to-r from-[#3990EA] to-[#2563EB] text-white">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">デモ体験はいかがでしたか？</h3>
                <p className="mb-4 opacity-90">
                  実際のシステムをご利用いただくには、お問い合わせください。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/contact">
                    <Button variant="secondary" className="bg-white text-[#3990EA] hover:bg-gray-50">
                      お問い合わせ・導入相談
                    </Button>
                  </Link>
                  <Link href="/landing">
                    <Button variant="outline" className="border-white text-white hover:bg-white/10">
                      詳細を見る
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}