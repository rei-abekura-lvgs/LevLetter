import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { cardFormSchema, User } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { createCard, getUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserIcon, Send, X } from "lucide-react";

export default function CardForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);

  // ユーザー情報を取得
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getUsers
  });

  // 現在のユーザーを除外
  const availableUsers = users.filter(u => u.id !== user?.id);

  const form = useForm({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      recipientId: "",
      recipientType: "user",
      message: ""
    }
  });

  // ユーザー選択の処理
  const toggleUserSelection = (selectedUser: User) => {
    if (selectedRecipients.some(r => r.id === selectedUser.id)) {
      // すでに選択されている場合は削除
      setSelectedRecipients(prev => prev.filter(r => r.id !== selectedUser.id));
    } else {
      // 選択されていない場合は追加
      setSelectedRecipients(prev => [...prev, selectedUser]);
    }
  };

  // 選択解除の処理
  const removeRecipient = (id: number) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== id));
  };

  const onSubmit = async (data: z.infer<typeof cardFormSchema>) => {
    if (!user) return;
    if (selectedRecipients.length === 0) {
      toast({
        title: "送信先を選択してください",
        description: "少なくとも1人の受信者を選択する必要があります。",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 各受信者に対してカードを送信
      for (const recipient of selectedRecipients) {
        await createCard({
          recipientId: recipient.id,
          recipientType: "user",
          message: data.message,
          public: true // すべて公開に設定
        });
      }
      
      toast({
        title: "カードを送信しました！",
        description: `${selectedRecipients.length}人にサンクスカードが送信されました。`,
      });
      
      // フォームをリセット
      form.reset({
        message: ""
      });
      setSelectedRecipients([]);
      
      // カードリストを更新
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    } catch (error) {
      console.error("カード作成エラー:", error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "操作に失敗しました",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">サンクスカードを送る</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* 受信者選択セクション */}
          <div>
            <h3 className="text-sm font-medium mb-2">送信先を選択</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedRecipients.map(recipient => (
                <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1">
                  {recipient.displayName || recipient.name}
                  <button 
                    type="button" 
                    onClick={() => removeRecipient(recipient.id)}
                    className="rounded-full hover:bg-gray-200 p-0.5"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
              {selectedRecipients.length === 0 && (
                <span className="text-sm text-gray-500 italic">
                  選択されていません
                </span>
              )}
            </div>
            
            <ScrollArea className="h-36 border rounded-md">
              <div className="p-2">
                {availableUsers.map((availableUser) => (
                  <div key={availableUser.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`user-${availableUser.id}`}
                      checked={selectedRecipients.some(r => r.id === availableUser.id)}
                      onCheckedChange={() => toggleUserSelection(availableUser)}
                    />
                    <label
                      htmlFor={`user-${availableUser.id}`}
                      className="flex items-center cursor-pointer text-sm flex-1"
                    >
                      <UserIcon size={16} className="mr-2 text-gray-500" />
                      <span>
                        {availableUser.displayName || availableUser.name}
                        {availableUser.department && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({availableUser.department})
                          </span>
                        )}
                      </span>
                    </label>
                  </div>
                ))}
                {availableUsers.length === 0 && (
                  <div className="text-center p-4 text-gray-500">
                    ユーザーが見つかりません
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* メッセージ入力 */}
          <div>
            <h3 className="text-sm font-medium mb-2">メッセージ</h3>
            <Textarea
              placeholder="感謝のメッセージを書きましょう..."
              className="resize-none h-24"
              {...form.register("message")}
            />
            {form.formState.errors.message && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.message.message as string}
              </p>
            )}
            <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
              <div>
                最大140文字まで
              </div>
              <div>
                {form.watch("message")?.length || 0}/140
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || selectedRecipients.length === 0 || !form.watch("message")}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                送信中...
              </span>
            ) : (
              <span className="flex items-center">
                <Send size={16} className="mr-2" />
                サンクスカードを送信
              </span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}