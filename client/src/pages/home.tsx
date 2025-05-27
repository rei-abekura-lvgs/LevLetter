import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import bearAvatarUrl from "@assets/ChatGPT Image 2025年5月22日 20_25_45.png";
import { Badge } from "@/components/ui/badge";
import { BearLogo } from "@/components/bear-logo";
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
  const [showSenderDepartment, setShowSenderDepartment] = useState(false);
  const [showRecipientDepartment, setShowRecipientDepartment] = useState(false);
  const queryClient = useQueryClient();
  
  // 管理者かどうかを確認
  const isAdmin = currentUser?.isAdmin || false;

  // いいね機能のハンドラ（複数回いいね可能、2pt固定）
  const handleLike = async (cardId: number) => {
    try {
      console.log('🎯 いいねボタン押下開始 - カードID:', cardId);
      console.log('👤 現在のユーザー利用可能ポイント:', currentUser?.weeklyPoints);

      // 楽観的更新: 即座にカードのいいね数を増加
      queryClient.setQueryData(['/api/cards'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((card: any) => {
          if (card.id === cardId) {
            const newLike = { 
              id: Date.now(), 
              userId: currentUser?.id,
              points: 2,
              user: currentUser 
            };
            return {
              ...card,
              likes: [...(card.likes || []), newLike]
            };
          }
          return card;
        });
      });

      // 楽観的更新: ユーザーのポイントを即座に減少
      queryClient.setQueryData(['/api/auth/me'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          weeklyPoints: Math.max(0, oldData.weeklyPoints - 2)
        };
      });

      // サーバーに送信
      console.log('🌐 サーバーへの送信開始');
      const response = await fetch(`/api/cards/${cardId}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'いいね処理に失敗しました');
      }

      console.log('🎉 サーバー送信成功 - 正確なデータで更新');
      // 成功したら正確なデータで更新
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('❌ いいねエラー:', error);
      
      // エラーの場合は楽観的更新をロールバック
      console.log('🔄 楽観的更新をロールバック');
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "エラー",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

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
    <Card className={`border border-gray-200 bg-white mb-4 ${isHidden ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        {/* 左上：送信者アバターと名前、日時 */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            {/* Google認証で画像がある場合は画像、それ以外はクマアイコン */}
            {card.sender.customAvatarUrl ? (
              <AvatarImage src={card.sender.customAvatarUrl} alt={card.sender.name} />
            ) : (
              /* 画像がない場合はクマアイコン */
              <AvatarFallback className="bg-transparent flex items-center justify-center">
                <img src={bearAvatarUrl} alt="" className="w-12 h-12 object-contain" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <button 
                className="font-medium text-gray-900 hover:text-[#3990EA] transition-colors"
                onClick={() => setShowSenderDepartment(!showSenderDepartment)}
              >
                {card.sender.displayName || card.sender.name}
              </button>
              <span className="text-gray-400 text-sm">{formattedDate.replace('年', '/').replace('月', '/').replace('日', '')} {formattedTime}</span>
            </div>
            {showSenderDepartment && card.sender.department && (
              <div className="text-xs text-gray-500 mt-1">
                {card.sender.department}
              </div>
            )}
          </div>
        </div>

        {/* メッセージと受信者情報を含む中央部分 */}
        <div className="flex items-start gap-4 mb-4 pl-16">
          {/* メッセージ部分 - 左側80% */}
          <div className="flex-1 max-w-[75%]">
            <p className="text-gray-900 leading-relaxed whitespace-pre-line">{card.message}</p>
          </div>
          
          {/* 受信者情報 - 右側20% */}
          {card.recipientType === "user" && (
            <div className="flex-none w-[20%] flex flex-col items-end">
              {(() => {
                const allRecipients = [card.recipient as User, ...(card.additionalRecipientUsers || [])];
                const maxDisplayCount = 3; // 最大3つまで表示
                const displayRecipients = allRecipients.slice(0, maxDisplayCount);
                const remainingCount = allRecipients.length - maxDisplayCount;
                const isMultiple = allRecipients.length > 1;
                const avatarSize = isMultiple ? "h-14 w-14" : "h-20 w-20"; // 複数人の場合は小さく、単独は大きく
                
                return (
                  <div className="relative">
                    {/* アバター表示 */}
                    <div className="flex items-center -space-x-2">
                      {displayRecipients.map((user: User, index: number) => (
                        <div key={user.id} className="relative">
                          <Avatar className={`${avatarSize} border-2 border-white`}>
                            {/* Google認証で画像がある場合は画像、それ以外はクマアイコン */}
                            {user.customAvatarUrl ? (
                              <AvatarImage src={user.customAvatarUrl} alt={user.name} />
                            ) : (
                              /* 画像がない場合はクマアイコン */
                              <AvatarFallback className="bg-transparent flex items-center justify-center">
                                <img src={bearAvatarUrl} alt="" className={`${isMultiple ? 'w-10 h-10' : 'w-12 h-12'} object-contain`} />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          
                          {/* 各アバターの右下にポイントバッジ（単独の場合のみ） */}
                          {!isMultiple && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-[#3990EA] text-white font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center px-0.5 z-10" style={{ fontSize: '8px' }}>
                              {card.points}pt
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* 省略表示 */}
                      {remainingCount > 0 && (
                        <div className={`${avatarSize} bg-gray-300 rounded-full border-2 border-white flex items-center justify-center`}>
                          <span className="text-gray-600 text-xs font-bold">+{remainingCount}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 複数人の場合は全体の右下にポイントバッジ */}
                    {isMultiple && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-[#3990EA] text-white font-bold rounded-full min-w-[18px] h-4 flex items-center justify-center px-0.5 z-10" style={{ fontSize: '8px' }}>
                        {card.points}pt
                      </div>
                    )}
                    
                    {/* 受信者名 */}
                    <div className="text-center mt-3 group relative">
                      <span className="text-sm font-medium text-gray-800 cursor-pointer">
                        {(card.recipient as User).displayName || (card.recipient as User).name}
                        {allRecipients.length > 1 && ` + ${allRecipients.length - 1}人`}
                      </span>
                      
                      {/* ホバー時の全員表示 */}
                      {allRecipients.length > 1 && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                          {allRecipients.map((user: User, index) => (
                            <span key={user.id}>
                              {index > 0 && ", "}
                              {user.displayName || user.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* 下部：いいねボタンとアクション */}
        <div className="flex items-center pl-16">
          <div className="flex items-center gap-4">
            {/* いいねアイコン */}
            <div className="flex items-center gap-1 group relative">
              {(() => {
                // 送信者と受信者以外がいいねできる
                const allRecipients = card.additionalRecipients 
                  ? [card.recipient as User, ...(card.additionalRecipients as User[])] 
                  : [card.recipient as User];
                const isRecipient = allRecipients.some(r => r.id === currentUser?.id);
                const isSender = card.sender.id === currentUser?.id;
                const canLike = !isSender && !isRecipient;
                const userLiked = card.likes.some(like => like.user.id === currentUser?.id);
                
                return (
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      canLike 
                        ? 'bg-gray-100 hover:bg-pink-100 cursor-pointer' 
                        : 'bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    onClick={canLike ? () => handleLike(card.id) : undefined}
                  >
                    <Heart className={`h-4 w-4 ${userLiked ? 'text-pink-500 fill-pink-500' : 'text-gray-500'}`} />
                  </div>
                );
              })()}
              
              <span className="text-sm text-gray-600">{card.likes.length}</span>
              
              {/* ホバー時のいいねユーザー表示 */}
              {card.likes.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20">
                  <div className="font-medium mb-1">いいね！</div>
                  {card.likes.map((like, index) => (
                    <div key={like.id}>
                      {index > 0 && ", "}
                      {like.user.displayName || like.user.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 管理者ボタン */}
            {isAdmin && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={handleHideCard}
                >
                  {isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </Button>
                
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>カードを削除しますか？</DialogTitle>
                      <DialogDescription>
                        この操作は元に戻せません。
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
          </div>

          
        </div>
      </CardContent>
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
  const { toast } = useToast();

  // URLパラメータから成功メッセージを読み取り
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successMessage = urlParams.get('success');
    
    if (successMessage) {
      toast({
        title: "✅ 成功",
        description: decodeURIComponent(successMessage),
        duration: 4000,
      });
      
      // URLからパラメータを削除（履歴を残さない）
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [toast]);

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
        <Button 
          className="bg-gradient-to-r from-[#3990EA] to-[#1e6bd9] hover:from-[#1e6bd9] hover:to-[#3990EA] text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-base font-bold border-2 border-white/20"
          onClick={() => setIsCardFormOpen(true)}
        >
          <Send className="h-5 w-5 mr-3" />
          感謝の気持ちを伝える
        </Button>
      </div>

      {/* モバイル用固定カード送信ボタン */}
      <div className="md:hidden fixed right-6 bottom-6 z-10">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-[#3990EA] to-[#1e6bd9] hover:from-[#1e6bd9] hover:to-[#3990EA]"
          onClick={() => setIsCardFormOpen(true)}
        >
          <Plus size={24} />
        </Button>
      </div>

      {/* 統一されたCardFormダイアログ */}
      <Dialog open={isCardFormOpen} onOpenChange={setIsCardFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">サンクスカードを送る</DialogTitle>
          </DialogHeader>
          <CardForm onSent={() => {
            setIsCardFormOpen(false);
            refetch();
          }} />
        </DialogContent>
      </Dialog>

      {/* タイムライン */}
      <div className="flex flex-col h-full">
        {/* ヘッダー部分 - スクロール時に隠れる */}
        <div className={`flex items-center justify-between transition-all duration-300 ${
          isScrolled ? 'opacity-0 -translate-y-4 h-0 mb-0 pointer-events-none overflow-hidden' : 'opacity-100 translate-y-0 mb-4'
        }`}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-800">カードタイムライン</h2>
          </div>
          
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
          <div className="group cursor-pointer transition-all duration-200" onClick={() => setIsCardFormOpen(true)}>
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