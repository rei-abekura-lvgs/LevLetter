import { useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

/**
 * 楽観的更新を管理するカスタムフック
 */
export function useOptimisticUpdates() {
  const queryClient = useQueryClient();

  /**
   * ポイント消費の楽観的更新
   * @param pointsToDeduct 消費するポイント数
   * @param currentUser 現在のユーザー情報
   */
  const updatePointsOptimistically = (pointsToDeduct: number, currentUser: User) => {
    // ユーザー情報のキャッシュを更新
    const updatedUser = {
      ...currentUser,
      weeklyPoints: Math.max(0, currentUser.weeklyPoints - pointsToDeduct)
    };
    queryClient.setQueryData(['/api/auth/me'], updatedUser);
    
    // ダッシュボード統計のキャッシュも同時に更新
    queryClient.setQueryData(['/api/dashboard/stats'], (oldStats: any) => {
      if (!oldStats) return oldStats;
      return {
        ...oldStats,
        weekly: {
          ...oldStats.weekly,
          currentPoints: Math.max(0, oldStats.weekly.currentPoints - pointsToDeduct)
        }
      };
    });

    return updatedUser;
  };

  /**
   * いいね追加の楽観的更新
   * @param cardId カードID
   * @param currentUser 現在のユーザー情報
   */
  const addLikeOptimistically = (cardId: number, currentUser: User) => {
    // カード一覧のキャッシュを更新
    queryClient.setQueryData(['/api/cards'], (oldCards: any[]) => {
      if (!oldCards) return oldCards;
      return oldCards.map(oldCard => {
        if (oldCard.id === cardId) {
          const newLike = {
            id: Date.now(), // 一時的なID
            cardId,
            userId: currentUser.id,
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

    // ポイントも同時に更新
    return updatePointsOptimistically(2, currentUser);
  };

  /**
   * いいね削除の楽観的更新
   * @param cardId カードID
   * @param currentUser 現在のユーザー情報
   */
  const removeLikeOptimistically = (cardId: number, currentUser: User) => {
    // カード一覧のキャッシュを更新
    queryClient.setQueryData(['/api/cards'], (oldCards: any[]) => {
      if (!oldCards) return oldCards;
      return oldCards.map(oldCard => {
        if (oldCard.id === cardId) {
          return {
            ...oldCard,
            likes: (oldCard.likes || []).filter((like: any) => like.userId !== currentUser.id)
          };
        }
        return oldCard;
      });
    });

    // ポイントを戻す（いいね削除時は+2pt）
    const updatedUser = {
      ...currentUser,
      weeklyPoints: currentUser.weeklyPoints + 2
    };
    queryClient.setQueryData(['/api/auth/me'], updatedUser);
    
    queryClient.setQueryData(['/api/dashboard/stats'], (oldStats: any) => {
      if (!oldStats) return oldStats;
      return {
        ...oldStats,
        weekly: {
          ...oldStats.weekly,
          currentPoints: oldStats.weekly.currentPoints + 2
        }
      };
    });

    return updatedUser;
  };

  return {
    updatePointsOptimistically,
    addLikeOptimistically,
    removeLikeOptimistically
  };
}