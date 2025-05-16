import { useState } from "react";
import { CardWithRelations, User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, MessageSquare, Share } from "lucide-react";
import LikeForm from "./like-form";

interface CardItemProps {
  card: CardWithRelations;
  currentUser: User;
}

export default function CardItem({ card, currentUser }: CardItemProps) {
  const [isLikeDialogOpen, setIsLikeDialogOpen] = useState(false);

  // 自分がいいねしたか
  const userLike = card.likes.find(like => like.user.id === currentUser.id);

  // 受信者の表示名を取得
  const recipientName = 
    card.recipientType === "team" 
      ? (card.recipient as any).name 
      : (card.recipient as User).displayName || (card.recipient as User).name;

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
    <div className="bg-white rounded-lg shadow p-4">
      {/* 送信者情報 */}
      <div className="flex items-center mb-3">
        <Avatar className="h-10 w-10 mr-3">
          <AvatarFallback style={{ backgroundColor: card.sender.avatarColor }}>
            {getInitials(card.sender.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{card.sender.displayName || card.sender.name}</div>
          <div className="text-sm text-gray-500">
            {format(new Date(card.createdAt), "yyyy年MM月dd日 HH:mm", { locale: ja })}
          </div>
        </div>
      </div>

      {/* カード内容 */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">
          <div className="font-medium flex justify-between items-center">
            <div>
              {/* メイン受信者 */}
              <span>{recipientName}</span>
              
              {/* 追加の受信者がいれば表示 */}
              {card.additionalRecipientUsers && card.additionalRecipientUsers.length > 0 && (
                <>
                  <span>、</span>
                  {card.additionalRecipientUsers.map((user, index) => (
                    <span key={user.id}>
                      {user.displayName || user.name}
                      {index < card.additionalRecipientUsers!.length - 1 ? "、" : ""}
                    </span>
                  ))}
                </>
              )}
              <span> さんへ</span>
            </div>
            
            {/* ポイント表示 */}
            {card.points > 0 && (
              <div className="bg-primary-50 text-primary-700 px-2 py-1 rounded-md text-xs font-bold flex items-center">
                {/* 複数の受信者がいる場合は按分されたポイントを表示 */}
                {card.additionalRecipientUsers && card.additionalRecipientUsers.length > 0 ? (
                  <>
                    <span>{Math.floor(card.points / (1 + card.additionalRecipientUsers.length))} PT</span>
                    <span className="text-xs text-gray-500 ml-1">/ 人</span>
                  </>
                ) : (
                  <span>{card.points} PT</span>
                )}
              </div>
            )}
          </div>
        </div>
        <p className="whitespace-pre-line">{card.message}</p>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center space-x-2">
          <Dialog open={isLikeDialogOpen} onOpenChange={setIsLikeDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center ${userLike ? 'text-red-500' : 'text-gray-600'}`}
              >
                <Heart 
                  className={`h-5 w-5 mr-1 ${userLike ? 'fill-red-500' : ''}`} 
                />
                <span>{card.totalPoints || 0}</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <LikeForm 
                cardId={card.id} 
                onClose={() => setIsLikeDialogOpen(false)}
                hasLiked={!!userLike}
              />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" className="text-gray-600">
            <MessageSquare className="h-5 w-5 mr-1" />
            <span>{card.likes.length}</span>
          </Button>
        </div>

        {card.public && (
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Share className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}