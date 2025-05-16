import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { likeFormSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLike } from "@/lib/api";

interface LikeFormProps {
  cardId: number;
  onClose: () => void;
  hasLiked: boolean;
}

export default function LikeForm({ cardId, onClose, hasLiked }: LikeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [points, setPoints] = useState(50);

  const form = useForm({
    resolver: zodResolver(likeFormSchema),
    defaultValues: {
      cardId,
      points: 50
    }
  });

  const createLikeMutation = useMutation({
    mutationFn: createLike,
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: ["/api/cards"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/me"]
      });
      
      // 成功通知
      toast({
        title: "いいね完了",
        description: `${points}ポイントのいいねを送りました。`,
      });
      
      // フォームを閉じる
      onClose();
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `いいねの送信に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: { cardId: number; points: number }) => {
    if (hasLiked) {
      toast({
        title: "エラー",
        description: "このカードにはすでにいいねしています。",
        variant: "destructive"
      });
      return;
    }
    
    createLikeMutation.mutate(data);
  };

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="points" className="text-sm font-medium text-gray-700">ポイントを選択</Label>
                  <span className="text-sm font-medium text-accent-500">{points} ポイント</span>
                </div>
                <FormControl>
                  <Slider
                    id="points"
                    min={0}
                    max={100}
                    step={1}
                    value={[points]}
                    onValueChange={(value) => {
                      setPoints(value[0]);
                      field.onChange(value[0]);
                    }}
                    className="[&_[role=slider]]:bg-accent-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createLikeMutation.isPending || hasLiked}
              className="text-white bg-accent-500 hover:bg-pink-600"
            >
              <HeartIcon className="mr-1 h-4 w-4 fill-current" />
              いいねを送る
              {createLikeMutation.isPending && (
                <span className="ml-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
