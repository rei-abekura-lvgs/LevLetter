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

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollTop = scrollContainerRef.current.scrollTop;
        setIsScrolled(scrollTop > 100); // 100px以上スクロールしたら小さくする
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

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
      <div className="flex flex-col h-full">{/* ヘッダー部分 - 固定 */}
        <div className="flex items-center justify-between mb-4">
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

        {/* サンクスカード送信ボタン - より目立つデザイン */}
        <div className="mb-4 hidden md:block">
          <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
                <div className="bg-gradient-to-r from-[#3990EA] to-[#2d7de0] border-2 border-[#3990EA] rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                  {/* 背景のきらめき効果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Send className="h-6 w-6 text-[#3990EA]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-base font-semibold mb-1">
                        感謝の気持ちを伝えよう ✨
                      </div>
                      <div className="text-blue-100 text-sm">
                        クリックして新しいサンクスカードを作成
                      </div>
                    </div>
                    <div className="text-white/80 group-hover:text-white transition-colors duration-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
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

        {/* タブ切り替え */}
        <Tabs defaultValue="all" className="flex flex-col flex-1 overflow-hidden" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="all">全て</TabsTrigger>
            <TabsTrigger value="received">受け取った</TabsTrigger>
            <TabsTrigger value="sent">送った</TabsTrigger>
            <TabsTrigger value="liked">いいねした</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 overflow-hidden mt-4">
            <div ref={scrollContainerRef} className="h-full overflow-y-auto">
              {renderCardList()}
            </div>
          </TabsContent>
          
          <TabsContent value="received" className="flex-1 overflow-hidden mt-4">
            <div ref={scrollContainerRef} className="h-full overflow-y-auto">
              {renderCardList()}
            </div>
          </TabsContent>
          
          <TabsContent value="sent" className="flex-1 overflow-hidden mt-4">
            <div ref={scrollContainerRef} className="h-full overflow-y-auto">
              {renderCardList()}
            </div>
          </TabsContent>
          
          <TabsContent value="liked" className="flex-1 overflow-hidden mt-4">
            <div ref={scrollContainerRef} className="h-full overflow-y-auto">
              {renderCardList()}
            </div>
          </TabsContent>
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