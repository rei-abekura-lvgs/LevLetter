import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CardWithRelations, User } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { useSearch } from "@/hooks/useSearch";
import { useOptimisticUpdates } from "@/hooks/use-optimistic-updates";
import { CardList } from "@/components/card-list";
import { TabNavigation } from "@/components/tab-navigation";
import { FilterControls } from "@/components/filter-controls";
import { TabType, SortOrder, TabCounts } from "@/types/common";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Calendar, Clock, Heart, MessageSquare, RotateCcw, 
  User as UserIcon, Send, Plus, Eye, EyeOff, Trash2,
  BarChart3, TrendingUp, Activity, Info, Search, Check, ChevronsUpDown, X
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
const CardItem = ({ card, currentUser, onRefresh, onMarkAsRead }: { card: CardWithRelations, currentUser: User, onRefresh?: () => void, onMarkAsRead?: (cardId: number) => void }) => {
  const formattedDate = format(new Date(card.createdAt), 'yyyy年MM月dd日', { locale: ja });
  const timeFromNow = format(new Date(card.createdAt), 'HH:mm', { locale: ja });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailsTab, setDetailsTab] = useState<"recipients" | "likes">("recipients");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observerで既読状態を管理
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || !onMarkAsRead) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            // カードの50%以上が表示されたら既読にする
            onMarkAsRead(card.id);
          }
        });
      },
      {
        threshold: 0.5, // 50%表示されたら発火
        rootMargin: '0px'
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.unobserve(cardElement);
    };
  }, [card.id, onMarkAsRead]);

  // いいね詳細データを取得
  const { data: likeDetails } = useQuery({
    queryKey: [`/api/cards/${card.id}/likes`],
    enabled: showDetailsDialog,
  });

  // 削除権限チェック
  useEffect(() => {
    const checkDeletePermission = () => {
      // 管理者またはカード送信者のみ削除可能
      const isAdmin = currentUser.isAdmin;
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
    <Card ref={cardRef} id={`card-${card.id}`} className="mb-4 last:mb-0 border-none shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-200">
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
            {card.tags.map((tag: string, index: number) => (
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
                className={`h-8 px-2 transition-all duration-300 transform ${
                  !canLike 
                    ? 'text-gray-400 cursor-not-allowed opacity-50' 
                    : userHasLiked 
                    ? 'text-pink-500 bg-pink-50 hover:text-pink-600 hover:bg-pink-100 scale-110' 
                    : 'text-gray-600 hover:text-pink-500 hover:bg-pink-50 hover:scale-105'
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
                    
                    // ヘッダーのポイント表示も即座に更新
                    console.log('楽観的更新前のポイント:', currentUser.weeklyPoints);
                    const updatedUser = {
                      ...currentUser,
                      weeklyPoints: Math.max(0, currentUser.weeklyPoints - 2)
                    };
                    console.log('楽観的更新後のポイント:', updatedUser.weeklyPoints);
                    
                    // クエリキャッシュも更新
                    queryClient.setQueryData(['/api/auth/me'], updatedUser);
                    
                    // ダッシュボードのキャッシュも同時に更新
                    queryClient.setQueryData(['/api/dashboard/stats'], (oldStats: any) => {
                      if (!oldStats) return oldStats;
                      return {
                        ...oldStats,
                        weekly: {
                          ...oldStats.weekly,
                          currentPoints: Math.max(0, oldStats.weekly.currentPoints - 2)
                        }
                      };
                    });
                  };
                  
                  // 即座にUIを更新
                  optimisticUpdate();
                  
                  try {
                    await apiRequest('POST', `/api/cards/${card.id}/likes`);
                    // サーバーからの正確なデータで更新
                    onRefresh?.();
                    // ヘッダーのポイント表示を即座に更新
                    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
                    // ヘッダーのポイント情報を強制的にリフェッチして即座に更新
                    queryClient.refetchQueries({ queryKey: ['/api/auth/me'] });
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
                <Heart className={`h-4 w-4 transition-all duration-200 ${userHasLiked ? 'fill-current' : ''}`} />
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
  const { updateUser } = useAuth();
  const { addLikeOptimistically } = useOptimisticUpdates();
  const [sortOrder, setSortOrder] = useState<"newest" | "popular">("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
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




  const { toast } = useToast();
  
  // 日本語名をローマ字に変換する関数
  const convertToRomaji = (name: string): string => {
    if (!name) return '';
    
    // 基本的な漢字→ローマ字変換マッピング
    return name
      .replace(/阿部倉/g, 'abekura')
      .replace(/怜/g, 'rei')
      .replace(/田中/g, 'tanaka')
      .replace(/佐藤/g, 'sato')
      .replace(/鈴木/g, 'suzuki')
      .replace(/高橋/g, 'takahashi')
      .replace(/山田/g, 'yamada')
      .replace(/小林/g, 'kobayashi')
      .replace(/加藤/g, 'kato')
      .replace(/吉田/g, 'yoshida')
      .replace(/山本/g, 'yamamoto')
      .replace(/中村/g, 'nakamura')
      .replace(/小川/g, 'ogawa')
      .replace(/斎藤/g, 'saito')
      .replace(/松本/g, 'matsumoto')
      .replace(/井上/g, 'inoue')
      .replace(/木村/g, 'kimura')
      .replace(/林/g, 'hayashi')
      .replace(/清水/g, 'shimizu')
      .replace(/山口/g, 'yamaguchi')
      .replace(/森/g, 'mori')
      .replace(/太郎/g, 'taro')
      .replace(/次郎/g, 'jiro')
      .replace(/三郎/g, 'saburo')
      .replace(/花子/g, 'hanako')
      .replace(/美香/g, 'mika')
      .replace(/真一/g, 'shinichi')
      .replace(/健太/g, 'kenta')
      .replace(/優/g, 'yu')
      .replace(/翔/g, 'sho')
      .replace(/愛/g, 'ai')
      .replace(/恵/g, 'megumi')
      .replace(/修/g, 'osamu')
      .replace(/聡/g, 'satoshi')
      .replace(/誠/g, 'makoto')
      .replace(/牧野/g, 'makino')
      .replace(/康太/g, 'kota')
      .replace(/石田/g, 'ishida')
      .replace(/安藤/g, 'ando')
      .replace(/稲垣/g, 'inagaki')
      .replace(/弘輝/g, 'hiroki')
      .replace(/貴義/g, 'takayoshi')
      .replace(/啓介/g, 'keisuke');
  };
  
  // 既読カードIDを管理（localStorageに保存）
  const [readCardIds, setReadCardIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem(`readCards_${user.id}`);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // 既読状態をlocalStorageに保存
  useEffect(() => {
    localStorage.setItem(`readCards_${user.id}`, JSON.stringify(Array.from(readCardIds)));
  }, [readCardIds, user.id]);

  // カードを既読にする関数
  const markCardAsRead = (cardId: number) => {
    setReadCardIds(prev => new Set(Array.from(prev).concat(cardId)));
  };

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

  // 全ユーザーデータを取得
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // URLパラメータを処理してカードにジャンプ
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('cardId');
    
    console.log("🎯 URLパラメータチェック:", { cardId, cardsLength: cards.length });
    
    if (cardId && cards.length > 0) {
      const targetCard = cards.find(card => card.id === parseInt(cardId));
      console.log("🔍 対象カード検索:", { targetCard: targetCard ? `ID${targetCard.id}` : '見つからない' });
      
      if (targetCard) {
        // カードの送信者が現在のユーザーかどうかで適切なタブを設定
        const isReceivedCard = targetCard.recipientId === user.id || 
                              (targetCard.additionalRecipients && targetCard.additionalRecipients.includes(user.id));
        
        console.log("📋 タブ判定:", { isReceivedCard, recipientId: targetCard.recipientId, userId: user.id });
        
        if (isReceivedCard) {
          setActiveTab("received");
          console.log("✅ 受信タブに切り替え");
        } else {
          setActiveTab("sent");
          console.log("✅ 送信タブに切り替え");
        }
        
        // タイムラインタブに切り替え
        setMainTab("timeline");
        console.log("✅ タイムラインタブに切り替え");
        
        // 少し遅延してからスクロール（DOM更新を待つ）
        setTimeout(() => {
          const cardElement = document.getElementById(`card-${cardId}`);
          console.log("🎯 スクロール対象要素:", cardElement ? '発見' : '見つからない');
          if (cardElement) {
            cardElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            console.log("✅ カードにスクロール完了");
            // URLパラメータをクリア
            window.history.replaceState({}, '', window.location.pathname);
            console.log("🧹 URLパラメータクリア完了");
          }
        }, 500);
      }
    }
  }, [cards, user.id]);

  // 部署のユニークリストを生成（カードから）
  const uniqueDepartments = Array.from(new Set(cards.flatMap(card => {
    const allCardUsers = [card.sender, card.recipient, ...(card.additionalRecipients || [])].filter(Boolean);
    return allCardUsers.map(user => (typeof user === 'object' && user && 'department' in user) ? user.department : null).filter(Boolean);
  }))).sort();

  // 検索とフィルタリング用の部署リスト
  const departmentOptions = uniqueDepartments
    .filter(dept => dept != null)
    .map(dept => ({ id: dept!, name: dept! }));

  // カード検索とフィルタリング機能
  const filterCards = (cards: CardWithRelations[]) => {
    return cards.filter(card => {
      // 検索クエリでフィルタリング
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const senderName = (typeof card.sender === 'object' && card.sender?.name) ? card.sender.name.toLowerCase() : '';
        const recipientName = (typeof card.recipient === 'object' && card.recipient?.name) ? card.recipient.name.toLowerCase() : '';
        const message = card.message.toLowerCase();
        
        if (!senderName.includes(query) && !recipientName.includes(query) && !message.includes(query)) {
          return false;
        }
      }

      // 部署でフィルタリング（"all"以外の場合のみ）
      if (departmentFilter && departmentFilter !== "all") {
        const allCardUsers = [card.sender, card.recipient, ...(card.additionalRecipients || [])].filter(Boolean);
        const hasDepartmentMatch = allCardUsers.some(user => 
          typeof user === 'object' && user && 'department' in user && user.department === departmentFilter
        );
        if (!hasDepartmentMatch) {
          return false;
        }
      }

      return true;
    });
  };

  // 各タブの通知数を計算（重要な通知のみ目立たせる）
  const getTabCounts = () => {
    // 受信したカード数（未読のみ）
    const receivedCards = cards.filter(card => {
      // additionalRecipientsが数値配列かユーザーオブジェクト配列かを判定
      const additionalRecipients = Array.isArray(card.additionalRecipients) 
        ? card.additionalRecipients.map((item: any) => 
            typeof item === 'number' ? allUsers?.find((u: User) => u.id === item) : item
          ).filter(Boolean)
        : [];
      
      const recipients = [card.recipient, ...additionalRecipients].filter(Boolean);
      const recipientIds = recipients.map(r => typeof r === 'object' && r && 'id' in r ? r.id : null).filter(Boolean);
      return recipientIds.includes(user.id);
    });

    // 未読の受信カード
    const unreadReceivedCards = receivedCards.filter(card => !readCardIds.has(card.id));

    // 自分の送信カードがいいねされた数（未読のみ）
    const sentCardsWithLikes = cards.filter(card => 
      card.senderId === user.id && 
      (card.likes?.length || 0) > 0
    );

    // 未読のいいね通知
    const unreadLikeNotifications = sentCardsWithLikes.filter(card => !readCardIds.has(card.id));

    // 「すべて」タブ用の未読カード数（受信＋いいね通知）
    const allUnreadCount = unreadReceivedCards.length + unreadLikeNotifications.length;

    const counts = {
      all: allUnreadCount, // 未読の合計数のみ表示
      sent: unreadLikeNotifications.length, // 未読のいいね通知数のみ表示
      received: unreadReceivedCards.length, // 未読の受信カード数のみ表示
      liked: cards.filter(card => card.likes?.some(like => like.userId === user.id) || false).length, // 控えめ表示
      // 通知の重要度フラグ（未読があるかどうか）
      isReceivedImportant: unreadReceivedCards.length > 0,
      isSentImportant: unreadLikeNotifications.length > 0
    };
    return counts;
  };

  const tabCounts = getTabCounts();

  // フィルタリングロジック
  const filteredCards = cards.filter((card) => {
    // additionalRecipientsが数値配列かユーザーオブジェクト配列かを判定
    const additionalRecipients = Array.isArray(card.additionalRecipients) 
      ? card.additionalRecipients.map((item: any) => 
          typeof item === 'number' ? allUsers?.find((u: User) => u.id === item) : item
        ).filter(Boolean)
      : [];
    
    const recipients = [card.recipient, ...additionalRecipients].filter(Boolean);
    const recipientIds = recipients.map(r => typeof r === 'object' && r && 'id' in r ? r.id : null).filter(Boolean);
    
    // タブフィルター
    if (activeTab === "received" && !recipientIds.includes(user.id)) return false;
    if (activeTab === "sent" && card.senderId !== user.id) return false;
    if (activeTab === "liked" && !(card.likes?.some(like => like.userId === user.id) || false)) return false;
    
    // 検索フィルターは今後実装予定
    
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
            {activeTab === "received" && "もらったカードがありません"}
            {activeTab === "sent" && "送ったカードがありません"}
            {activeTab === "liked" && "いいねしたカードがありません"}
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
        {filteredCards.map((card) => {
          // カードが未読かどうかを判定
          const isUnread = !readCardIds.has(card.id);
          
          return (
            <CardItem 
              key={card.id} 
              card={card} 
              currentUser={user}
            />
          );
        })}
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
          <DialogHeader className="sr-only">
            <DialogTitle>サンクスカードを送る</DialogTitle>
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
          {/* Twitter風レイアウト - タブを最上部に配置 */}
          <Tabs 
            value={activeTab} 
            className="flex flex-col flex-1 overflow-hidden" 
            onValueChange={setActiveTab}
          >
            {/* 美しいタブナビゲーション */}
            <TabsList className="grid w-full grid-cols-4 mx-4 mb-4 flex-shrink-0 bg-gray-50 rounded-lg">
              <TabsTrigger value="all" className="relative">
                すべて
              </TabsTrigger>
              <TabsTrigger value="sent" className="relative">
                送った
              </TabsTrigger>
              <TabsTrigger value="received" className="relative">
                もらった
              </TabsTrigger>
              <TabsTrigger value="liked" className="relative">
                いいね
              </TabsTrigger>
            </TabsList>

            {/* テキストボックス風の投稿エリア */}
            <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-gray-50/80 border-b border-gray-200/60 flex-shrink-0 backdrop-blur-sm relative overflow-hidden">
              {/* 背景装飾 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-50/30 to-indigo-50/30 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                {/* テキストボックス風の投稿ボタン */}
                <div 
                  onClick={() => setIsCardFormOpen(true)}
                  className="flex-1 max-w-lg bg-white border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-[#3990EA] hover:bg-blue-50/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-6 h-6 bg-[#3990EA] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">感謝の手紙を作成する...</span>
                  </div>
                </div>
                
                {/* カード数、ソート、検索 */}
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs text-gray-600 bg-white/70 border-gray-300">
                    {filteredCards.length}件
                  </Badge>
                  
                  {/* 新しいFilterControlsコンポーネントを使用 */}
                  <FilterControls
                    sortOrder={sortOrder}
                    onSortChange={(order: SortOrder) => setSortOrder(order)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    departmentFilter={departmentFilter}
                    onDepartmentChange={setDepartmentFilter}
                    departments={departmentOptions}
                  />
                </div>
              </div>
              </div>
            </div>

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

        <TabsContent value="dashboard" className="flex-1">
          <Dashboard />
        </TabsContent>

        <TabsContent value="ranking" className="flex-1">
          <Ranking />
        </TabsContent>
        </div>

      </Tabs>
    </div>
  );
}