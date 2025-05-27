import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { BearLogo } from "../components/bear-logo";
import { Link } from "wouter";
import { Heart, MessageCircle, ArrowLeft, Plus, Settings, LogOut, Bell, Users, TrendingUp, Filter, Calendar, Gift, Star, Trophy, Clock, Mail, Phone, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";

export default function Demo() {
  const [likedCards, setLikedCards] = useState<Set<number>>(new Set());
  const [cards, setCards] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newCardData, setNewCardData] = useState({
    recipient: "",
    message: "",
    category: ""
  });
  const { toast } = useToast();

  // デモユーザー情報
  const demoUser = {
    name: "デモユーザー",
    department: "営業部",
    points: 450,
    color: "#3990EA"
  };

  // 送信先候補
  const demoUsers = [
    { name: "田中マネージャー", department: "営業部", color: "#FF6B6B" },
    { name: "佐藤さん", department: "マーケティング部", color: "#4ECDC4" },
    { name: "山田リーダー", department: "開発部", color: "#95E1D3" },
    { name: "鈴木さん", department: "品質管理部", color: "#F8B500" },
    { name: "高橋部長", department: "人事部", color: "#A8E6CF" }
  ];

  // 初期カードデータ - より豊富なタイムライン
  useEffect(() => {
    setCards([
      {
        id: 1,
        senderName: "田中マネージャー",
        senderDepartment: "営業部",
        recipientName: "佐藤さん",
        recipientDepartment: "マーケティング部",
        message: "新商品のプレゼン資料、とても分かりやすかったです！お客様への説明がスムーズに進みました。ありがとうございました！",
        category: "感謝",
        likes: 12,
        createdAt: "2024-05-27 14:30",
        senderColor: "#FF6B6B",
        recipientColor: "#4ECDC4",
        type: "received"
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
        createdAt: "2024-05-27 11:15",
        senderColor: "#95E1D3",
        recipientColor: "#F8B500",
        type: "sent"
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
        createdAt: "2024-05-27 09:45",
        senderColor: "#A8E6CF",
        recipientColor: "#FFB6C1",
        type: "received"
      },
      {
        id: 4,
        senderName: "デモ太郎",
        senderDepartment: "営業部",
        recipientName: "田中マネージャー",
        recipientDepartment: "営業部",
        message: "今日の会議での的確なアドバイス、本当に助かりました。プロジェクトが良い方向に進みそうです！",
        category: "感謝",
        likes: 6,
        createdAt: "2024-05-26 16:20",
        senderColor: "#3990EA",
        recipientColor: "#FF6B6B",
        type: "sent"
      },
      {
        id: 5,
        senderName: "佐藤さん",
        senderDepartment: "マーケティング部",
        recipientName: "デモ太郎",
        recipientDepartment: "営業部",
        message: "営業資料のフィードバック、とても参考になりました。顧客への提案がより効果的になりました！",
        category: "感謝",
        likes: 9,
        createdAt: "2024-05-26 13:10",
        senderColor: "#4ECDC4",
        recipientColor: "#3990EA",
        type: "received"
      },
      {
        id: 6,
        senderName: "鈴木さん",
        senderDepartment: "品質管理部",
        recipientName: "開発チーム",
        recipientDepartment: "開発部",
        message: "新機能のテスト協力ありがとうございました。品質向上に大きく貢献していただきました。",
        category: "協力",
        likes: 15,
        createdAt: "2024-05-25 17:30",
        senderColor: "#F8B500",
        recipientColor: "#95E1D3",
        type: "sent"
      },
      {
        id: 7,
        senderName: "伊藤さん",
        senderDepartment: "総務部",
        recipientName: "新入社員の皆さん",
        recipientDepartment: "全部署",
        message: "研修期間中の積極的な質問や取り組み姿勢が印象的でした。これからの活躍を楽しみにしています！",
        category: "激励",
        likes: 18,
        createdAt: "2024-05-25 14:00",
        senderColor: "#DDA0DD",
        recipientColor: "#98FB98",
        type: "received"
      },
      {
        id: 8,
        senderName: "デモ太郎",
        senderDepartment: "営業部",
        recipientName: "佐藤さん",
        recipientDepartment: "マーケティング部",
        message: "マーケティング戦略の提案、素晴らしいアイデアでした。売上向上に直結する内容で勉強になりました！",
        category: "称賛",
        likes: 11,
        createdAt: "2024-05-24 10:45",
        senderColor: "#3990EA",
        recipientColor: "#4ECDC4",
        type: "sent"
      },
      {
        id: 9,
        senderName: "中村課長",
        senderDepartment: "経理部",
        recipientName: "全社員",
        recipientDepartment: "全部署",
        message: "月次決算作業での皆様のご協力、ありがとうございました。正確な数値のおかげで報告書を完成できました。",
        category: "感謝",
        likes: 22,
        createdAt: "2024-05-24 08:30",
        senderColor: "#87CEEB",
        recipientColor: "#FFE4B5",
        type: "received"
      },
      {
        id: 10,
        senderName: "小林さん",
        senderDepartment: "カスタマーサポート部",
        recipientName: "デモ太郎",
        recipientDepartment: "営業部",
        message: "お客様対応の方法を教えていただき、ありがとうございます。より良いサービス提供ができそうです！",
        category: "成長支援",
        likes: 7,
        createdAt: "2024-05-23 15:20",
        senderColor: "#FFB347",
        recipientColor: "#3990EA",
        type: "received"
      }
    ]);
  }, []);

  const handleLike = (cardId: number) => {
    setLikedCards(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(cardId)) {
        newLiked.delete(cardId);
        toast({
          title: "いいねを取り消しました",
          description: "2ポイントが返還されました",
        });
      } else {
        newLiked.add(cardId);
        toast({
          title: "いいねしました！",
          description: "2ポイントを使用しました（1pt送信者、1pt受信者）",
        });
      }
      return newLiked;
    });
  };

  const handleSendCard = () => {
    if (!newCardData.recipient || !newCardData.category || !newCardData.message.trim()) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive"
      });
      return;
    }

    const selectedUser = demoUsers.find(user => user.name === newCardData.recipient);
    
    const newCard = {
      id: Date.now(),
      senderName: "デモ太郎",
      senderDepartment: "営業部",
      recipientName: newCardData.recipient,
      recipientDepartment: selectedUser?.department || "不明",
      message: newCardData.message,
      category: newCardData.category,
      likes: 0,
      createdAt: new Date().toLocaleString('ja-JP'),
      senderColor: "#3990EA",
      recipientColor: selectedUser?.color || "#gray",
      type: "sent"
    };

    setCards(prev => [newCard, ...prev]);
    setNewCardData({ recipient: "", message: "", category: "" });
    setIsDialogOpen(false);
    
    toast({
      title: "カードを送信しました！",
      description: `${newCardData.recipient}さんにフィードバックカードを送信しました。`,
    });
  };

  // フィルター機能
  const filteredCards = cards.filter(card => {
    if (activeTab === "sent" && card.type !== "sent") return false;
    if (activeTab === "received" && card.type !== "received") return false;
    if (filterCategory !== "all" && card.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/landing">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ランディングページに戻る
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <BearLogo />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LevLetter</h1>
                  <p className="text-xs text-red-600 font-medium">デモ版</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-gray-600" />
              <Settings className="h-5 w-5 text-gray-600" />
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback style={{ backgroundColor: demoUser.color }}>
                    デ
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">{demoUser.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* サイドバー */}
          <div className="lg:col-span-1 space-y-6">
            {/* ポイント残高 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-sm">今週のポイント</h3>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{demoUser.points}pt</div>
                <p className="text-xs text-gray-600">残り50pt / 500pt</p>
              </CardContent>
            </Card>

            {/* 統計情報 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Users className="h-4 w-4 text-green-600" />
                  <h3 className="font-semibold text-sm">今月の実績</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">送信したカード</span>
                    <span className="font-semibold">{cards.filter(c => c.type === "sent").length}枚</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">受信したカード</span>
                    <span className="font-semibold">{cards.filter(c => c.type === "received").length}枚</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">いいね数</span>
                    <span className="font-semibold">{cards.reduce((total, card) => total + card.likes, 0) + likedCards.size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 部署ランキング */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Trophy className="h-4 w-4 text-purple-600" />
                  <h3 className="font-semibold text-sm">部署ランキング</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">営業部</span>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold">1位</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">開発部</span>
                    <span className="text-sm font-semibold">2位</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">マーケティング部</span>
                    <span className="text-sm font-semibold">3位</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メインエリア */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">フィードバックタイムライン</h2>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#3990EA] hover:bg-[#2c7bd6] text-white shadow-lg hover:shadow-xl transition-all duration-200">
                        <Plus className="h-4 w-4 mr-2" />
                        <span className="font-medium">カードを送る</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-gray-900">
                          新しいフィードバックカード
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                          同僚にポジティブなフィードバックを送信しましょう
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label htmlFor="recipient" className="text-sm font-medium text-gray-700">送信先</label>
                          <Select 
                            value={newCardData.recipient} 
                            onValueChange={(value) => setNewCardData(prev => ({ ...prev, recipient: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="送信先を選択してください" />
                            </SelectTrigger>
                            <SelectContent>
                              {demoUsers.map((user) => (
                                <SelectItem key={user.name} value={user.name}>
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: user.color }}
                                    />
                                    <span>{user.name} ({user.department})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="category" className="text-sm font-medium text-gray-700">カテゴリ</label>
                          <Select 
                            value={newCardData.category} 
                            onValueChange={(value) => setNewCardData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="フィードバックの種類を選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="感謝">🙏 感謝</SelectItem>
                              <SelectItem value="協力">🤝 協力</SelectItem>
                              <SelectItem value="称賛">👏 称賛</SelectItem>
                              <SelectItem value="激励">💪 激励</SelectItem>
                              <SelectItem value="成長支援">📈 成長支援</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="message" className="text-sm font-medium text-gray-700">メッセージ</label>
                          <Textarea 
                            id="message"
                            value={newCardData.message}
                            onChange={(e) => setNewCardData(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="具体的で心のこもったメッセージを入力してください..."
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button 
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          キャンセル
                        </Button>
                        <Button 
                          onClick={handleSendCard}
                          className="bg-[#3990EA] hover:bg-[#2c7bd6] text-white"
                          disabled={!newCardData.recipient || !newCardData.category || !newCardData.message.trim()}
                        >
                          送信
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* タブとフィルター */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                      <TabsTrigger value="all" className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>全て</span>
                      </TabsTrigger>
                      <TabsTrigger value="received" className="flex items-center space-x-2">
                        <Gift className="h-4 w-4" />
                        <span>もらった</span>
                      </TabsTrigger>
                      <TabsTrigger value="sent" className="flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>送った</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="カテゴリで絞り込み" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全てのカテゴリ</SelectItem>
                      <SelectItem value="感謝">🙏 感謝</SelectItem>
                      <SelectItem value="協力">🤝 協力</SelectItem>
                      <SelectItem value="称賛">👏 称賛</SelectItem>
                      <SelectItem value="激励">💪 激励</SelectItem>
                      <SelectItem value="成長支援">📈 成長支援</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6">
                {/* カード統計 */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">表示中: {filteredCards.length}件</span>
                    <span className="text-gray-600">合計いいね: {filteredCards.reduce((total, card) => total + card.likes + (likedCards.has(card.id) ? 1 : 0), 0)}</span>
                  </div>
                </div>

                {/* タイムライン */}
                <div className="space-y-6 relative">
                  {/* タイムライン線 */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200"></div>
                  
                  {filteredCards.map((card) => (
                    <div key={card.id} className="relative">
                      {/* タイムラインドット */}
                      <div className="absolute left-4 w-4 h-4 bg-white border-4 border-blue-400 rounded-full shadow-sm"></div>
                      
                      {/* カードコンテンツ */}
                      <div className="ml-12">
                        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-400 bg-gradient-to-r from-white to-gray-50">
                          <CardContent className="p-5">
                            <div className="flex items-start space-x-4">
                              <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                                <AvatarFallback 
                                  style={{ backgroundColor: card.senderColor }}
                                  className="text-white font-semibold"
                                >
                                  {card.senderName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <span className="font-semibold text-gray-900">{card.senderName}</span>
                                    <span className="text-gray-400">→</span>
                                    <div className="flex items-center space-x-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback 
                                          style={{ backgroundColor: card.recipientColor }}
                                          className="text-white text-xs"
                                        >
                                          {card.recipientName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-gray-700 font-medium">{card.recipientName}</span>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
                                    >
                                      {card.category}
                                    </Badge>
                                    {card.type === "sent" && (
                                      <Badge variant="outline" className="text-green-700 border-green-300">
                                        送信済み
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{card.createdAt}</span>
                                  </div>
                                </div>
                                <p className="text-gray-800 mb-4 leading-relaxed">{card.message}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <span className="px-2 py-1 bg-gray-100 rounded">{card.senderDepartment}</span>
                                    <span>→</span>
                                    <span className="px-2 py-1 bg-gray-100 rounded">{card.recipientDepartment}</span>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleLike(card.id)}
                                      className={`text-sm transition-all duration-200 ${
                                        likedCards.has(card.id) 
                                          ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                                          : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                                      }`}
                                    >
                                      <Heart className={`h-4 w-4 mr-1 ${likedCards.has(card.id) ? 'fill-current' : ''}`} />
                                      {card.likes + (likedCards.has(card.id) ? 1 : 0)}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCards.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">該当するカードがありません</p>
                    <p className="text-gray-400 text-sm">フィルターを変更するか、新しいカードを送信してみてください</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* お問い合わせセクション */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              お問い合わせ
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              LevLetterについてのご質問やご相談がございましたら、お気軽にお問い合わせください。
              導入のご検討やカスタマイズについても承っております。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">メール</h3>
              <p className="text-gray-600 text-sm mb-3">お気軽にメールでお問い合わせください</p>
              <a 
                href="mailto:rei.abekura@leverages.jp" 
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                rei.abekura@leverages.jp
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">電話</h3>
              <p className="text-gray-600 text-sm mb-3">平日 9:00-18:00</p>
              <a 
                href="tel:03-5774-1632" 
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                03-5774-1632
              </a>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">オフィス</h3>
              <p className="text-gray-600 text-sm mb-3">お打ち合わせも可能です</p>
              <p className="text-purple-600 font-medium text-sm">
                渋谷スクランブルスクエア<br />
                東棟24,25階
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              導入をご検討の方へ
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✓ 無料デモンストレーション</h4>
                <p className="text-gray-600 text-sm">実際の操作画面をご覧いただけます</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✓ カスタマイズ対応</h4>
                <p className="text-gray-600 text-sm">企業様のニーズに合わせた機能追加</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✓ 導入サポート</h4>
                <p className="text-gray-600 text-sm">スムーズな運用開始をお手伝い</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✓ 運用コンサルティング</h4>
                <p className="text-gray-600 text-sm">フィードバック文化の浸透支援</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/contact">
                <Button size="lg" className="bg-[#3990EA] hover:bg-blue-600 text-white px-8 py-3 rounded-xl shadow-lg">
                  お問い合わせ・導入相談
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}