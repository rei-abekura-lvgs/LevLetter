import { useState } from "react";
import { CardWithRelations, User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Heart, MessageSquare, Share } from "lucide-react";
import LikeForm from "./like-form";
import { BearLogo } from "@/components/bear-logo";

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

  // 全ての受信者を配列として取得
  const allRecipients = [
    card.recipient as User,
    ...(card.additionalRecipientUsers || [])
  ];

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
          {card.sender.customAvatarUrl ? (
            <AvatarImage 
              src={card.sender.customAvatarUrl} 
              alt={card.sender.displayName || card.sender.name}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-transparent flex items-center justify-center">
              <img src="/bear_icon.png" alt="" className="w-10 h-10 object-contain" />
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <div className="font-medium">{card.sender.displayName || card.sender.name}</div>
          <div className="text-sm text-gray-500">
            {format(new Date(card.createdAt), "yyyy年MM月dd日 HH:mm", { locale: ja })}
          </div>
        </div>
      </div>

      {/* メインコンテンツ: 左80%メッセージ、右20%アバター */}
      <div className="flex gap-4 mb-4">
        {/* メッセージエリア (80%) */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-600 mb-2">
            <span className="text-gray-800 font-medium">{recipientName}</span>
            {allRecipients.length > 1 && (
              <span className="text-[#3990EA] font-medium">他{allRecipients.length - 1}人</span>
            )}
            <span className="text-gray-600">へ</span>
          </div>
          <p className="whitespace-pre-line text-gray-800 leading-relaxed">{card.message}</p>
        </div>
        
        {/* アバターエリア (20%) */}
        <div className="w-1/5 flex-shrink-0 relative min-h-[60px]">
          {allRecipients.map((recipient, index) => (
            <div 
              key={recipient.id} 
              className="absolute"
              style={{
                right: index * 8, // 8pxずつ左にずらして重ねる
                top: index * 6,   // 6px下にずらす
                zIndex: allRecipients.length - index, // 最初のアバターが最前面
              }}
            >
              <div className="relative h-12 w-12 ring-2 ring-white shadow-md rounded-full overflow-hidden bg-red-500">
                <div className="w-full h-full flex items-center justify-center bg-green-500">
                  <span className="text-white text-lg font-bold">
                    TEST
                  </span>
                </div>
              </div>
              {/* ポイントバッジ */}
              <div className="absolute -top-1 -right-1 bg-[#3990EA] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm">
                {Math.floor((card.points || 0) / allRecipients.length)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* アクション */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center space-x-2">
          <Dialog open={isLikeDialogOpen} onOpenChange={setIsLikeDialogOpen}>
            <DialogTrigger asChild>
              <div 
                className="relative"
                title={card.likes.length > 0 ? `いいねした人: ${card.likes.map(like => like.user.displayName || like.user.name).join(', ')}` : 'まだいいねはありません'}
              >
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`flex items-center ${userLike ? 'text-red-500' : 'text-gray-600'}`}
                >
                  <Heart 
                    className={`h-5 w-5 mr-1 ${userLike ? 'fill-red-500' : ''}`} 
                  />
                  <span>{card.likes.length * 2}pt</span>
                </Button>
              </div>
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
            <span>{card.likes.length * 2}pt</span>
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