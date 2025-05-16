import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCards } from "@/lib/api";
import { CardWithRelations, User } from "@shared/schema";
import CardItem from "@/components/card-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface MyCardsProps {
  user: User;
}

export default function MyCards({ user }: MyCardsProps) {
  const [activeTab, setActiveTab] = useState("received");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // 受信したカード
  const { data: receivedCards, isLoading: receivedLoading } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards", { recipientId: user.id, limit: page * ITEMS_PER_PAGE }],
    queryFn: () => getCards({ recipientId: user.id, limit: page * ITEMS_PER_PAGE }),
    enabled: activeTab === "received"
  });

  // 送信したカード
  const { data: sentCards, isLoading: sentLoading } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards", { senderId: user.id, limit: page * ITEMS_PER_PAGE }],
    queryFn: () => getCards({ senderId: user.id, limit: page * ITEMS_PER_PAGE }),
    enabled: activeTab === "sent"
  });

  const loadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const isLoading = activeTab === "received" ? receivedLoading : sentLoading;
  const displayCards = activeTab === "received" ? receivedCards : sentCards;
  const hasMore = displayCards && displayCards.length >= page * ITEMS_PER_PAGE;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">マイカード</h1>
      
      <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="received">受信したカード</TabsTrigger>
          <TabsTrigger value="sent">送信したカード</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          {isLoading ? (
            // ローディング状態
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-white rounded-lg shadow animate-pulse h-40 mb-4"></div>
            ))
          ) : !receivedCards || receivedCards.length === 0 ? (
            // データなし
            <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
              <p>受信したカードはまだありません。</p>
            </div>
          ) : (
            // カード表示
            <>
              <div className="space-y-4">
                {receivedCards.map(card => (
                  <CardItem key={card.id} card={card} currentUser={user} />
                ))}
              </div>
              
              {/* もっと見るボタン */}
              {hasMore && (
                <div className="flex justify-center pt-6">
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
        </TabsContent>
        
        <TabsContent value="sent">
          {isLoading ? (
            // ローディング状態
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="bg-white rounded-lg shadow animate-pulse h-40 mb-4"></div>
            ))
          ) : !sentCards || sentCards.length === 0 ? (
            // データなし
            <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
              <p>送信したカードはまだありません。</p>
            </div>
          ) : (
            // カード表示
            <>
              <div className="space-y-4">
                {sentCards.map(card => (
                  <CardItem key={card.id} card={card} currentUser={user} />
                ))}
              </div>
              
              {/* もっと見るボタン */}
              {hasMore && (
                <div className="flex justify-center pt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
