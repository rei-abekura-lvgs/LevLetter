import { useState } from "react";
import { Heart } from "lucide-react";
import { CardWithRelations, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LikeButtonProps {
  card: CardWithRelations;
  currentUser: User;
  onRefresh?: () => void;
}

export function LikeButton({ card, currentUser, onRefresh }: LikeButtonProps) {
  const [isLiking, setIsLiking] = useState(false);
  const { toast } = useToast();

  // 自分のカードまたは自分宛のカードかどうかをチェック
  const isOwnCard = card.senderId === currentUser.id;
  const isReceivedCard = card.recipientId === currentUser.id || 
    (card.additionalRecipients && card.additionalRecipients.includes(currentUser.id));

  // 現在のユーザーがこのカードにいいねした総ポイント数を計算
  const userLikePoints = card.likes
    .filter(like => like.user.id === currentUser.id)
    .reduce((total, like) => total + (like.points || 2), 0);

  // 最大30ptまでいいねできる（2ptずつ）
  const maxLikePoints = 30;
  const canLike = !isOwnCard && !isReceivedCard && userLikePoints < maxLikePoints;
  const remainingLikes = Math.floor((maxLikePoints - userLikePoints) / 2);

  // 総いいね数（全ユーザーのいいね数）
  const totalLikes = card.likes.length;

  const handleLike = async () => {
    if (!canLike || isLiking) return;

    setIsLiking(true);
    try {
      const response = await fetch("/api/cards/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardId: card.id,
          points: 2 // 常に2ptずつ
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "いいねに失敗しました");
      }

      toast({
        description: "いいねしました！（2pt消費）"
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "いいねに失敗しました"
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleLike}
        disabled={!canLike || isLiking}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all ${
          canLike && !isLiking
            ? "bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
        title={
          isOwnCard 
            ? "自分のカードにはいいねできません"
            : isReceivedCard
            ? "自分宛のカードにはいいねできません"
            : canLike 
            ? `いいねする（2pt消費、残り${remainingLikes}回）`
            : "いいね上限に達しました（30pt）"
        }
      >
        <Heart 
          className={`h-4 w-4 ${
            userLikePoints > 0 ? "fill-current text-pink-500" : ""
          }`} 
        />
        <span>{totalLikes}</span>
      </button>

      {userLikePoints > 0 && (
        <div className="text-xs text-gray-500">
          あなた: {userLikePoints}pt
        </div>
      )}
    </div>
  );
}