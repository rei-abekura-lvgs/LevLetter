import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon, Send, X, Search, UserPlus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CardFormProps {
  onSent?: () => void;
}

export default function CardForm({ onSent }: CardFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [selectedLevel1Department, setSelectedLevel1Department] = useState<string | null>(null);
  const [selectedLevel2Department, setSelectedLevel2Department] = useState<string | null>(null);
  const [selectedLevel3Department, setSelectedLevel3Department] = useState<string | null>(null);

  // ユーザー情報を取得
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getUsers
  });

  // 現在のユーザーを除外
  const availableUsers = users.filter(u => u.id !== user?.id);

  // 階層的な部署リストを取得
  const departmentsByLevel: { [level: number]: string[] } = {
    1: [], // 階層レベル1の部署リスト
    2: [], // 階層レベル2の部署リスト
    3: [], // 階層レベル3の部署リスト
    4: [], // 階層レベル4の部署リスト
    5: [], // 階層レベル5の部署リスト
  };

  // 部署名を階層レベルに分割（区切り文字: '/', '>', '　')
  availableUsers.forEach(user => {
    if (!user.department) return;
    
    // 部署文字列を階層に分割
    const parts = user.department.split(/[\/\>　]/);
    
    // 各階層レベルを処理（最大5階層まで）
    for (let i = 0; i < 5; i++) {
      if (parts[i] && !departmentsByLevel[i+1].includes(parts[i].trim())) {
        departmentsByLevel[i+1].push(parts[i].trim());
      }
    }
  });
  
  // 各階層でソート
  for (let i = 1; i <= 5; i++) {
    departmentsByLevel[i].sort();
  }

  // 検索とフィルター処理
  const filteredUsers = availableUsers.filter(u => {
    // 検索クエリがある場合は名前・表示名・メールアドレスで検索
    const matchesSearch = searchQuery === "" || 
      (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
       (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())));
    
    // 部署フィルターの処理
    let matchesDepartment = true;
    
    if (departmentFilter) {
      // 完全一致の場合
      matchesDepartment = u.department === departmentFilter;
    } else if (selectedLevel1Department) {
      // 階層レベル1が選択されている場合、その部署で始まるユーザーを絞り込み
      matchesDepartment = u.department?.startsWith(selectedLevel1Department + '/') || 
                          u.department?.startsWith(selectedLevel1Department + '>') || 
                          u.department?.startsWith(selectedLevel1Department + '　') || 
                          u.department === selectedLevel1Department;
    }
    
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
      message: "",
      points: 0
    }
  });

  // ユーザー選択の処理（メモ化してパフォーマンス改善）
  const toggleUserSelection = useCallback((selectedUser: User) => {
    try {
      console.log(`ユーザー選択切り替え: ${selectedUser.name} (ID: ${selectedUser.id})`);
      
      setSelectedRecipients(prev => {
        const isAlreadySelected = prev.some(r => r.id === selectedUser.id);
        
        if (isAlreadySelected) {
          // すでに選択されている場合は削除
          console.log(`ユーザー ${selectedUser.name} を選択から除外`);
          return prev.filter(r => r.id !== selectedUser.id);
        } else {
          // 選択されていない場合は追加
          console.log(`ユーザー ${selectedUser.name} を選択に追加`);
          return [...prev, selectedUser];
        }
      });
    } catch (error) {
      console.error('ユーザー選択処理でエラーが発生:', error);
      toast({
        title: "選択エラー",
        description: "ユーザーの選択処理中にエラーが発生しました。",
        variant: "destructive"
      });
    }
  }, [toast]);

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
      // 最初の受信者をメイン受信者とし、残りを追加受信者として扱う
      const mainRecipient = selectedRecipients[0];
      const additionalRecipientIds = selectedRecipients.slice(1).map(r => r.id);
      
      // 単一のカードを作成し、複数の宛先を含める
      await createCard({
        recipientId: mainRecipient.id,
        recipientType: "user",
        message: data.message,
        points: data.points, // ポイントを追加
        public: true, // すべて公開に設定
        additionalRecipients: additionalRecipientIds.length > 0 ? additionalRecipientIds : undefined
      });
      
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
      
      // 送信完了コールバックがあれば呼び出す
      if (onSent) {
        onSent();
      }
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
                <div className="space-y-4">
                  {/* 階層式ドロップダウン: 所属階層1 */}
                  <div>
                    <Label className="text-sm font-medium block mb-1.5">所属階層1</Label>
                    <Select 
                      value={selectedLevel1Department || "all"}
                      onValueChange={(value: string) => {
                        console.log("階層1選択:", value);
                        setSelectedLevel1Department(value === "all" ? null : value);
                        setDepartmentFilter(null);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="階層1の部署を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全ての部署</SelectItem>
                        {departmentsByLevel[1].map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* 階層1が選択されている場合のみ階層2を表示 */}
                  {selectedLevel1Department && (
                    <div>
                      <Label className="text-sm font-medium block mb-1.5">所属階層2</Label>
                      <Select
                        value={
                          departmentFilter && departmentFilter.startsWith(selectedLevel1Department) && 
                          departmentFilter.split('/').length === 2
                            ? departmentFilter.split('/')[1]
                            : "all"
                        }
                        onValueChange={(value: string) => {
                          console.log("階層2選択:", value);
                          if (value && value !== "all") {
                            // 階層2を選択した場合
                            const level2Path = `${selectedLevel1Department}/${value}`;
                            setSelectedLevel2Department(value);
                            setDepartmentFilter(level2Path);
                          } else {
                            // 「全て」を選択した場合
                            setSelectedLevel2Department(null);
                            setDepartmentFilter(null);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`${selectedLevel1Department}内の部署を選択`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全て ({selectedLevel1Department})</SelectItem>
                          {availableUsers
                            .filter(u => u.department?.startsWith(selectedLevel1Department))
                            .map(u => {
                              const parts = u.department?.split(/[\/\>　]/);
                              return parts && parts.length > 1 ? parts[1].trim() : null;
                            })
                            .filter((v, i, a) => v && a.indexOf(v) === i) // 重複を除去
                            .filter(Boolean) // nullを除外
                            .map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* 階層2が選択されている場合のみ階層3を表示 */}
                  {selectedLevel1Department && selectedLevel2Department && (
                    <div>
                      <Label className="text-sm font-medium block mb-1.5">所属階層3</Label>
                      <Select
                        value={
                          departmentFilter && 
                          departmentFilter.startsWith(`${selectedLevel1Department}/${selectedLevel2Department}`) && 
                          departmentFilter.split('/').length === 3
                            ? departmentFilter.split('/')[2]
                            : "all"
                        }
                        onValueChange={(value: string) => {
                          console.log("階層3選択:", value);
                          if (value && value !== "all") {
                            // 階層3を選択した場合
                            const level3Path = `${selectedLevel1Department}/${selectedLevel2Department}/${value}`;
                            setSelectedLevel3Department(value);
                            setDepartmentFilter(level3Path);
                          } else {
                            // 「全て」を選択した場合
                            setSelectedLevel3Department(null);
                            setDepartmentFilter(`${selectedLevel1Department}/${selectedLevel2Department}`);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`${selectedLevel2Department}内の部署を選択`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全て ({selectedLevel2Department})</SelectItem>
                          {availableUsers
                            .filter(u => u.department?.startsWith(`${selectedLevel1Department}/${selectedLevel2Department}`))
                            .map(u => {
                              const parts = u.department?.split(/[\/\>　]/);
                              return parts && parts.length > 2 ? parts[2].trim() : null;
                            })
                            .filter((v, i, a) => v && a.indexOf(v) === i) // 重複を除去
                            .filter(Boolean) // nullを除外
                            .map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* 現在の部署フィルター表示 */}
                  {(selectedLevel1Department || departmentFilter) && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500">現在のフィルター:</p>
                      <p className="text-sm font-medium">
                        {departmentFilter || selectedLevel1Department || "全部署"}
                      </p>
                      {(selectedLevel1Department || departmentFilter) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs mt-1 h-8 px-2 text-gray-500"
                          onClick={() => {
                            setSelectedLevel1Department(null);
                            setDepartmentFilter(null);
                          }}
                        >
                          <X size={12} className="mr-1" />
                          フィルターをクリア
                        </Button>
                      )}
                    </div>
                  )}
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
                    filteredUsers.map((availableUser) => {
                      const isSelected = selectedRecipients.some(r => r.id === availableUser.id);
                      
                      // ユーザークリック時のハンドラー（フック外で定義）
                      const handleUserClick = (e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          toggleUserSelection(availableUser);
                        } catch (error) {
                          console.error('ユーザー選択エラー:', error);
                          toast({
                            title: "選択エラー",
                            description: "ユーザーの選択中にエラーが発生しました。",
                            variant: "destructive"
                          });
                        }
                      };
                      
                      return (
                        <div 
                          key={availableUser.id} 
                          className="flex items-center space-x-2 py-2 px-2 hover:bg-blue-50 hover:border-l-4 hover:border-[#3990EA] rounded-sm transition-all duration-200"
                        >
                          <Checkbox
                            id={`user-${availableUser.id}`}
                            checked={isSelected}
                            onCheckedChange={() => {
                              // チェックボックス専用ハンドラー - 無限ループを防ぐため最小限に
                              try {
                                toggleUserSelection(availableUser);
                              } catch (error) {
                                console.error('チェックボックス選択エラー:', error);
                              }
                            }}
                            className="mr-3"
                          />
                          <div 
                            className="flex items-center text-sm flex-1 cursor-pointer"
                            onClick={handleUserClick}
                          >
                            <Avatar className="h-8 w-8 mr-3">
                              {availableUser.customAvatarUrl ? (
                                <AvatarImage 
                                  src={availableUser.customAvatarUrl} 
                                  alt={availableUser.displayName || availableUser.name}
                                  className="object-cover"
                                />
                              ) : (
                                <AvatarFallback className="text-sm text-white bg-[#3990EA]">
                                  {(availableUser.displayName || availableUser.name).charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 hover:text-[#3990EA] transition-colors">
                                {availableUser.displayName || availableUser.name}
                              </div>
                              {availableUser.department && (
                                <div className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                                  {availableUser.department}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
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
          
          {/* ポイント入力 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">ポイント付与</h3>
              <span className="text-lg font-bold text-[#3990EA]">
                {form.watch("points")} PT
              </span>
            </div>
            
            {/* 現在のポイント情報 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="text-gray-600">現在のポイント：</span>
                  <span className="font-semibold text-gray-800">{user?.weeklyPoints || 0} PT</span>
                </div>
                <div>
                  <span className="text-gray-600">送信後：</span>
                  <span className="font-semibold text-[#3990EA]">
                    {(user?.weeklyPoints || 0) - (form.watch("points") * selectedRecipients.length)} PT
                  </span>
                </div>
              </div>
              {selectedRecipients.length > 1 && (
                <div className="text-xs text-gray-500 mt-1">
                  {selectedRecipients.length}人に送信するため、{form.watch("points") * selectedRecipients.length} PT消費
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="140"
                step="5"
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-gradient"
                style={{
                  background: `linear-gradient(to right, #3990EA 0%, #3990EA ${(form.watch("points") / 140) * 100}%, #e5e7eb ${(form.watch("points") / 140) * 100}%, #e5e7eb 100%)`
                }}
                {...form.register("points", { valueAsNumber: true })}
              />

            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 PT</span>
              <span>140 PT</span>
            </div>
            {form.formState.errors.points && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.points.message as string}
              </p>
            )}
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