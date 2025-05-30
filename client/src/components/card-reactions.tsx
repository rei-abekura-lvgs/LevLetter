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
}

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "😊", "🔥", "👏", "💯", "🚀"];

export function CardReactions({ cardId, currentUserId }: CardReactionsProps) {
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
    return <div className="text-sm text-muted-foreground">読み込み中...</div>;
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

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display existing reactions */}
      {Object.entries(reactionGroups).map(([emoji, groupReactions]) => (
        <Button
          key={emoji}
          variant={groupReactions.some(r => r.userId === currentUserId) ? "default" : "outline"}
          size="sm"
          className="h-8 px-2 text-sm"
          onClick={() => {
            if (groupReactions.some(r => r.userId === currentUserId)) {
              handleRemoveReaction();
            }
          }}
          title={groupReactions.map(r => r.user.displayName || r.user.name).join(", ")}
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-xs">{groupReactions.length}</span>
        </Button>
      ))}

      {/* Add reaction button - only show if user hasn't reacted */}
      {!userReaction && (
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
              disabled={addReactionMutation.isPending}
            >
              😊
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {REACTION_EMOJIS.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
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