import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCards } from "@/lib/api";
import { CardWithRelations, User } from "@shared/schema";
import CardForm from "@/components/card-form";
import CardItem from "@/components/card-item";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

// サンプルデータを生成する関数
function generateSampleCards(): CardWithRelations[] {
  const sender: User = {
    id: 1,
    email: "tanaka@example.com",
    name: "田中 一郎",
    displayName: "田中 一郎",
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
  
  const recipient: User = {
    id: 2,
    email: "yamada@example.com",
    name: "山田 花子",
    displayName: "山田 花子",
    department: "マーケティング部",
    avatarColor: "pink-500",
    weeklyPoints: 500,
    totalPointsReceived: 0,
    lastWeeklyPointsReset: null,
    password: null,
    cognitoSub: null,
    googleId: null,
    createdAt: new Date()
  };
  
  return [
    {
      id: 1,
      createdAt: new Date(),
      senderId: sender.id,
      recipientId: recipient.id,
      recipientType: "user",
      message: "先日のプレゼンテーション、とても素晴らしかったです！チーム全体のモチベーションが上がりました。ありがとうございます！",
      public: true,
      sender,
      recipient,
      likes: [],
      totalPoints: 0
    },
    {
      id: 2,
      createdAt: new Date(Date.now() - 86400000), // 1日前
      senderId: recipient.id,
      recipientId: sender.id,
      recipientType: "user",
      message: "難しい問題を素早く解決してくれて助かりました。いつも頼りになります！",
      public: true,
      sender: recipient,
      recipient: sender,
      likes: [],
      totalPoints: 0
    }
  ];
}

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [useFixedSampleData, setUseFixedSampleData] = useState(true); // 開発用にサンプルデータを強制的に使用

  console.log("Home: ユーザー情報", user);
  
  // 開発用に固定サンプルデータを使用
  const sampleCards = generateSampleCards();
  console.log("生成したサンプルカード:", sampleCards);
  
  const { data: cards, isLoading, error, refetch } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards", { limit: page * ITEMS_PER_PAGE, sort: sortOrder }],
    queryFn: async () => {
      console.log("カード取得開始 - パラメータ:", { limit: page * ITEMS_PER_PAGE });
      
      // 開発用に固定サンプルデータを使用する場合はAPIリクエストをスキップ
      if (useFixedSampleData) {
        console.log("開発用にサンプルデータを強制的に使用します");
        return sampleCards;
      }
      
      try {
        console.log("認証トークン状態:", localStorage.getItem("levletter-auth-token") ? "存在します" : "存在しません");
        
        const data = await getCards({ limit: page * ITEMS_PER_PAGE });
        console.log("カード取得成功:", data);
        
        if (Array.isArray(data) && data.length === 0) {
          console.log("カードがないため、サンプルデータを使用します");
          return sampleCards;
        }
        
        return data;
      } catch (err) {
        console.error("カード取得エラー:", err);
        console.log("エラーのため、サンプルデータを使用します");
        return sampleCards;
      }
    },
    retry: 0, // リトライをオフに設定
    staleTime: Infinity // キャッシュを永続化（開発用）
  });

  // 並び替え処理
  const sortedCards = cards ? [...cards].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.totalPoints - a.totalPoints;
    }
  }) : [];

  const handleSortChange = (value: string) => {
    setSortOrder(value as "newest" | "popular");
  };

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      {/* カード送信フォーム */}
      <CardForm />
      
      {/* タイムライン */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
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
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refetch()}
              title="更新"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* カードリスト */}
        <div className="space-y-4">
          {isLoading ? (
            // ローディング状態
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-white rounded-lg shadow animate-pulse h-40 mb-4"></div>
            ))
          ) : error ? (
            // エラー状態
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              データの読み込みに失敗しました。もう一度お試しください。
            </div>
          ) : sortedCards.length === 0 ? (
            // データなし
            <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
              <p className="mb-4">カードがまだありません。</p>
              <p>最初のサンクスカードを送ってみましょう！</p>
            </div>
          ) : (
            // カード表示
            <>
              {sortedCards.map(card => (
                <CardItem key={card.id} card={card} currentUser={user} />
              ))}
              
              {/* もっと見るボタン */}
              {cards && cards.length >= page * ITEMS_PER_PAGE && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="text-gray-700"
                  >
                    もっと見る
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
