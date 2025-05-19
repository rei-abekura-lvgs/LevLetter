import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, getDepartments } from "@/lib/api";
import { Coins, HeartIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileFormProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileForm({ user, open, onOpenChange }: ProfileFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [departments, setDepartments] = useState<{id: number, name: string}[]>([]);

  // 部署一覧を取得
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("部署一覧取得エラー:", error);
        toast({
          title: "エラー",
          description: "部署情報の取得に失敗しました",
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchDepartments();
    }
  }, [open, toast]);

  const form = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: user.displayName || user.name,
      department: user.department || null
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName: string, department?: string | null }) => updateProfile(user.id, data),
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/me"]
      });
      
      // 成功通知
      toast({
        title: "更新完了",
        description: "プロフィールを更新しました。",
      });
      
      // ダイアログを閉じる
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `プロフィールの更新に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: { displayName: string, department?: string | null }) => {
    updateProfileMutation.mutate(data);
  };

  // ユーザーのイニシャル
  const userInitials = user.name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">マイプロフィール</DialogTitle>
        </DialogHeader>
        
        <div className="px-1 py-4">
          <div className="flex flex-col items-center mb-6">
            <div className={`h-20 w-20 rounded-full bg-${user.avatarColor} flex items-center justify-center text-white text-xl font-semibold mb-4`}>
              {userInitials}
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">{user.displayName || user.name}</h3>
              <p className="text-sm text-gray-500">{user.department || ""}</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>表示名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-50"
                />
              </FormItem>
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部署</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="部署を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>部署一覧</SelectLabel>
                            <SelectItem value="">未設定</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">ポイント情報</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">今週の残りポイント</div>
                <div className="flex items-center">
                  <Coins className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-lg font-semibold text-gray-800">{user.weeklyPoints}</span>
                  <span className="text-sm text-gray-500 ml-1">/500</span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">累計獲得ポイント</div>
                <div className="flex items-center">
                  <HeartIcon className="h-4 w-4 text-accent-500 mr-1 fill-current" />
                  <span className="text-lg font-semibold text-gray-800">{user.totalPointsReceived.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <DialogClose asChild>
              <Button variant="outline" className="mr-2">
                キャンセル
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700"
              onClick={form.handleSubmit(onSubmit)}
            >
              変更を保存
              {updateProfileMutation.isPending && (
                <span className="ml-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
