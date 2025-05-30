import { useQuery } from "@tanstack/react-query";
import { CardReaction, User } from "@shared/schema";

interface BatchReactionsData {
  [cardId: number]: Array<CardReaction & { user: User }>;
}

/**
 * 複数のカードのリアクションを一括で取得するカスタムフック
 */
export function useBatchReactions(cardIds: number[]) {
  const { data: batchReactions = {}, isLoading, error } = useQuery({
    queryKey: ["/api/reactions/batch", cardIds.sort().join(',')],
    queryFn: async () => {
      if (cardIds.length === 0) return {};
      
      const cardIdsParam = cardIds.join(',');
      const response = await fetch(`/api/reactions/batch?cardIds=${cardIdsParam}`);
      
      if (!response.ok) {
        throw new Error('リアクションの取得に失敗しました');
      }
      
      return response.json() as Promise<BatchReactionsData>;
    },
    enabled: cardIds.length > 0,
    staleTime: 30000, // 30秒間はキャッシュを使用
    gcTime: 300000, // 5分間キャッシュを保持
  });

  /**
   * 特定のカードのリアクションを取得
   */
  const getReactionsForCard = (cardId: number): Array<CardReaction & { user: User }> => {
    return batchReactions[cardId] || [];
  };

  /**
   * 特定のカードにユーザーがリアクションしているかチェック
   */
  const hasUserReacted = (cardId: number, userId: number): boolean => {
    const reactions = getReactionsForCard(cardId);
    return reactions.some(reaction => reaction.userId === userId);
  };

  /**
   * 特定のカードのユーザーのリアクションを取得
   */
  const getUserReaction = (cardId: number, userId: number): (CardReaction & { user: User }) | undefined => {
    const reactions = getReactionsForCard(cardId);
    return reactions.find(reaction => reaction.userId === userId);
  };

  return {
    batchReactions,
    isLoading,
    error,
    getReactionsForCard,
    hasUserReacted,
    getUserReaction,
  };
}