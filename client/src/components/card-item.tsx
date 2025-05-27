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
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
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
          <span className="text-gray-800 font-medium">{recipientName}</span>
          {allRecipients.length > 1 && (
            <span className="text-[#3990EA] font-medium">他{allRecipients.length - 1}人</span>
          )}
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
          <Dialog open={isLikeDialogOpen} onOpenChange={setIsLikeDialogOpen}>
            <DialogTrigger asChild>
              <div className="relative group">
                {/* いいねした人の名前表示 - 横長ツールチップ */}
                {card.likes.length > 0 && (
                  <div className="absolute -top-12 left-0 right-0 bg-gray-800 text-white text-xs rounded px-3 py-2 z-30 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                    <div className="font-medium mb-1">いいね！({card.likes.length * 2}pt)</div>
                    <div className="text-xs opacity-80">
                      {(() => {
                        // 同じユーザーのいいねをまとめる
                        const groupedLikes = card.likes.reduce((acc: any, like: any) => {
                          const userName = like.user.displayName || like.user.name;
                          if (acc[userName]) {
                            acc[userName] += 2; // 常に2ptずつ
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