import { useState, useEffect } from "react";
import { CardWithRelations, User } from "@shared/schema";
import CardForm from "@/components/card-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw } from "lucide-react";

// シンプルなカードコンポーネント（デバッグ用）
const SimpleCard = ({ card }: { card: CardWithRelations }) => (
  <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
    <div className="flex justify-between mb-2">
      <div className="font-medium text-blue-700">送信者: {card.sender.name}</div>
      <div className="text-xs text-gray-500">ID: {card.id}</div>
    </div>
    <div className="mb-2 text-sm">宛先: {card.recipientType === "user" 
      ? (card.recipient as User).name 
      : "チーム"}</div>
    <div className="border-t border-gray-100 pt-2 text-sm">{card.message.substring(0, 100)}...</div>
    <div className="mt-2 text-xs text-gray-500">いいね: {card.totalPoints || 0}件</div>
  </div>
);

// 開発用のサンプルカードデータを生成
function generateSampleCards(userId: number): CardWithRelations[] {
  // 送信者（現在のユーザー）
  const currentUser: User = {
    id: userId,
    email: "current@example.com",
    name: "現在のユーザー",
    displayName: "自分",
    department: "開発部",
    avatarColor: "blue-500",
    weeklyPoints: 500,
    totalPointsReceived: 0,
    lastWeeklyPointsReset: null,
    password: null,
    cognitoSub: null,
    googleId: null,
    createdAt: new Date()
  };

  // 受信者
  const recipient1: User = {
    id: 100,
    email: "colleague1@example.com",
    name: "同僚 一郎",
    displayName: "同僚1",
    department: "営業部",
    avatarColor: "green-500",
    weeklyPoints: 500,
    totalPointsReceived: 0,
    lastWeeklyPointsReset: null,
    password: null,
    cognitoSub: null,
    googleId: null,
    createdAt: new Date()
  };
  
  // サンプルカードデータ
  return [
    {
      id: 1,
      senderId: recipient1.id,
      recipientId: currentUser.id,
      recipientType: "user",
      message: "先日のプロジェクト会議での的確な意見提供に感謝します。あなたのおかげでチーム全体の方向性が明確になりました。",
      public: true,
      createdAt: new Date("2025-05-15T10:30:00"),
      sender: recipient1,
      recipient: currentUser,
      likes: [],
      totalPoints: 5
    },
    {
      id: 2,
      senderId: currentUser.id,
      recipientId: recipient1.id,
      recipientType: "user",
      message: "先週の緊急トラブル対応、本当にありがとう！あなたの迅速な対応がなければ、顧客を失っていたかもしれません。今後とも協力してがんばりましょう。",
      public: true,
      createdAt: new Date("2025-05-14T16:45:00"),
      sender: currentUser,
      recipient: recipient1,
      likes: [],
      totalPoints: 3
    }
  ];
}

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");
  const [cards, setCards] = useState<CardWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // サンプルデータを読み込み
  useEffect(() => {
    console.log("ホーム画面初期化 - ユーザー:", user);
    
    // ユーザーオブジェクトの検証
    if (!user || !user.id) {
      console.error("有効なユーザー情報がありません", user);
      setLoadError("ユーザー情報が取得できませんでした。再ログインをお試しください。");
      setIsLoading(false);
      return;
    }
    
    console.log("カードデータ生成開始 - ユーザーID:", user.id);
    
    // 即時実行（遅延なし）
    try {
      // ユーザーIDが数値型であることを確保
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      if (isNaN(userId)) {
        throw new Error(`無効なユーザーID: ${user.id}`);
      }
      
      const sampleData = generateSampleCards(userId);
      console.log("サンプルカード生成成功:", sampleData.length + "件", sampleData);
      setCards(sampleData);
      setLoadError(null);
    } catch (err) {
      console.error("サンプルデータエラー:", err);
      setLoadError(`データ読み込みエラー: ${err instanceof Error ? err.message : '未知のエラー'}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // カードの並び替え
  const sortedCards = [...cards].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    }
  });

  // 並び替え変更ハンドラ
  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "popular");
  };

  // データ更新ハンドラ
  const refreshCards = () => {
    console.log("カードデータ更新を実行します - ユーザーID:", user?.id);
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // ユーザーIDが確実に存在することを確認
      if (!user || !user.id) {
        throw new Error("ユーザー情報が見つかりません");
      }
      
      // ユーザーIDが数値型であることを確保
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      
      // サンプルデータ生成（即時実行）
      const refreshedCards = generateSampleCards(userId);
      console.log("新しいカードデータを生成しました:", refreshedCards.length + "件");
      setCards(refreshedCards);
    } catch (err) {
      console.error("カード更新エラー:", err);
      setLoadError(`データ更新エラー: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // デバッグ情報
  const renderDebugInfo = () => (
    <div className="bg-yellow-50 p-3 mb-4 rounded text-sm border border-yellow-200">
      <p className="font-medium text-yellow-800 mb-1">デバッグ情報</p>
      <p>ユーザー: {user ? `${user.name} (ID: ${user.id})` : "未ログイン"}</p>
      <p>カード数: {cards.length}件</p>
      <p>表示モード: {sortOrder === "newest" ? "新しい順" : "人気順"}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* デバッグ情報 */}
      {renderDebugInfo()}
      
      {/* カード送信フォーム */}
      <CardForm />
      
      {/* タイムライン */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">全社タイムライン</h2>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">並び順：</span>
            <Select defaultValue="newest" onValueChange={handleSortChange}>
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="新しい順" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">新しい順</SelectItem>
                <SelectItem value="popular">人気順</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCards}
              className="ml-2"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              更新
            </Button>
          </div>
        </div>
        
        {/* カードリスト */}
        <div className="space-y-4">
          {isLoading ? (
            // ローディング状態
            <div className="text-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : loadError ? (
            // エラー表示
            <div className="bg-red-50 text-red-800 p-8 rounded-lg text-center border border-red-200">
              <p className="mb-4 font-medium">エラーが発生しました</p>
              <p className="text-sm">{loadError}</p>
              <Button 
                variant="outline" 
                className="mt-4 bg-white"
                onClick={refreshCards}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                再試行
              </Button>
            </div>
          ) : sortedCards.length === 0 ? (
            // データなし
            <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
              <p className="mb-4">カードがまだありません。</p>
              <p>最初のサンクスカードを送ってみましょう！</p>
            </div>
          ) : (
            // カード表示（シンプル版）
            <div className="space-y-4">
              {sortedCards.map(card => (
                <SimpleCard key={`card-${card.id}`} card={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}