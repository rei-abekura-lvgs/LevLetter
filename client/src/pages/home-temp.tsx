import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Activity, BarChart3, TrendingUp } from "lucide-react";
import CardItem from "@/components/card-item";
import CardForm from "@/components/card-form";
import Sidebar from "@/components/layout/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Dashboard from "./dashboard";
import Ranking from "./ranking";
import type { User, CardWithRelations } from "@shared/schema";

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "received" | "sent" | "liked">("all");
  const [mainTab, setMainTab] = useState<"timeline" | "dashboard" | "ranking">("timeline");
  const [sortBy, setSortBy] = useState<"newest" | "popular">("newest");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: cards = [], isLoading, refetch: refreshCards } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards"],
  });

  // タッチ操作のハンドラー
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50 && Math.abs(distanceY) < 100;
    const isRightSwipe = distanceX < -50 && Math.abs(distanceY) < 100;

    if (isLeftSwipe || isRightSwipe) {
      const tabs = ["all", "received", "sent", "liked"];
      const currentIndex = tabs.indexOf(activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1] as typeof activeTab);
      } else if (isRightSwipe && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1] as typeof activeTab);
      }
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as "newest" | "popular");
  };

  // カードのフィルタリング
  const getFilteredCards = (): CardWithRelations[] => {
    let filtered = cards;

    // タブによるフィルタリング
    switch (activeTab) {
      case "received":
        filtered = cards.filter((card) => 
          card.recipientId === user.id || 
          (card.additionalRecipients && card.additionalRecipients.includes(user.id))
        );
        break;
      case "sent":
        filtered = cards.filter((card) => card.senderId === user.id);
        break;
      case "liked":
        filtered = cards.filter((card) => 
          card.likes?.some((like) => like.userId === user.id)
        );
        break;
      default:
        filtered = cards;
    }

    // ソートの適用
    if (sortBy === "newest") {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    return filtered;
  };

  const filteredCards = getFilteredCards();

  const renderCardList = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-32"></div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredCards.length === 0) {
      const getEmptyMessage = () => {
        switch (activeTab) {
          case "received":
            return "まだ受け取ったカードがありません";
          case "sent":
            return "まだ送ったカードがありません";
          case "liked":
            return "まだいいねしたカードがありません";
          default:
            return "まだカードがありません";
        }
      };

      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">{getEmptyMessage()}</p>
          <p className="text-sm mt-2">最初のサンクスカードを作成してみましょう！</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredCards.map((card) => (
          <CardItem 
            key={card.id} 
            card={card} 
            currentUser={user} 
            onRefresh={refreshCards}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* サイドバー - デスクトップのみ */}
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs 
          value={mainTab} 
          onValueChange={(value) => setMainTab(value as "timeline" | "dashboard" | "ranking")} 
          className="flex flex-col h-full"
        >
          <div className="flex-1 overflow-hidden">
            <TabsContent value="timeline" className="flex flex-col h-full overflow-hidden m-0">
              {/* タイムラインタイトル */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-800">タイムライン</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-gray-500 bg-gray-50">
                    {filteredCards.length}件のカード
                  </Badge>
                  <Select defaultValue="newest" onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[120px] h-8 text-sm">
                      <SelectValue placeholder="新しい順" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">新しい順</SelectItem>
                      <SelectItem value="popular">人気順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* サンクスカード送信ボタン - デスクトップのみ */}
              <div className="hidden md:block p-4 flex-shrink-0">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    サンクスカードを作成
                  </Button>
                </div>
              </div>

              {/* タブ切り替えとカードリスト */}
              <Tabs 
                value={activeTab} 
                className="flex flex-col flex-1 overflow-hidden" 
                onValueChange={(value) => setActiveTab(value as "all" | "received" | "sent" | "liked")}
              >
                <TabsList className="grid w-full grid-cols-4 mx-4 mb-4 flex-shrink-0">
                  <TabsTrigger value="all">全て</TabsTrigger>
                  <TabsTrigger value="received">受け取った</TabsTrigger>
                  <TabsTrigger value="sent">送った</TabsTrigger>
                  <TabsTrigger value="liked">いいねした</TabsTrigger>
                </TabsList>

                <div 
                  className="flex-1 overflow-hidden"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <TabsContent value="all" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 pb-20">
                      {renderCardList()}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="received" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 overflow-y-auto px-4 pb-20">
                      {renderCardList()}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sent" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 overflow-y-auto px-4 pb-20">
                      {renderCardList()}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="liked" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <div className="flex-1 overflow-y-auto px-4 pb-20">
                      {renderCardList()}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </TabsContent>

            <TabsContent value="dashboard" className="flex-1 m-0">
              <Dashboard />
            </TabsContent>

            <TabsContent value="ranking" className="flex-1 m-0">
              <Ranking />
            </TabsContent>
          </div>

          {/* フッタータブナビゲーション - モバイルのみ */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
            <TabsList className="grid w-full grid-cols-3 h-16 bg-white rounded-none">
              <TabsTrigger value="timeline" className="flex flex-col items-center gap-1 text-xs py-2 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-[#3990EA]">
                <Activity className="h-5 w-5" />
                タイムライン
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex flex-col items-center gap-1 text-xs py-2 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-[#3990EA]">
                <BarChart3 className="h-5 w-5" />
                ダッシュボード
              </TabsTrigger>
              <TabsTrigger value="ranking" className="flex flex-col items-center gap-1 text-xs py-2 h-full data-[state=active]:bg-blue-50 data-[state=active]:text-[#3990EA]">
                <TrendingUp className="h-5 w-5" />
                ランキング
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* モバイル用フローティングボタン */}
        <div className="lg:hidden fixed bottom-20 right-4 z-30">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg bg-[#3990EA] hover:bg-[#2980d8]"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* ダイアログ */}
      <CreateCardDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={() => {
          refreshCards();
          setIsCreateDialogOpen(false);
        }}
      />
    </div>
  );
}