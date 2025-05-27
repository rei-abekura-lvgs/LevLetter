import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { BearLogo } from "../components/bear-logo";
import { Link } from "wouter";
import { Heart, MessageCircle, ArrowLeft, Plus, Settings, LogOut, Bell, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";

export default function Demo() {
  const [likedCards, setLikedCards] = useState<Set<number>>(new Set());
  const [cards, setCards] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({
    recipient: "",
    message: "",
    category: ""
  });
  const { toast } = useToast();

  // デモユーザー情報
  const demoUser = {
    name: "デモユーザー",
    displayName: "デモ太郎",
    department: "営業部",
    weeklyPoints: 450,
    avatarColor: "#3990EA"
  };

  // デモ用ユーザーリスト
  const demoUsers = [
    { name: "田中マネージャー", department: "営業部", color: "#FF6B6B" },
    { name: "佐藤さん", department: "マーケティング部", color: "#4ECDC4" },
    { name: "山田リーダー", department: "開発部", color: "#95E1D3" },
    { name: "鈴木さん", department: "品質管理部", color: "#F8B500" },
    { name: "高橋部長", department: "人事部", color: "#A8E6CF" }
  ];

  // 初期カードデータ
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
      }
    ]);
  }, []);

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

  const handleSendCard = () => {
    if (!newCardData.recipient || !newCardData.message || !newCardData.category) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください",
        variant: "destructive"
      });
      return;
    }

    const selectedUser = demoUsers.find(user => user.name === newCardData.recipient);
    const newCard = {
      id: cards.length + 1,
      senderName: demoUser.displayName,
      senderDepartment: demoUser.department,
      recipientName: newCardData.recipient,
      recipientDepartment: selectedUser?.department || "不明",
      message: newCardData.message,
      category: newCardData.category,
      likes: 0,
      createdAt: new Date().toISOString().split('T')[0],
      senderColor: demoUser.avatarColor,
      recipientColor: selectedUser?.color || "#999"
    };

    setCards(prev => [newCard, ...prev]);
    setNewCardData({ recipient: "", message: "", category: "" });
    setIsDialogOpen(false);
    
    toast({
      title: "カードを送信しました！",
      description: `${newCardData.recipient}さんにフィードバックカードを送信しました。`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/landing">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>ランディングページに戻る</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BearLogo size={32} />
                <span className="text-2xl font-bold text-gray-900">LevLetter</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 font-semibold">デモ版</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{demoUser.displayName}</p>
                  <p className="text-xs text-gray-500">{demoUser.department}</p>
                </div>
                <Avatar>
                  <AvatarFallback style={{ backgroundColor: demoUser.avatarColor, color: 'white' }}>
                    デ
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* デモ説明バナー */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            🎉 <strong>LevLetterデモ版</strong> - 実際のシステムの雰囲気を体験できます。カードの送信やいいね機能をお試しください！
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* サイドバー */}
          <div className="lg:col-span-1 space-y-4">
            {/* ポイント情報 */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[#3990EA]" />
                  <h3 className="font-semibold text-sm">今週のポイント</h3>
                </div>
                <div className="text-2xl font-bold text-[#3990EA] mb-1">{demoUser.weeklyPoints}</div>
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
                    <span className="font-semibold">15枚</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">受信したカード</span>
                    <span className="font-semibold">12枚</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">いいね数</span>
                    <span className="font-semibold">68</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メインエリア */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">フィードバックカード</h1>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3990EA] hover:bg-[#2563EB]">
                    <Plus className="h-4 w-4 mr-2" />
                    カードを送る
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>フィードバックカードを送る</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">送信先</label>
                      <Select value={newCardData.recipient} onValueChange={(value) => setNewCardData(prev => ({ ...prev, recipient: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="送信先を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          {demoUsers.map(user => (
                            <SelectItem key={user.name} value={user.name}>
                              {user.name} ({user.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">カテゴリ</label>
                      <Select value={newCardData.category} onValueChange={(value) => setNewCardData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="カテゴリを選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="感謝">感謝</SelectItem>
                          <SelectItem value="協力">協力</SelectItem>
                          <SelectItem value="称賛">称賛</SelectItem>
                          <SelectItem value="激励">激励</SelectItem>
                          <SelectItem value="成長支援">成長支援</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">メッセージ</label>
                      <Textarea
                        placeholder="フィードバックメッセージを入力してください..."
                        value={newCardData.message}
                        onChange={(e) => setNewCardData(prev => ({ ...prev, message: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSendCard} className="flex-1 bg-[#3990EA] hover:bg-[#2563EB]">
                        送信する
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        キャンセル
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* カード一覧 */}
            <div className="space-y-4">
              {cards.map((card) => (
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
                      <Avatar className="h-8 w-8">
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