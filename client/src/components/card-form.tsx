import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cardFormSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getTeams, createCard } from "@/lib/api";
import { User, Team } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { CheckIcon, SearchIcon, SendIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CardForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recipientType, setRecipientType] = useState<"user" | "team">("user");
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: number; name: string; type: "user" | "team" } | null>(null);

  const form = useForm({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      recipientId: 0,
      recipientType: "user" as const,
      message: ""
    }
  });

  // ユーザー一覧を取得
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    queryFn: () => getUsers()
  });

  // チーム一覧を取得
  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: () => getTeams()
  });

  // 送信先候補を作成
  const recipients = [
    ...(users?.map((user: User) => ({
      id: user.id,
      name: user.displayName || user.name,
      type: "user" as const
    })) || []),
    ...(teams?.map((team: Team) => ({
      id: team.id,
      name: team.name,
      type: "team" as const
    })) || [])
  ];

  // フィルタリングされた候補
  const filteredRecipients = recipients.filter(
    (recipient) => recipient.name.toLowerCase().includes(search.toLowerCase())
  );

  // 送信ミューテーション
  const createCardMutation = useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: ["/api/cards"]
      });
      
      // フォームをリセット
      form.reset({
        recipientId: 0,
        recipientType: "user",
        message: ""
      });
      setSelectedRecipient(null);
      
      // 成功通知
      toast({
        title: "送信完了",
        description: "サンクスカードを送信しました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `カードの送信に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        variant: "destructive"
      });
    }
  });

  // 選択された受信者が変更されたら、フォームの値も更新
  useEffect(() => {
    if (selectedRecipient) {
      form.setValue("recipientId", selectedRecipient.id);
      form.setValue("recipientType", selectedRecipient.type);
    }
  }, [selectedRecipient, form]);

  const onSubmit = (data: { recipientId: number | string; recipientType: "user" | "team"; message: string }) => {
    if (!selectedRecipient) {
      toast({
        title: "入力エラー",
        description: "送信先を選択してください。",
        variant: "destructive"
      });
      return;
    }

    createCardMutation.mutate(data);
  };

  const messageLength = form.watch("message")?.length || 0;

  return (
    <div className="mb-8 bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">サンクスカードを送る</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>送信先</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="justify-between w-full text-left font-normal"
                        >
                          {selectedRecipient ? selectedRecipient.name : "名前やチーム名で検索..."}
                          <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-full min-w-[300px]">
                      <Command>
                        <CommandInput
                          placeholder="名前やチームを検索..."
                          className="h-9"
                          value={search}
                          onValueChange={setSearch}
                        />
                        <CommandList>
                          <CommandEmpty>見つかりませんでした</CommandEmpty>
                          <CommandGroup>
                            {filteredRecipients.map((recipient) => (
                              <CommandItem
                                key={`${recipient.type}-${recipient.id}`}
                                value={`${recipient.type}-${recipient.id}-${recipient.name}`}
                                onSelect={() => {
                                  setSelectedRecipient(recipient);
                                  setRecipientType(recipient.type);
                                  setOpen(false);
                                }}
                              >
                                <span className={cn(
                                  "mr-2 h-4 w-4 text-xs",
                                  recipient.type === "team" ? "text-blue-500" : "text-green-500"
                                )}>
                                  {recipient.type === "team" ? "チーム" : "個人"}
                                </span>
                                {recipient.name}
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedRecipient?.id === recipient.id && selectedRecipient?.type === recipient.type
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メッセージ</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Textarea
                        placeholder="感謝のメッセージを入力（140文字以内）..."
                        className="min-h-[80px] resize-none pr-16"
                        {...field}
                        maxLength={140}
                      />
                    </FormControl>
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {messageLength}/140
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={createCardMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
              >
                <SendIcon className="mr-2 h-4 w-4" />
                送信する
                {createCardMutation.isPending && (
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
    </div>
  );
}
