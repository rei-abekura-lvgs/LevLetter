import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ChevronDown, ChevronUp, Send, Edit2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import type { CardComment, User } from "@shared/schema";

interface CardCommentsProps {
  cardId: number;
  currentUserId: number;
}

export function CardComments({ cardId, currentUserId }: CardCommentsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/cards", cardId, "comments"],
    queryFn: () => fetch(`/api/cards/${cardId}/comments`).then(res => res.json()) as Promise<Array<CardComment & { user: User }>>,
    enabled: isOpen
  });

  const addCommentMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest("POST", `/api/cards/${cardId}/comments`, { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards", cardId, "comments"] });
      setNewComment("");
      toast({
        title: "コメントを追加しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "コメントの追加に失敗しました",
        variant: "destructive",
      });
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, message }: { commentId: number; message: string }) => {
      return apiRequest(`/api/comments/${commentId}`, {
        method: "PUT",
        body: { message }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards", cardId, "comments"] });
      setEditingCommentId(null);
      setEditingText("");
      toast({
        title: "コメントを更新しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "コメントの更新に失敗しました",
        variant: "destructive",
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest(`/api/comments/${commentId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cards", cardId, "comments"] });
      toast({
        title: "コメントを削除しました",
      });
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: error.message || "コメントの削除に失敗しました",
        variant: "destructive",
      });
    }
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleUpdateComment = (commentId: number) => {
    if (editingText.trim()) {
      updateCommentMutation.mutate({ commentId, message: editingText.trim() });
    }
  };

  const startEditing = (comment: CardComment & { user: User }) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.message);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
          <MessageCircle className="w-4 h-4 mr-1" />
          <span className="text-xs">
            {comments.length > 0 ? `コメント (${comments.length})` : "コメント"}
          </span>
          {isOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-3">
        <div className="space-y-3">
          {/* Add new comment */}
          <div className="flex gap-2">
            <Textarea
              placeholder="コメントを入力..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              disabled={addCommentMutation.isPending}
            />
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Comments list */}
          {isLoading ? (
            <div className="text-sm text-muted-foreground">読み込み中...</div>
          ) : comments.length > 0 ? (
            <div className="space-y-2">
              {comments.map((comment) => (
                <Card key={comment.id} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <Avatar className="w-6 h-6 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10">
                          {getInitials(comment.user.displayName || comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground">
                            {comment.user.displayName || comment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { 
                              addSuffix: true, 
                              locale: ja 
                            })}
                          </span>
                          
                          {comment.userId === currentUserId && (
                            <div className="flex items-center gap-1 ml-auto">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => startEditing(comment)}
                                disabled={updateCommentMutation.isPending || deleteCommentMutation.isPending}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteCommentMutation.mutate(comment.id)}
                                disabled={updateCommentMutation.isPending || deleteCommentMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {editingCommentId === comment.id ? (
                          <div className="flex gap-2">
                            <Textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="min-h-[60px] resize-none text-sm"
                              disabled={updateCommentMutation.isPending}
                            />
                            <div className="flex flex-col gap-1 shrink-0">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateComment(comment.id)}
                                disabled={!editingText.trim() || updateCommentMutation.isPending}
                                className="h-6 px-2 text-xs"
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={updateCommentMutation.isPending}
                                className="h-6 px-2 text-xs"
                              >
                                キャンセル
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {comment.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-4">
              まだコメントがありません
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}