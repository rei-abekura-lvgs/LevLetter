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
    queryFn: () => fetch(`/api/cards/${cardId}/reactions`).then(res => res.json()) as Promise<Array<CardReaction & { user: User }>>
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
      {/* Show existing reactions */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1">
          {Object.entries(reactionGroups).slice(0, 3).map(([emoji, groupReactions]) => (
            <span key={emoji} className="text-sm">{emoji}</span>
          ))}
          {totalReactions > 3 && <span className="text-xs text-gray-500">+{totalReactions - 3}</span>}
          <span className="text-xs text-gray-500 ml-1">{totalReactions}</span>
        </div>
      )}

      {/* Add reaction button - only show for recipients */}
      {isRecipient && (
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
        </Popover>
      )}
    </div>
  );
}