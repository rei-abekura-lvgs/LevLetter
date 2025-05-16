import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCards } from "@/lib/api";
import { CardWithRelations, User } from "@shared/schema";
import CardForm from "@/components/card-form";
import CardItem from "@/components/card-item";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: cards, isLoading, error, refetch } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards", { limit: page * ITEMS_PER_PAGE, sort: sortOrder }],
    queryFn: () => getCards({ limit: page * ITEMS_PER_PAGE })
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
