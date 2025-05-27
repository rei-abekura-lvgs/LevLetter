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
import { useToast } from "@/hooks/use-toast";

// カードコンポーネント
const CardItem = ({ card, currentUser, onRefresh }: { card: CardWithRelations, currentUser: User, onRefresh?: () => void }) => {
  const formattedDate = format(new Date(card.createdAt), 'yyyy年MM月dd日', { locale: ja });
  const timeFromNow = format(new Date(card.createdAt), 'HH:mm', { locale: ja });
  const [isLikeFormOpen, setIsLikeFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 削除権限チェック
  useEffect(() => {
    const checkDeletePermission = () => {
      // 管理者またはカード送信者のみ削除可能
      const isAdmin = currentUser.isAdmin;
      const isSender = card.senderId === currentUser.id;
      setCanDelete(isAdmin || isSender);
    };
    
    checkDeletePermission();
  }, [currentUser, card.senderId]);

  const handleDeleteCard = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('カードの削除に失敗しました');
      }

      toast({
        title: "削除完了",
        description: "カードが正常に削除されました",
      });

      // キャッシュを無効化してリフレッシュ
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      if (onRefresh) onRefresh();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('カード削除エラー:', error);
      toast({
        title: "エラー",
        description: "カードの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const likeCount = card.likes?.length || 0;
  const hasLiked = card.likes?.some(like => like.userId === currentUser.id) || false;

  return (
    <Card className="mb-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border border-gray-200">
              <AvatarImage 
                src={card.sender.customAvatarUrl || bearAvatarUrl} 
                alt={card.sender.displayName || card.sender.name}
                className="object-cover"
              />
              <AvatarFallback style={{ backgroundColor: card.sender.avatarColor }}>
                {(card.sender.displayName || card.sender.name || '?').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{card.sender.displayName || card.sender.name}</p>
              <p className="text-xs text-gray-500">{card.sender.department || "所属なし"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">{formattedDate}</p>
              <p className="text-xs text-gray-400">{timeFromNow}</p>
            </div>
            {canDelete && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>カードを削除しますか？</DialogTitle>
                    <DialogDescription>
                      この操作は元に戻すことができません。本当にこのカードを削除しますか？
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDialogOpen(false)}
                    >
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
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <UserIcon className="h-4 w-4 text-gray-600 mr-2" />
            <div className="flex flex-wrap items-center gap-1">
              {Array.isArray(card.recipients) && card.recipients.map((user, index) => (
                <div key={user.id} className="flex items-center">
                  <Avatar className="h-6 w-6 border border-gray-200">
                    <AvatarImage 
                      src={user.customAvatarUrl || bearAvatarUrl} 
                      alt={user.displayName || user.name}
                      className="object-cover"
                    />
                    <AvatarFallback style={{ backgroundColor: user.avatarColor }}>
                      {(user.displayName || user.name || '?').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.displayName || user.name}</span>
                  {index === 0 && <Badge variant="secondary" className="text-xs">主受信者</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-gray-800 leading-relaxed">{card.message}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Dialog open={isLikeFormOpen} onOpenChange={setIsLikeFormOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`flex items-center space-x-1 ${hasLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
                  >
                    <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{likeCount}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>カードにいいねする</DialogTitle>
                    <DialogDescription>
                      このカードにいいねして、ポイントを送りましょう。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      いいね1回につき2ポイント消費されます（送信者と受信者に1ポイントずつ）
                    </p>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsLikeFormOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/cards/${card.id}/likes`, {
                              method: 'POST',
                              credentials: 'include'
                            });

                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.message);
                            }

                            toast({
                              title: "いいね完了",
                              description: "いいねを送信しました",
                            });

                            queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
                            if (onRefresh) onRefresh();
                            setIsLikeFormOpen(false);
                          } catch (error) {
                            console.error('いいねエラー:', error);
                            toast({
                              title: "エラー",
                              description: error instanceof Error ? error.message : "いいねの送信に失敗しました",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="bg-[#3990EA] hover:bg-[#3990EA]/90"
                      >
                        いいねする
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
            <Clock className="h-3 w-3" />
            <span>{timeFromNow}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("all");
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  const { data: cards, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/cards'],
    retry: 3,
    retryDelay: 1000,
  });

  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const handleRefresh = async () => {
    if (isRefreshDisabled) return;
    
    setIsRefreshDisabled(true);
    await refetch();
    
    setTimeout(() => {
      setIsRefreshDisabled(false);
    }, 2000);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (Math.abs(diff) > 5) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const endTouch = e.changedTouches[0].clientX;
    const diff = touchStart - endTouch;
    
    if (Math.abs(diff) > 50) {
      const tabs = ["all", "received", "sent", "liked"];
      const currentIndex = tabs.indexOf(activeTab);
      
      if (diff > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
    
    setTouchStart(null);
  };

  const filteredCards = cards?.filter((card: CardWithRelations) => {
    if (!user) return false;
    
    switch (activeTab) {
      case "received":
        return card.recipientId === user.id || 
               (Array.isArray(card.recipients) && card.recipients.some(r => r.id === user.id));
      case "sent":
        return card.senderId === user.id;
      case "liked":
        return card.likes?.some(like => like.userId === user.id);
      default:
        return true;
    }
  }) || [];

  const renderCardList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3990EA]"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">データの読み込みに失敗しました</p>
          <Button onClick={handleRefresh} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </div>
      );
    }

    if (!filteredCards || filteredCards.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mb-4">
            <BearLogo size={80} useTransparent={true} bgColor="bg-gray-200" />
          </div>
          <p className="text-gray-500 mb-4">
            {activeTab === "all" && "まだカードがありません"}
            {activeTab === "received" && "受け取ったカードがありません"}
            {activeTab === "sent" && "送ったカードがありません"}
            {activeTab === "liked" && "いいねしたカードがありません"}
          </p>
          {activeTab === "all" && (
            <Button 
              onClick={() => setIsNewCardOpen(true)}
              className="bg-[#3990EA] hover:bg-[#3990EA]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              最初のカードを作成
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredCards.map((card: CardWithRelations) => (
          <CardItem 
            key={card.id} 
            card={card} 
            currentUser={user} 
            onRefresh={handleRefresh}
          />
        ))}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3990EA]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">タイムライン</h1>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshDisabled}
            className="flex items-center space-x-1"
          >
            <RotateCcw className={`h-4 w-4 ${isRefreshDisabled ? 'animate-spin' : ''}`} />
            <span>更新</span>
          </Button>
          
          <Dialog open={isNewCardOpen} onOpenChange={setIsNewCardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#3990EA] hover:bg-[#3990EA]/90">
                <Plus className="h-4 w-4 mr-2" />
                新規作成
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>新しいカードを作成</DialogTitle>
                <DialogDescription>
                  同僚に感謝や応援のメッセージを送りましょう。
                </DialogDescription>
              </DialogHeader>
              <CardForm 
                onSuccess={() => {
                  setIsNewCardOpen(false);
                  handleRefresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* タブセレクション */}
      <div className="grid w-full grid-cols-4 gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "all" 
              ? "bg-white text-[#3990EA] shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          全て
        </button>
        <button
          onClick={() => setActiveTab("received")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "received" 
              ? "bg-white text-[#3990EA] shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          受け取った
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "sent" 
              ? "bg-white text-[#3990EA] shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          送った
        </button>
        <button
          onClick={() => setActiveTab("liked")}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "liked" 
              ? "bg-white text-[#3990EA] shadow-sm" 
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          いいねした
        </button>
      </div>

      {/* カードリスト表示 */}
      <div 
        className="flex-1 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div ref={scrollContainerRef} className="h-full overflow-y-auto">
          {renderCardList()}
        </div>
      </div>
    </div>
  );
}