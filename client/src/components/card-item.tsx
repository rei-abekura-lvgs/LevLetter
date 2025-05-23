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
            <AvatarFallback className="p-0 border-0">
              <BearLogo size={40} useTransparent={true} bgColor="bg-[#3990EA]" />
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

      {/* カード内容 */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-3">
          <div className="font-medium mb-2">
            <span className="text-gray-800"> さんへ</span>
          </div>
          
          {/* 受信者のアバターとポイント表示 */}
          <div className="flex flex-wrap gap-3">
            {/* メイン受信者 */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    {card.recipientType === "user" && (card.recipient as User).customAvatarUrl ? (
                      <AvatarImage 
                        src={(card.recipient as User).customAvatarUrl!} 
                        alt={recipientName}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="p-0 border-0">
                        <BearLogo size={48} useTransparent={true} bgColor="bg-[#3990EA]" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {/* ポイントバッジ */}
                  <div className="absolute -top-1 -right-1 bg-[#3990EA] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {card.additionalRecipientUsers && card.additionalRecipientUsers.length > 0 
                      ? Math.floor((card.points || 0) / (1 + card.additionalRecipientUsers.length))
                      : (card.points || 0)
                    }
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800">{recipientName}</span>
              </div>
            </div>
            
            {/* 追加の受信者がいれば表示 */}
            {card.additionalRecipientUsers && card.additionalRecipientUsers.length > 0 && (
              <>
                {card.additionalRecipientUsers.map((user) => (
                  <div key={user.id} className="relative">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          {user.customAvatarUrl ? (
                            <AvatarImage 
                              src={user.customAvatarUrl} 
                              alt={user.displayName || user.name}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarFallback className="p-0 border-0">
                              <BearLogo size={48} useTransparent={true} bgColor="bg-[#3990EA]" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {/* ポイントバッジ */}
                        <div className="absolute -top-1 -right-1 bg-[#3990EA] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                          {Math.floor((card.points || 0) / (1 + (card.additionalRecipientUsers?.length || 0)))}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{user.displayName || user.name}</span>
                    </div>
                  </div>
                ))}
              </>
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
                <span>{card.likes.length}</span>
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