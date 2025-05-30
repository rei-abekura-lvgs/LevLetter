import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CardReaction, User } from "@shared/schema";

interface CardReactionsProps {
  cardId: number;
  currentUserId: number;
  isRecipient: boolean; // 現在のユーザーがこのカードの受信者かどうか
}

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "😊", "🔥", "👏", "💯", "🚀"];

export function CardReactions({ cardId, currentUserId, isRecipient }: CardReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ["/api/cards", cardId, "reactions"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/cards/${cardId}/reactions`);
        if (!res.ok) {
          console.log('リアクション取得失敗:', res.status);
          return [];
        }
        return res.json() as Promise<Array<CardReaction & { user: User }>>;
      } catch (error) {
        console.log('リアクション取得エラー:', error);
        return [];
      }
    }
  });

  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      return apiRequest("POST", `/api/cards/${cardId}/reactions`, { emoji });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards", cardId, "reactions"] });
      setShowEmojiPicker(false);
      toast({
        title: "リアクションを追加しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "リアクションの追加に失敗しました",
        variant: "destructive",
      });
    }
  });

  const removeReactionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/cards/${cardId}/reactions`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards", cardId, "reactions"] });
      toast({
        title: "リアクションを削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "リアクションの削除に失敗しました",
        variant: "destructive",
      });
    }
  });

  const handleEmojiClick = (emoji: string) => {
    addReactionMutation.mutate(emoji);
  };

  const handleRemoveReaction = () => {
    removeReactionMutation.mutate();
  };

  if (isLoading) {
    return null;
  }

  // Group reactions by emoji
  const reactionGroups = reactions.reduce((groups, reaction) => {
    if (!groups[reaction.emoji]) {
      groups[reaction.emoji] = [];
    }
    groups[reaction.emoji].push(reaction);
    return groups;
  }, {} as Record<string, Array<CardReaction & { user: User }>>);

  // Check if current user has reacted
  const userReaction = reactions.find(r => r.userId === currentUserId);
  const totalReactions = reactions.length;

  return (
    <div className="flex items-center gap-2">
      {/* Show existing reactions grouped by emoji */}
      {Object.entries(reactionGroups).length > 0 && (
        <div className="flex items-center gap-1">
          {Object.entries(reactionGroups).slice(0, 3).map(([emoji, groupReactions]) => {
            const count = groupReactions.length;
            const hasCurrentUserReacted = groupReactions.some(r => r.userId === currentUserId);
            const isCurrentUserReaction = isRecipient && hasCurrentUserReacted;
            
            return (
              <Popover key={emoji} open={isCurrentUserReaction ? showEmojiPicker : false} onOpenChange={isCurrentUserReaction ? setShowEmojiPicker : undefined}>
                <PopoverTrigger asChild>
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                      hasCurrentUserReacted 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    } ${isCurrentUserReaction ? 'cursor-pointer hover:bg-blue-100' : ''}`}
                    onClick={isCurrentUserReaction ? undefined : undefined}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                </PopoverTrigger>
                {isCurrentUserReaction && (
                  <PopoverContent className="w-auto p-2" align="start">
                    <div className="grid grid-cols-4 gap-1">
                      {REACTION_EMOJIS.map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 hover:bg-gray-100 ${
                            userReaction?.emoji === emoji ? 'bg-blue-100 border border-blue-300' : ''
                          }`}
                          onClick={() => handleEmojiClick(emoji)}
                          disabled={addReactionMutation.isPending}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                    {userReaction && (
                      <div className="border-t pt-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveReaction}
                          disabled={removeReactionMutation.isPending}
                          className="w-full text-xs text-gray-500 hover:text-red-500"
                        >
                          リアクションを削除
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
          {Object.entries(reactionGroups).length > 3 && (
            <span className="text-xs text-gray-500">+{totalReactions - Object.entries(reactionGroups).slice(0, 3).reduce((sum, [, reactions]) => sum + reactions.length, 0)}</span>
          )}
        </div>
      )}

      {/* Add reaction button - only show for recipients who haven't reacted yet */}
      {isRecipient && !userReaction && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800"
              disabled={addReactionMutation.isPending}
            >
              <span className="mr-1">😊</span>
              リアクション
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {REACTION_EMOJIS.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                  onClick={() => handleEmojiClick(emoji)}
                  disabled={addReactionMutation.isPending}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}