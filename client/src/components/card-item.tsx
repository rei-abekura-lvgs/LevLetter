import { CardWithRelations, User, CardReaction } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, MessageSquare, Share } from "lucide-react";
import { BearLogo } from "@/components/bear-logo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CardReactions } from "@/components/card-reactions";

interface CardItemProps {
  card: CardWithRelations;
  currentUser: User;
  isUnread?: boolean;
  reactions?: Array<CardReaction & { user: User }>;
  onRefresh?: () => void | Promise<any>;
  onMarkAsRead?: (cardId: number) => void;
}

export default function CardItem({ card, currentUser, isUnread = false, reactions, onRefresh, onMarkAsRead }: CardItemProps) {
  const queryClient = useQueryClient();
  
  // 自分がいいねしたか
  const userLike = card.likes.find(like => like.user.id === currentUser.id);

  // いいね機能のミューテーション
  const likeMutation = useMutation({
    mutationFn: () => apiRequest(`/api/cards/${card.id}/likes`, 'POST'),
    onMutate: async () => {
      // 楽観的更新：カードデータを即座に更新
      await queryClient.cancelQueries({ queryKey: ['/api/cards'] });
      const previousCards = queryClient.getQueryData(['/api/cards']);
      
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

      // 楽観的更新：ユーザーポイントを即座に減少
      queryClient.setQueryData(['/api/auth/me'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          weeklyPoints: Math.max(0, oldData.weeklyPoints - 2)
        };
      });

      return { previousCards };
    },
    onError: (error, variables, context) => {
      // エラー時はロールバック
      if (context?.previousCards) {
        queryClient.setQueryData(['/api/cards'], context.previousCards);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        variant: "destructive",
        title: "エラー",
        description: error instanceof Error ? error.message : "いいね処理に失敗しました"
      });
    },
    onSuccess: () => {
      // 成功時はサーバーデータで更新
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  const handleLike = () => {
    // ポイント不足チェック
    if (currentUser.weeklyPoints < 2) {
      toast({
        variant: "destructive",
        title: "ポイント不足",
        description: "いいねするには2pt必要です"
      });
      return;
    }

    // 既にいいね済みチェック
    if (userLike) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "既にいいね済みです"
      });
      return;
    }

    // 自分のカードにはいいねできない（送信者チェック）
    if (card.senderId === currentUser.id) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "自分のカードにはいいねできません"
      });
      return;
    }

    // 受信者もいいねできない
    const isRecipient = card.recipientId === currentUser.id || 
      (card.additionalRecipients && card.additionalRecipients.includes(currentUser.id));
    
    if (isRecipient) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: "受信者はいいねできません"
      });
      return;
    }

    likeMutation.mutate();
  };

  // 受信者の表示名を取得
  const recipientName = 
    card.recipientType === "team" 
      ? (card.recipient as any).name 
      : (card.recipient as User).displayName || (card.recipient as User).name;

  // 全ての受信者を配列として取得
  const allRecipients = [
    card.recipient as User,
    ...(card.additionalRecipientUsers || [])
  ].filter(recipient => recipient && typeof recipient === 'object' && 'displayName' in recipient);

  // ユーザーのイニシャルを取得
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-3 sm:p-4 ${isUnread ? 'border-l-4 border-blue-200' : ''}`}>
      {/* 送信者情報 */}
      <div className="flex items-center mb-3">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 flex-shrink-0">
          {card.sender.customAvatarUrl ? (
            <AvatarImage 
              src={card.sender.customAvatarUrl} 
              alt={card.sender.displayName || card.sender.name}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-transparent flex items-center justify-center">
              <img src="/bear_icon.png" alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm sm:text-base truncate">{card.sender.displayName || card.sender.name}</div>
          <div className="text-xs sm:text-sm text-gray-500 truncate">
            {format(new Date(card.createdAt), "MM/dd HH:mm", { locale: ja })}
          </div>
        </div>
      </div>

      {/* メインコンテンツ: レスポンシブレイアウト */}
      <div className="mb-4">
        {/* 受信者表示 */}
        <div className="text-xs sm:text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-1">
          {allRecipients.map((recipient, index) => (
            <span key={recipient.id} className="text-gray-800 font-medium">
              {recipient.displayName || recipient.name}
              {index < allRecipients.length - 1 && <span className="text-gray-500 mx-1">、</span>}
            </span>
          ))}
          <span className="text-gray-600">へ</span>
        </div>

        {/* メッセージとアバター */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* メッセージエリア */}
          <div className="flex-1 min-w-0">
            <p className="whitespace-pre-line text-gray-800 leading-relaxed text-sm sm:text-base">{card.message}</p>
          </div>
          
          {/* アバターエリア - レスポンシブ対応 */}
          <div className="flex sm:flex-col items-center sm:items-end justify-center sm:justify-start flex-shrink-0 relative sm:w-20">
            {allRecipients.map((recipient, index) => (
              <div 
                key={recipient.id} 
                className={`relative ${index > 0 ? '-ml-2 sm:ml-0 sm:-mt-2' : ''}`}
                style={{
                  zIndex: allRecipients.length - index,
                }}
              >
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white shadow-md">
                  {recipient.customAvatarUrl ? (
                    <AvatarImage 
                      src={recipient.customAvatarUrl} 
                      alt={recipient.displayName || recipient.name}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-transparent flex items-center justify-center">
                      <img src="/bear_icon.png" alt="" className="w-10 h-10 sm:w-12 sm:w-12 object-contain" />
                    </AvatarFallback>
                  )}
                </Avatar>
                {/* ポイントバッジ */}
                <div className="absolute -top-1 -right-1 bg-[#3990EA] text-white text-xs font-bold rounded-full min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center px-1 shadow-sm">
                  {Math.floor((card.points || 0) / allRecipients.length)}pt
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center space-x-2">
          {/* いいねボタン - 1クリック即座実行 */}
          <div className="relative group">
            {/* ツールチップ - いいねした人の表示 */}
            {card.likes.length > 0 && (
              <div className="absolute -top-12 left-0 bg-gray-800 text-white text-xs rounded px-3 py-2 z-30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <div className="font-medium mb-1">いいね！({card.likes.length * 2}pt)</div>
                <div className="text-xs opacity-80">
                  {(() => {
                    // 同じユーザーのいいねをまとめる
                    const groupedLikes = card.likes.reduce((acc: any, like: any) => {
                      const userName = like.user.displayName || like.user.name;
                      if (acc[userName]) {
                        acc[userName] += 2;
                      } else {
                        acc[userName] = 2;
                      }
                      return acc;
                    }, {});
                    
                    return Object.entries(groupedLikes)
                      .map(([name, points]) => (points as number) === 2 ? name : `${name}(${points}pt)`)
                      .join('、');
                  })()}
                </div>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending || !!userLike || card.senderId === currentUser.id}
              className={`text-gray-600 ${userLike ? 'text-red-500' : ''} ${likeMutation.isPending ? 'opacity-50' : ''}`}
            >
              <Heart 
                className={`h-5 w-5 mr-1 ${userLike ? 'fill-red-500 text-red-500' : ''}`} 
              />
              <span>{card.likes.length * 2}pt</span>
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="text-gray-600">
            <MessageSquare className="h-5 w-5 mr-1" />
            <span>コメント</span>
          </Button>
        </div>

        {card.public && (
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Share className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* リアクション機能 */}
      <CardReactions
        cardId={card.id}
        currentUserId={currentUser.id}
        isRecipient={card.recipientId === currentUser.id || (card.additionalRecipients && card.additionalRecipients.some(r => r.id === currentUser.id))}
        reactions={reactions}
      />
    </div>
  );
}