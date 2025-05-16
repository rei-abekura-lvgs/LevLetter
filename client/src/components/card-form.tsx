import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserIcon, Send, X, Search, UserPlus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CardForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);

  // ユーザー情報を取得
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getUsers
  });

  // 現在のユーザーを除外
  const availableUsers = users.filter(u => u.id !== user?.id);

  // 部署リストを取得（重複を除く）
  const departments = Array.from(new Set(
    availableUsers
      .map(u => u.department)
      .filter(Boolean) as string[]
  )).sort();

  // 検索とフィルター処理
  const filteredUsers = availableUsers.filter(u => {
    // 検索クエリがある場合は名前・表示名・メールアドレスで検索
    const matchesSearch = searchQuery === "" || 
      (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // 部署フィルターがある場合は部署で絞り込み
    const matchesDepartment = !departmentFilter || u.department === departmentFilter;
    
    return matchesSearch && matchesDepartment;
  });

  // 検索結果のステータス
  const noResults = filteredUsers.length === 0 && (searchQuery !== "" || departmentFilter !== null);
  const showAllUsers = searchQuery === "" && departmentFilter === null;

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

  // 全選択/全解除の処理
  const toggleSelectAll = () => {
    if (selectedRecipients.length === filteredUsers.length) {
      // 全ての表示中ユーザーが選択済みなら全解除
      const filteredIds = new Set(filteredUsers.map(u => u.id));
      setSelectedRecipients(prev => prev.filter(u => !filteredIds.has(u.id)));
    } else {
      // そうでなければ全選択（ただし重複は避ける）
      const currentSelectedIds = new Set(selectedRecipients.map(u => u.id));
      const newSelected = [
        ...selectedRecipients,
        ...filteredUsers.filter(u => !currentSelectedIds.has(u.id))
      ];
      setSelectedRecipients(newSelected);
    }
  };

  // フォーム送信処理
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">送信先を選択</h3>
              <Badge variant="outline">
                {selectedRecipients.length}人選択中
              </Badge>
            </div>
            
            {/* 選択済みユーザー表示エリア */}
            <div className="flex flex-wrap gap-1 mb-3">
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
            
            {/* ユーザー検索・フィルタリングエリア */}
            <Tabs defaultValue="search" className="mb-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="search">
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </TabsTrigger>
                <TabsTrigger value="filter">
                  <Filter className="h-4 w-4 mr-2" />
                  部署から選択
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="mt-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="名前・メールアドレス・部署で検索..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="filter" className="mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button" 
                    variant={departmentFilter === null ? "default" : "outline"}
                    className="text-xs h-9"
                    onClick={() => setDepartmentFilter(null)}
                  >
                    全部署
                  </Button>
                  {departments.map(dept => (
                    <Button
                      key={dept}
                      type="button"
                      variant={departmentFilter === dept ? "default" : "outline"}
                      className="text-xs h-9"
                      onClick={() => setDepartmentFilter(dept)}
                    >
                      {dept}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            {/* ユーザー一覧 */}
            <div className="border rounded-md">
              <div className="flex justify-between items-center p-2 border-b bg-gray-50">
                <span className="text-xs text-gray-500">
                  {filteredUsers.length}人のユーザーがヒット
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={toggleSelectAll}
                  disabled={filteredUsers.length === 0}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {selectedRecipients.length === filteredUsers.length && filteredUsers.length > 0
                    ? "全て解除"
                    : "全て選択"}
                </Button>
              </div>
              
              <ScrollArea className="h-40">
                <div className="p-2">
                  {isLoadingUsers ? (
                    <div className="text-center p-4 text-gray-500">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      ユーザーを読み込み中...
                    </div>
                  ) : noResults ? (
                    <div className="text-center p-4 text-gray-500">
                      検索条件に一致するユーザーがいません
                    </div>
                  ) : filteredUsers.length === 0 && showAllUsers ? (
                    <div className="text-center p-4 text-gray-500">
                      ユーザーが見つかりません
                    </div>
                  ) : (
                    filteredUsers.map((availableUser) => (
                      <div key={availableUser.id} className="flex items-center space-x-2 py-1 px-1 hover:bg-gray-50 rounded-sm">
                        <Checkbox
                          id={`user-${availableUser.id}`}
                          checked={selectedRecipients.some(r => r.id === availableUser.id)}
                          onCheckedChange={() => toggleUserSelection(availableUser)}
                        />
                        <label
                          htmlFor={`user-${availableUser.id}`}
                          className="flex items-center cursor-pointer text-sm flex-1"
                        >
                          <Avatar className={`bg-${availableUser.avatarColor || 'blue-500'} h-6 w-6 mr-2`}>
                            <AvatarFallback className="text-xs">
                              {availableUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{availableUser.displayName || availableUser.name}</div>
                            {availableUser.department && (
                              <div className="text-xs text-gray-500">
                                {availableUser.department}
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
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
                {selectedRecipients.length > 0 
                  ? `${selectedRecipients.length}人にカードを送信` 
                  : "サンクスカードを送信"}
              </span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}