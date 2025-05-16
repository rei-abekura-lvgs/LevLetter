import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import LikeForm from "@/components/like-form";
import { HeartIcon } from "lucide-react";
import { CardWithRelations, User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CardItemProps {
  card: CardWithRelations;
  currentUser: User;
}

export default function CardItem({ card, currentUser }: CardItemProps) {
  const [showLikeForm, setShowLikeForm] = useState(false);
  
  // いいねアバターの最大表示数
  const MAX_AVATARS = 3;
  
  // 自分のカードかどうか
  const isOwnCard = card.sender.id === currentUser.id;
  
  // 自分がいいねしたかどうか
  const hasLiked = card.likes.some(like => like.userId === currentUser.id);
  
  // カード作成日をフォーマット
  const formattedDate = format(new Date(card.createdAt), "yyyy/MM/dd HH:mm", { locale: ja });
  
  // いいねしたユーザーのアバター
  const likeAvatars = card.likes.slice(0, MAX_AVATARS).map(like => like.user);
  
  // 残りのいいね数
  const remainingLikes = Math.max(0, card.likes.length - MAX_AVATARS);

  // 送信者のイニシャル
  const senderInitials = card.sender.name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <Card className="mb-4 border border-gray-100 hover:border-primary-100 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full bg-${card.sender.avatarColor} flex items-center justify-center text-white font-medium`}>
              {senderInitials}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                <span className={`text-${card.sender.avatarColor}`}>{card.sender.displayName || card.sender.name}</span>
                <span className="mx-2 text-gray-400">から</span>
                <span>
                  {card.recipientType === "team" 
                    ? card.recipient.name 
                    : card.recipient.displayName || card.recipient.name}
                </span>
                <span className="mx-2 text-gray-400">へ</span>
              </p>
              <span className="text-xs text-gray-500">{formattedDate}</span>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-800 whitespace-pre-line">{card.message}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className={cn(
                "inline-flex items-center focus:outline-none transition-colors",
                hasLiked 
                  ? "text-accent-500" 
                  : "text-gray-500 hover:text-accent-500",
                isOwnCard && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !isOwnCard && setShowLikeForm(!showLikeForm)}
              disabled={isOwnCard}
            >
              <HeartIcon className={cn("mr-1 h-5 w-5", hasLiked ? "fill-current" : "fill-none")} />
              <span className="text-sm">いいね</span>
            </button>
            
            <div className="flex items-center">
              <HeartIcon className="text-accent-500 mr-1 h-4 w-4 fill-current" />
              <span className="text-sm text-gray-700">{card.totalPoints}</span>
            </div>
          </div>
          
          {card.likes.length > 0 && (
            <div className="flex -space-x-2">
              {likeAvatars.map((user, index) => {
                const userInitials = user.name
                  .split(/\s+/)
                  .map(part => part.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join('');
                  
                return (
                  <div 
                    key={`like-avatar-${user.id}`}
                    className={`h-6 w-6 rounded-full bg-${user.avatarColor} flex items-center justify-center text-white text-xs`}
                    title={user.displayName || user.name}
                  >
                    {userInitials}
                  </div>
                );
              })}
              
              {remainingLikes > 0 && (
                <div 
                  className="h-6 w-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center"
                  title={`他${remainingLikes}人がいいねしました`}
                >
                  +{remainingLikes}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* いいねフォーム */}
        {showLikeForm && !isOwnCard && (
          <LikeForm 
            cardId={card.id} 
            onClose={() => setShowLikeForm(false)} 
            hasLiked={hasLiked}
          />
        )}
      </CardContent>
    </Card>
  );
}
