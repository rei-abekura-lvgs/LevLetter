import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { cardFormSchema, User, Team } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { createCard, getUsers, getTeams } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CardForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipientType, setRecipientType] = useState<"user" | "team">("user");
  const [isPublic, setIsPublic] = useState(true);

  // ユーザーと部署の情報を取得
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getUsers
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    queryFn: getTeams
  });

  const form = useForm({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      recipientId: "",
      recipientType: "user",
      message: ""
    }
  });

  const handleRecipientTypeChange = (value: string) => {
    setRecipientType(value as "user" | "team");
    form.setValue("recipientType", value as "user" | "team");
    form.setValue("recipientId", ""); // タイプが変わったらリセット
  };

  const onSubmit = async (data: z.infer<typeof cardFormSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // publicプロパティは別に送る必要があるため、オブジェクトを作成
      const cardData = {
        ...data,
        recipientId: Number(data.recipientId)
      };
      
      // @ts-ignore - APIは'public'プロパティを受け付けるが型定義には存在しない
      await createCard({
        ...cardData,
        public: isPublic
      });
      
      toast({
        title: "カードを送信しました！",
        description: "サンクスカードが送信されました。"
      });
      
      // フォームをリセット
      form.reset({
        recipientId: "",
        recipientType: recipientType,
        message: ""
      });
      
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
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h2 className="text-lg font-semibold mb-4">サンクスカードを送る</h2>
        
        {/* 受信者タイプの選択 */}
        <div className="mb-4">
          <Tabs defaultValue="user" onValueChange={handleRecipientTypeChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">ユーザー</TabsTrigger>
              <TabsTrigger value="team">チーム</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user" className="mt-4">
              <Select 
                onValueChange={(value) => form.setValue("recipientId", value)} 
                value={form.watch("recipientId") as string}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ユーザーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {users?.filter(u => u.id !== user?.id).map((user: User) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.displayName || user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="team" className="mt-4">
              <Select 
                onValueChange={(value) => form.setValue("recipientId", value)}
                value={form.watch("recipientId") as string}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="チームを選択" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team: Team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
          
          {form.formState.errors.recipientId && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.recipientId.message as string}
            </p>
          )}
        </div>
        
        {/* メッセージ入力 */}
        <div className="mb-4">
          <Textarea
            placeholder="感謝のメッセージを書きましょう..."
            className="resize-none h-24"
            {...form.register("message")}
          />
          {form.formState.errors.message && (
            <p className="text-red-500 text-sm mt-1">
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
        
        {/* 公開設定 */}
        <div className="flex items-center space-x-2 mb-4">
          <Switch
            id="public-mode"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          <Label htmlFor="public-mode">全社に公開する</Label>
        </div>
        
        {/* 送信ボタン */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              送信中...
            </span>
          ) : (
            "カードを送信"
          )}
        </Button>
      </form>
    </div>
  );
}