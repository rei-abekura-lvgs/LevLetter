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

export default function LikeForm({ cardId, onClose, hasLiked }: LikeFormProps) {
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

    // すでにいいねしている場合は何もしない
    if (hasLiked) {
      toast({
        title: "すでにいいね済みです",
        description: "このカードにはすでにいいねをしています",
        variant: "destructive",
      });
      onClose();
      return;
    }

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
        <DialogTitle>いいねする</DialogTitle>
        <DialogDescription>
          このカードにいいねしてポイントを贈りましょう！
        </DialogDescription>
      </DialogHeader>

      {!hasLiked ? (
        <div className="py-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#3990EA] mb-2">2pt</div>
              <div className="text-sm text-gray-600">
                いいね1回につき2ポイント消費<br />
                送信者と受信者それぞれに1ポイントずつ贈られます
              </div>
            </div>

            <div className="text-sm text-gray-500 text-center">
              残りポイント: {user?.weeklyPoints || 0} ポイント
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="text-green-600 font-medium">
            ✓ すでにいいね済みです
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
        {!hasLiked && (
          <Button
            type="submit"
            disabled={isSubmitting || (user?.weeklyPoints && user.weeklyPoints < 2)}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                処理中...
              </span>
            ) : (
              <span className="flex items-center">
                <Heart className="mr-2 h-4 w-4" />
                いいねする（2pt）
              </span>
            )}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}