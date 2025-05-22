import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardWithRelations, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, Clock, Heart, MessageSquare, RotateCcw, 
  User as UserIcon, Send, Plus, Eye, EyeOff, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { getCards } from "@/lib/api";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, 
  DialogDescription
} from "@/components/ui/dialog";
import CardForm from "@/components/card-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// カードコンポーネント
const CardItem = ({ card, currentUser, onRefresh }: { card: CardWithRelations, currentUser: User, onRefresh?: () => void }) => {
  const formattedDate = format(new Date(card.createdAt), 'yyyy年MM月dd日', { locale: ja });
  const formattedTime = format(new Date(card.createdAt), 'HH:mm', { locale: ja });
  const recipientName = card.recipientType === "user" 
    ? (card.recipient as User).displayName || (card.recipient as User).name
    : "チーム";
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(card.hidden || false);
  
  // 管理者かどうかを確認
  const isAdmin = currentUser?.isAdmin || false;

  // ユーザーアバターのイニシャルを作成
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };
  
  // カードを非表示にする処理
  const handleHideCard = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden: !isHidden })
      });
      
      if (!response.ok) {
        throw new Error('カードの表示状態の更新に失敗しました');
      }
      
      setIsHidden(!isHidden);
      toast({
        title: !isHidden ? "カードを非表示にしました" : "カードを表示状態に戻しました",
        description: "正常に更新されました",
      });
    } catch (error) {
      console.error('カード表示状態更新エラー:', error);
      toast({
        title: "エラー",
        description: `カードの表示状態を更新できませんでした: ${error}`,
        variant: "destructive",
      });
    }
  };
  
  // カードを削除する処理
  const handleDeleteCard = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('カードの削除に失敗しました');
      }
      
      toast({
        title: "カードを削除しました",
        description: "カードは完全に削除されました",
      });
      
      setIsDeleteDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('カード削除エラー:', error);
      toast({
        title: "エラー",
        description: `カードを削除できませんでした: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`overflow-hidden border border-gray-200 hover:shadow-md transition-shadow ${isHidden ? 'opacity-50' : ''}`}>
      <CardHeader className="bg-gray-50 p-4 pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8" style={{ backgroundColor: `var(--${card.sender.avatarColor || 'blue-500'})` }}>
              <AvatarFallback>{getInitials(card.sender.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{card.sender.displayName || card.sender.name}</div>
              <div className="text-xs text-gray-500">{card.sender.department}</div>
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
            <Clock className="h-3 w-3 ml-2 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {card.recipientType === "user" && (
          <div className="flex items-center mb-3">
            <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600">宛先: {recipientName}</span>
          </div>
        )}
        <p className="text-gray-800 whitespace-pre-line">{card.message}</p>
      </CardContent>
      <CardFooter className="bg-gray-50 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center text-sm">
          <Heart className="h-4 w-4 mr-1 text-red-400" />
          <span>{card.totalPoints || 0} いいね</span>
        </div>
        
        <div className="flex gap-2">
          {/* 管理者向けのボタン */}
          {isAdmin && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={handleHideCard}
              >
                {isHidden ? (
                  <Eye className="h-4 w-4 mr-1" />
                ) : (
                  <EyeOff className="h-4 w-4 mr-1" />
                )}
                {isHidden ? '表示' : '非表示'}
              </Button>
              
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-lg">カードを削除しますか？</DialogTitle>
                    <DialogDescription>
                      このカードを完全に削除します。この操作は元に戻せません。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteCard}
                    >
                      削除する
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          
          {/* 詳細ボタン */}
          <Button variant="ghost" size="sm" className="text-xs">
            <MessageSquare className="h-4 w-4 mr-1" />
            詳細
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");
  const [isCardFormOpen, setIsCardFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // APIからカードデータを取得
  const {
    data: cards = [],
    isLoading,
    error,
    refetch
  } = useQuery<CardWithRelations[]>({
    queryKey: ["/api/cards"],
    queryFn: () => getCards({}),
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    staleTime: 10000 // 10秒間はキャッシュを使用
  });

  // データの読み込み確認のログ
  useEffect(() => {
    console.log("カード取得データ状態:", { カード数: cards?.length || 0, ロード中: isLoading, エラー: !!error });
    if (cards && cards.length > 0) {
      console.log("カード取得レスポンス:", 200, "OK");
      console.log("取得したカードデータ:", cards);
    }
  }, [cards, isLoading, error]);

  // カードのフィルタリングとソート
  const filteredCards = activeTab === "all" 
    ? cards 
    : activeTab === "received" 
      ? cards.filter(card => card.recipientId === user.id || (card.additionalRecipients && card.additionalRecipients.includes(user.id)))
      : activeTab === "sent"
        ? cards.filter(card => card.senderId === user.id)
        : cards.filter(card => card.likes.some(like => like.user.id === user.id));

  const sortedCards = [...filteredCards].sort((a, b) => {
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
    refetch();
  };

  // スクロール検知 - カード2-3枚分でヘッダーを隠す
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        // カード2-3枚分の高さ（約400-500px）でヘッダー部分を隠す
        setIsScrolled(scrollTop > 450);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // スワイプ機能
  const minSwipeDistance = 50;
  const tabs = ["all", "received", "sent", "liked"];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const currentIndex = tabs.indexOf(activeTab);
    
    if (isLeftSwipe && currentIndex < tabs.length - 1) {
      // 左スワイプ（次のタブ）
      setActiveTab(tabs[currentIndex + 1]);
    }
    
    if (isRightSwipe && currentIndex > 0) {
      // 右スワイプ（前のタブ）
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* スクロール時のコンパクト感謝ボタン（上部固定） */}
      <div className={`md:block hidden fixed top-4 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-300 ${
        isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
      }`}>
        <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#3990EA] to-[#2d7de0] hover:from-[#2d7de0] hover:to-[#1e6bd9] text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
              <Send className="h-4 w-4 mr-2" />
              感謝を伝える
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">新しいサンクスカードを送る</DialogTitle>
            </DialogHeader>
            <CardForm onSent={() => {
              setIsCardFormOpen(false);
              refetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* モバイル用固定カード送信ボタン */}
      <div className="md:hidden fixed right-6 bottom-6 z-10">
        <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Plus size={24} />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">新しいサンクスカードを送る</DialogTitle>
            </DialogHeader>
            <CardForm onSent={() => {
              setIsCardFormOpen(false);
              refetch();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* タイムライン */}
      <div className="flex flex-col h-full">
        {/* ヘッダー部分 - スクロール時に隠れる */}
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'opacity-0 -translate-y-4 h-0 mb-0 pointer-events-none overflow-hidden' : 'opacity-100 translate-y-0 mb-4'
        }`}>
          <h2 className="text-lg font-semibold text-gray-800">カードタイムライン</h2>
          
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCards}
              className="ml-2"
              disabled={isLoading}
            >
              <RotateCcw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </div>
        </div>

        {/* サンクスカード送信ボタン - 控えめなデザイン */}
        <div className={`hidden md:block transition-all duration-300 ${
          isScrolled ? 'opacity-0 -translate-y-4 h-0 mb-0 pointer-events-none overflow-hidden' : 'opacity-100 translate-y-0 mb-4'
        }`}>
          <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer transition-all duration-200">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#3990EA] rounded-full flex items-center justify-center">
                      <Send className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-700 text-sm font-medium">
                        感謝の気持ちを伝える
                      </div>
                      <div className="text-gray-500 text-xs">
                        新しいサンクスカードを作成
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-xl">新しいサンクスカードを送る</DialogTitle>
              </DialogHeader>
              <CardForm onSent={() => {
                setIsCardFormOpen(false);
                refetch();
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* タブ切り替え - 常に表示 */}
        <Tabs 
          value={activeTab} 
          className="flex flex-col flex-1 overflow-hidden" 
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="all">全て</TabsTrigger>
            <TabsTrigger value="received">受け取った</TabsTrigger>
            <TabsTrigger value="sent">送った</TabsTrigger>
            <TabsTrigger value="liked">いいねした</TabsTrigger>
          </TabsList>

          <div 
            className="flex-1 overflow-hidden mt-4"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <TabsContent value="all" className="h-full overflow-hidden">
              <div ref={scrollContainerRef} className="h-full overflow-y-auto">
                {renderCardList()}
              </div>
            </TabsContent>
            
            <TabsContent value="received" className="h-full overflow-hidden">
              <div ref={scrollContainerRef} className="h-full overflow-y-auto">
                {renderCardList()}
              </div>
            </TabsContent>
            
            <TabsContent value="sent" className="h-full overflow-hidden">
              <div ref={scrollContainerRef} className="h-full overflow-y-auto">
                {renderCardList()}
              </div>
            </TabsContent>
            
            <TabsContent value="liked" className="h-full overflow-hidden">
              <div ref={scrollContainerRef} className="h-full overflow-y-auto">
                {renderCardList()}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );

  // カードリスト表示関数
  function renderCardList() {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 text-red-800 p-8 rounded-lg text-center border border-red-200">
          <p className="mb-4 font-medium">エラーが発生しました</p>
          <p className="text-sm">{(error as Error)?.message || "データの取得に失敗しました"}</p>
          <Button 
            variant="outline" 
            className="mt-4 bg-white"
            onClick={refreshCards}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            再試行
          </Button>
        </div>
      );
    }
    
    if (sortedCards.length === 0) {
      return (
        <div className="bg-gray-50 text-gray-600 p-8 rounded-lg text-center">
          <p className="mb-4">表示するカードがありません。</p>
          <Button 
            onClick={() => setIsCardFormOpen(true)}
            variant="outline"
            className="mt-2"
          >
            <Send className="h-4 w-4 mr-2" />
            新しいカードを送る
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {sortedCards.map(card => (
          <CardItem 
            key={`card-${card.id}`} 
            card={{...card, hidden: card.hidden || false}} 
            currentUser={user}
            onRefresh={refreshCards} 
          />
        ))}
      </div>
    );
  }
}