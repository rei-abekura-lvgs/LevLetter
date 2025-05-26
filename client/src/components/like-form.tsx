import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { likeFormSchema } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { createLike } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";

interface LikeFormProps {
  cardId: number;
  onClose: () => void;
  hasLiked: boolean;
}

type LikeFormValues = z.infer<typeof likeFormSchema>;

export default function LikeForm({ cardId, onClose }: LikeFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LikeFormValues>({
    resolver: zodResolver(likeFormSchema),
    defaultValues: {
      cardId,
      points: 2, // 固定2ポイント
    },
  });

  async function onSubmit(data: LikeFormValues) {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // 新しいAPI：2ポイント固定
      await apiRequest(`/api/cards/${cardId}/likes`, {
        method: "POST",
      });
      
      toast({
        title: "いいねしました！",
        description: "2ポイント消費して、送信者と受信者それぞれに1ポイントずつ贈られました",
      });

      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      onClose();
    } catch (error) {
      console.error("いいねエラー:", error);
      const errorMessage = error instanceof Error ? error.message : "操作に失敗しました";
      toast({
        title: "エラーが発生しました",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <DialogHeader>
        <DialogTitle>
          {hasLiked ? "いいねを取り消す" : "いいねする"}
        </DialogTitle>
        <DialogDescription>
          {hasLiked
            ? "このカードへのいいねとポイントを取り消します。"
            : "このカードにいいねしてポイントを贈りましょう！"}
        </DialogDescription>
      </DialogHeader>

      {!hasLiked && (
        <div className="py-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                ポイント: {form.watch("points")}
              </label>
              <Slider
                className="mt-2"
                defaultValue={[10]}
                max={Math.min(100, user?.weeklyPoints || 100)}
                min={0}
                step={5}
                onValueChange={(value) => form.setValue("points", value[0])}
              />
            </div>

            <div className="text-sm text-gray-500">
              残りポイント: {user?.weeklyPoints || 0} ポイント
            </div>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || (user?.weeklyPoints === 0 && !hasLiked)}
          className={hasLiked ? "bg-red-500 hover:bg-red-600" : ""}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              処理中...
            </span>
          ) : hasLiked ? (
            <span className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              いいねを取り消す
            </span>
          ) : (
            <span className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              いいねする
            </span>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}