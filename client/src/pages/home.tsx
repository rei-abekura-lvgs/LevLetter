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
  User as UserIcon, Send, Plus, Eye, EyeOff, Trash2,
  BarChart3, TrendingUp, Activity, Info
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Dashboard from "@/pages/dashboard";
import Ranking from "@/pages/ranking";

// カードコンポーネント
const CardItem = ({ card, currentUser, onRefresh }: { card: CardWithRelations, currentUser: User, onRefresh?: () => void }) => {
  const formattedDate = format(new Date(card.createdAt), 'yyyy年MM月dd日', { locale: ja });
  const timeFromNow = format(new Date(card.createdAt), 'HH:mm', { locale: ja });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"recipients" | "likes">("recipients");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // いいね詳細データを取得
  const { data: likeDetails } = useQuery({
    queryKey: [`/api/cards/${card.id}/likes`],
    enabled: showDetailsDialog,
  });

  // 削除権限チェック
  useEffect(() => {
    const checkDeletePermission = () => {
      // 管理者またはカード送信者のみ削除可能
      const isAdmin = currentUser.role === 'admin';
      const isSender = card.senderId === currentUser.id;
      setCanDelete(isAdmin || isSender);
    };

    checkDeletePermission();
  }, [currentUser, card]);

  // カード削除処理
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('カードの削除に失敗しました');
      }

      toast({
        title: "削除完了",
        description: "カードを削除しました",
      });

      // データを再取得
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      if (onRefresh) onRefresh();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('削除エラー:', error);
      toast({
        title: "エラー",
        description: "カードの削除に失敗しました",
        variant: "destructive",
      });
    }
  };

  // 受信者表示の処理 - 全受信者を横並びで表示
  const allRecipients: any[] = [];
  if (card.recipient) {
    allRecipients.push(card.recipient);
  }
  if (Array.isArray(card.additionalRecipientUsers)) {
    allRecipients.push(...card.additionalRecipientUsers);
  }

  // いいね状況を確認
  const userLikeCount = card.likes?.filter(like => like.userId === currentUser.id).length || 0;
  const totalLikes = card.likes?.length || 0;
  const userHasLiked = userLikeCount > 0;
  
  // 送信者と受信者の確認
  const isSender = card.senderId === currentUser.id;
  const isRecipient = allRecipients.some(recipient => recipient.id === currentUser.id);
  // 送信者と受信者はいいね禁止、第三者のみいいね可能
  const canLike = !isSender && !isRecipient;

  // いいねボタンのテキスト
  const getLikeButtonText = () => {
    return "";
  };
  
  // 表示する受信者（最大3人）
  const displayRecipients = allRecipients.slice(0, 3);
  const remainingCount = Math.max(0, allRecipients.length - 3);

  // ポイント表示の処理 - カード作成時に設定された実際のポイント数を使用
  const totalPoints = card.points || 0;

  return (
    <Card className="mb-4 last:mb-0 border-none shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
              <AvatarImage 
                src={card.sender.customAvatarUrl || bearAvatarUrl} 
                alt={card.sender.displayName || card.sender.name}
                className="object-cover"
              />
              <AvatarFallback style={{ backgroundColor: card.sender.avatarColor }}>
                {(card.sender.displayName || card.sender.name).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">
                    {card.sender.displayName || card.sender.name}
                  </span>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2">
                    {displayRecipients.map((user: User, index: number) => (
                      <div key={user.id} className="flex items-center gap-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage 
                            src={user.customAvatarUrl || bearAvatarUrl} 
                            alt={user.displayName || user.name} 
                          />
                          <AvatarFallback className={`text-xs text-white bg-${user.avatarColor}`}>
                            {(user.displayName || user.name || 'U').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900 text-sm">
                          {user.displayName || user.name}
                        </span>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <span className="text-gray-500 text-sm ml-1">
                        +{remainingCount}人
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {/* 部署表示を削除 */}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock className="h-3 w-3" />
                  {formattedDate} {timeFromNow}
                </div>
                {totalPoints > 1 && (
                  <div className="flex items-center gap-1 text-[#3990EA] text-xs font-medium">
                    <span>💎 {totalPoints}pt</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 管理者用削除ボタン */}
          {currentUser.isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await apiRequest('DELETE', `/api/cards/${card.id}`);
                  onRefresh?.();
                  toast({ title: "カードを削除しました" });
                } catch (error) {
                  console.error('Delete error:', error);
                  toast({ 
                    title: "エラーが発生しました",
                    description: "カードの削除に失敗しました",
                    variant: "destructive" 
                  });
                }
              }}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-3">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
            {card.message}
          </p>
        </div>
        
        {card.tags && card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {card.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`h-8 px-2 transition-all ${
                  !canLike 
                    ? 'text-gray-400 cursor-not-allowed opacity-50' 
                    : userHasLiked 
                    ? 'text-pink-500 bg-pink-50 hover:text-pink-600 hover:bg-pink-100' 
                    : 'text-gray-600 hover:text-pink-500 hover:bg-pink-50'
                }`}
                onClick={async () => {
                  if (!canLike || totalLikes >= 50) return;
                  
                  // 楽観的更新：即座にUIを更新
                  const optimisticUpdate = () => {
                    // カード一覧のキャッシュを即座に更新
                    queryClient.setQueryData(['/api/cards'], (oldData: any) => {
                      if (!oldData) return oldData;
                      return oldData.map((oldCard: any) => {
                        if (oldCard.id === card.id) {
                          const newLike = {
                            id: Date.now(),
                            userId: currentUser.id,
                            points: 2,
                            user: currentUser
                          };
                          return {
                            ...oldCard,
                            likes: [...(oldCard.likes || []), newLike]
                          };
                        }
                        return oldCard;
                      });
                    });
                  };
                  
                  // 即座にUIを更新
                  optimisticUpdate();
                  
                  try {
                    await apiRequest('POST', `/api/cards/${card.id}/likes`);
                    // サーバーからの正確なデータで更新
                    onRefresh?.();
                    // ユーザー情報のキャッシュも無効化してポイント表示を更新
                    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                    toast({ 
                      title: "いいねしました！✨", 
                      description: "2pt使用しました",
                      duration: 2000
                    });
                  } catch (error) {
                    console.error('Like error:', error);
                    // エラー時は元の状態に戻す
                    onRefresh?.();
                    toast({ 
                      title: "エラーが発生しました",
                      description: "いいねの送信に失敗しました",
                      variant: "destructive" 
                    });
                  }
                }}
                disabled={totalLikes >= 50 || !canLike}
              >
                <Heart className={`h-4 w-4 ${userHasLiked ? 'fill-current' : ''}`} />
                {totalLikes > 0 && (
                  <span className="text-xs font-medium ml-1">
                    {totalLikes}
                  </span>
                )}
              </Button>
            </div>
            

          </div>
          
          <div className="flex items-center gap-2">
            {/* 詳細ボタン - 全カードに表示 */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-gray-500"
              onClick={() => setShowDetailsDialog(true)}
            >
              <Info className="h-3 w-3 mr-1" />
              詳細
            </Button>
            
            {allRecipients.length > displayRecipients.length && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500">
                    <UserIcon className="h-3 w-3 mr-1" />
                    全員表示
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>受信者一覧</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {allRecipients.map((user: User, index) => (
                      <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={user.customAvatarUrl || bearAvatarUrl} 
                            alt={user.displayName || user.name}
                            className="object-cover"
                          />
                          <AvatarFallback style={{ backgroundColor: user.avatarColor }}>
                            {(user.displayName || user.name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{user.displayName || user.name}</div>
                          {user.department && (
                            <div className="text-xs text-gray-500">{user.department}</div>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardFooter>



      {/* カード詳細ダイアログ */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>カード詳細</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="sender" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sender">送信者</TabsTrigger>
              <TabsTrigger value="recipients">受信者</TabsTrigger>
              <TabsTrigger value="likes">いいね</TabsTrigger>
            </TabsList>
            
            {/* 送信者情報 */}
            <TabsContent value="sender" className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={card.sender.customAvatarUrl || bearAvatarUrl} 
                    alt={card.sender.displayName || card.sender.name}
                    className="object-cover"
                  />
                  <AvatarFallback style={{ backgroundColor: card.sender.avatarColor }}>
                    {(card.sender.displayName || card.sender.name).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-lg">{card.sender.displayName || card.sender.name}</p>
                  <p className="text-sm text-gray-500">{card.sender.department}</p>
                  <p className="text-xs text-gray-400">{card.sender.email}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>送信日時:</strong> {format(new Date(card.createdAt), "yyyy年M月d日 HH:mm", { locale: ja })}</p>
              </div>
            </TabsContent>
            
            {/* 受信者情報 */}
            <TabsContent value="recipients" className="space-y-4">
              {allRecipients.map((recipient: any, index: number) => (
                <div key={recipient.id} className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={recipient.customAvatarUrl || bearAvatarUrl} 
                      alt={recipient.displayName || recipient.name}
                      className="object-cover"
                    />
                    <AvatarFallback style={{ backgroundColor: recipient.avatarColor }}>
                      {(recipient.displayName || recipient.name).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{recipient.displayName || recipient.name}</p>
                    <p className="text-sm text-gray-500">{recipient.department}</p>
                    <p className="text-xs text-gray-400">{recipient.email}</p>
                  </div>
                </div>
              ))}
              {allRecipients.length === 0 && (
                <p className="text-gray-500 text-center py-4">受信者情報がありません</p>
              )}
            </TabsContent>
            
            {/* いいね情報 */}
            <TabsContent value="likes" className="space-y-4">
              {(() => {
                if (!likeDetails || !Array.isArray(likeDetails) || likeDetails.length === 0) {
                  return <p className="text-gray-500 text-center py-4">まだいいねがありません</p>;
                }

                // 同じユーザーからのいいねを集約
                const groupedLikes = likeDetails.reduce((acc: any, like: any) => {
                  const userId = like.userId;
                  if (acc[userId]) {
                    acc[userId].count += 1;
                  } else {
                    acc[userId] = {
                      user: like.user,
                      count: 1,
                      latestCreatedAt: like.createdAt
                    };
                  }
                  return acc;
                }, {});

                const aggregatedLikes = Object.values(groupedLikes).sort((a: any, b: any) => 
                  new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
                );

                return aggregatedLikes.map((likeGroup: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={likeGroup.user.customAvatarUrl || bearAvatarUrl} 
                        alt={likeGroup.user.displayName || likeGroup.user.name}
                        className="object-cover"
                      />
                      <AvatarFallback style={{ backgroundColor: likeGroup.user.avatarColor }}>
                        {(likeGroup.user.displayName || likeGroup.user.name || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{likeGroup.user.displayName || likeGroup.user.name}</p>
                      <p className="text-sm text-gray-500">{likeGroup.user.department}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-pink-500 fill-current" />
                      <span className="text-sm font-medium">{likeGroup.count}回</span>
                    </div>
                  </div>
                ));
              })()}
              {totalLikes > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>合計いいね数:</strong> {totalLikes}回
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カードを削除</DialogTitle>
            <DialogDescription>
              このカードを削除しますか？この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              削除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

interface HomeProps {
  user: User;
  isCardFormOpen?: boolean;
  setIsCardFormOpen?: (open: boolean) => void;
}

export default function Home({ user, isCardFormOpen: propIsCardFormOpen, setIsCardFormOpen: propSetIsCardFormOpen }: HomeProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");
  const [localIsCardFormOpen, setLocalIsCardFormOpen] = useState(false);
  
  // プロップスで状態が渡された場合はそれを使用、そうでなければローカル状態を使用
  const isCardFormOpen = propIsCardFormOpen ?? localIsCardFormOpen;
  const setIsCardFormOpen = propSetIsCardFormOpen ?? setLocalIsCardFormOpen;
  const [activeTab, setActiveTab] = useState<string>("all");
  const [mainTab, setMainTab] = useState<"timeline" | "dashboard" | "ranking">("timeline");
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [filterBy, setFilterBy] = useState<"all" | "person" | "department">("all");
  const [filterValue, setFilterValue] = useState<string>("");
  const { toast } = useToast();

  // URLパラメータから成功メッセージを読み取り
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'card_sent') {
      toast({
        title: "送信完了！",
        description: "サンクスカードを送信しました",
        duration: 3000,
      });
      // URLからパラメータを削除
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const { data: cards = [], isLoading, refetch } = useQuery<CardWithRelations[]>({
    queryKey: ['/api/cards'],
    refetchInterval: 30000,
  });

  // 人・部署のユニークリストを生成
  const uniquePeople = [...new Set(cards.flatMap(card => {
    const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
    return allUsers.map(user => user.displayName || user.name);
  }))].sort();

  const uniqueDepartments = [...new Set(cards.flatMap(card => {
    const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
    return allUsers.map(user => user.department).filter(Boolean);
  }))].sort();

  // フィルタリングロジック
  const filteredCards = cards.filter((card) => {
    const recipients = [card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
    const recipientIds = recipients.map(r => r?.id).filter(Boolean);
    
    // タブフィルター
    if (activeTab === "received" && !recipientIds.includes(user.id)) return false;
    if (activeTab === "sent" && card.senderId !== user.id) return false;
    if (activeTab === "liked" && !(card.likes?.some(like => like.userId === user.id) || false)) return false;
    
    // 人・部署フィルター
    if (filterBy === "person" && filterValue) {
      const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
      const hasMatchingPerson = allUsers.some(user => (user.displayName || user.name) === filterValue);
      if (!hasMatchingPerson) return false;
    }
    
    if (filterBy === "department" && filterValue) {
      const allUsers = [card.sender, card.recipient, ...(card.additionalRecipients as User[] || [])].filter(Boolean);
      const hasMatchingDepartment = allUsers.some(user => user.department === filterValue);
      if (!hasMatchingDepartment) return false;
    }
    
    return true;
  }).sort((a, b) => {
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

  // カードリスト表示関数
  const renderCardList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3990EA]"></div>
        </div>
      );
    }

    if (filteredCards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === "all" && "カードがありません"}
            {activeTab === "received" && "受け取ったカードがありません"}
            {activeTab === "sent" && "送ったカードがありません"}
          </h3>
          <p className="text-gray-500 text-sm max-w-sm">
            {activeTab === "sent" 
              ? "感謝の気持ちを伝えるサンクスカードを送ってみましょう"
              : "新しいカードが投稿されるとここに表示されます"
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-6">
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

      {/* モバイル用のフローティング感謝ボタン */}
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

      {/* メインコンテンツエリア */}
      <Tabs value={mainTab} onValueChange={(value) => setMainTab(value as "timeline" | "dashboard" | "ranking")} className="flex flex-col h-full">
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
                <SelectTrigger className="w-[100px] h-8 text-sm">
                  <SelectValue placeholder="新しい順" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">新しい順</SelectItem>
                  <SelectItem value="popular">人気順</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all" onValueChange={(value) => setFilterBy(value as "all" | "person" | "department")}>
                <SelectTrigger className="w-[100px] h-8 text-sm">
                  <SelectValue placeholder="全て" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全て</SelectItem>
                  <SelectItem value="person">人で絞込</SelectItem>
                  <SelectItem value="department">部署で絞込</SelectItem>
                </SelectContent>
              </Select>
              {filterBy !== 'all' && (
                <Select defaultValue="" onValueChange={setFilterValue}>
                  <SelectTrigger className="w-[120px] h-8 text-sm">
                    <SelectValue placeholder={filterBy === 'person' ? '人を選択' : '部署を選択'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterBy === 'person' ? 
                      uniquePeople.map((person: string) => (
                        <SelectItem key={person} value={person}>{person}</SelectItem>
                      )) :
                      uniqueDepartments.map((dept: string) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>



          {/* タブ切り替えとカードリスト */}
          <Tabs 
            value={activeTab} 
            className="flex flex-col flex-1 overflow-hidden" 
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3 mx-4 mb-4 flex-shrink-0">
              <TabsTrigger value="all">すべて</TabsTrigger>
              <TabsTrigger value="sent">送った</TabsTrigger>
              <TabsTrigger value="received">受け取った</TabsTrigger>
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
            </div>
          </Tabs>
        </TabsContent>

        <TabsContent value="dashboard" className="flex-1">
          <Dashboard />
        </TabsContent>

        <TabsContent value="ranking" className="flex-1">
          <Ranking />
        </TabsContent>
        </div>

        {/* フッタータブナビゲーション */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
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

      {/* コンテンツ下部のパディング（フッターと重ならないように） */}
      <div className="h-16"></div>
    </div>
  );
}