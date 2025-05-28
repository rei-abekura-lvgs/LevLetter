import { CardWithRelations, User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, MessageSquare, Share } from "lucide-react";
import { BearLogo } from "@/components/bear-logo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import UnifiedAvatar from "@/components/unified-avatar";

interface CardItemProps {
  card: CardWithRelations;
  currentUser: User;
  onRefresh?: () => void;
  onMarkAsRead?: (cardId: number) => void;
}

export function CardItem({ card, currentUser, onRefresh, onMarkAsRead }: CardItemProps) {
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

      return { previousCards };
    },
    onError: (err, variables, context) => {
      // エラー時は元のデータに戻す
      if (context?.previousCards) {
        queryClient.setQueryData(['/api/cards'], context.previousCards);
      }
      toast({
        title: "エラー",
        description: "いいねの送信に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "いいね！",
        description: "2pt使用しました（送信者1pt、受信者1pt）",
      });
      if (onRefresh) {
        onRefresh();
      }
    },
    onSettled: () => {
      // 最終的にサーバーから最新データを取得
      queryClient.invalidateQueries({ queryKey: ['/api/cards'] });
    }
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  // 受信者のリストを構築
  const recipients = [card.recipient];
  if (card.additionalRecipients && Array.isArray(card.additionalRecipients)) {
    recipients.push(...(card.additionalRecipients as User[]));
  }

  // カードが自分宛かどうかを判定
  const isForCurrentUser = recipients.some(recipient => recipient.id === currentUser.id);

  return (
    <Card className={`w-full mb-4 ${isForCurrentUser ? 'border-blue-200 bg-blue-50/30' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <UnifiedAvatar 
              user={card.sender}
              size="default"
            />
            <div>
              <CardTitle className="text-base font-medium">
                {card.sender.displayName || card.sender.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                {card.sender.department && (
                  <span className="mr-2">{card.sender.department}</span>
                )}
                {format(new Date(card.createdAt), 'M月d日 HH:mm', { locale: ja })}
              </CardDescription>
            </div>
          </div>
          <BearLogo />
        </div>
      </CardHeader>

      <CardContent>
        {/* メッセージ */}
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {card.message}
          </p>
        </div>

        {/* 受信者情報 */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>→</span>
            <div className="flex items-center space-x-2">
              {recipients.map((recipient, index) => (
                <div key={recipient.id} className="flex items-center space-x-1">
                  <UnifiedAvatar 
                    user={recipient}
                    size="sm"
                  />
                  <span className="font-medium">
                    {recipient.displayName || recipient.name}
                  </span>
                  {index < recipients.length - 1 && <span className="text-gray-400">・</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* いいねボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={
                likeMutation.isPending || 
                !!userLike || 
                card.senderId === currentUser.id ||
                recipients.some(r => r.id === currentUser.id)
              }
              className={`text-gray-600 hover:text-red-500 ${userLike ? 'text-red-500' : ''} ${likeMutation.isPending ? 'opacity-50' : ''}`}
            >
              <Heart 
                className={`h-5 w-5 mr-1 ${userLike ? 'fill-red-500 text-red-500' : ''}`} 
              />
              <span>{card.likes.length * 2}pt</span>
            </Button>

            {/* コメントボタン（将来の機能用） */}
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-500">
              <MessageSquare className="h-5 w-5 mr-1" />
              <span>コメント</span>
            </Button>
          </div>

          {/* 公開設定に応じたシェアボタン */}
          {card.public && (
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-500">
              <Share className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}