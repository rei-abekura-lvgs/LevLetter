import { useState, useEffect, useRef } from "react";
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
import { updateProfile, getDepartments, uploadAvatar } from "@/lib/api";
import { Coins, HeartIcon, Camera, Upload, X } from "lucide-react";
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
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 部署一覧を取得
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data as any);
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
  
  // 画像アップロード処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズのチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "エラー",
        description: "ファイルサイズは5MB以下にしてください",
        variant: "destructive",
      });
      return;
    }
    
    // 画像ファイルのチェック
    if (!file.type.startsWith('image/')) {
      toast({
        title: "エラー",
        description: "画像ファイルを選択してください",
        variant: "destructive",
      });
      return;
    }
    
    // プレビュー表示
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // 画像アップロード送信
  const handleUploadImage = async () => {
    if (!previewImage) return;
    
    try {
      setUploadingImage(true);
      await uploadAvatar(user.id, previewImage);
      
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/me"]
      });
      
      toast({
        title: "アップロード完了",
        description: "プロフィール画像を更新しました",
      });
      
      // モーダルを閉じる
      setPreviewImage(null);
      setImageUploadOpen(false);
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      toast({
        title: "エラー",
        description: "画像のアップロードに失敗しました",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: user.displayName || user.name
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { displayName: string }) => updateProfile(user.id, data),
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

  const onSubmit = (data: { displayName: string }) => {
    // 部署変更は無効化されたので、表示名のみ更新
    console.log("送信データ:", data);
    updateProfileMutation.mutate(data);
  };

  // ユーザーのイニシャル
  const userInitials = user.name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <div>
      {/* 画像アップロードダイアログ */}
      <Dialog open={imageUploadOpen} onOpenChange={setImageUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">プロフィール画像のアップロード</DialogTitle>
          </DialogHeader>
          
          <div className="px-1 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-3">
                プロフィール画像をアップロードしてください。<br />
                5MB以内のJPG、PNG、GIF形式の画像をご利用いただけます。
              </p>
              
              {!previewImage ? (
                <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
                  <Camera className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center mb-4">画像をクリックまたはドラッグしてアップロード</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    className="text-primary-600 border-primary-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    画像を選択
                  </Button>
                </div>
              ) : (
                <div className="relative mb-4">
                  <img 
                    src={previewImage} 
                    alt="プレビュー" 
                    className="w-full max-h-60 object-contain rounded-lg" 
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 h-8 w-8"
                    onClick={() => setPreviewImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => {
                  setPreviewImage(null);
                  setImageUploadOpen(false);
                }}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                disabled={!previewImage || uploadingImage}
                className="bg-primary-600 hover:bg-primary-700"
                onClick={handleUploadImage}
              >
                {uploadingImage ? (
                  <>
                    アップロード中...
                    <span className="ml-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  <>
                    アップロード
                    <Upload className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* プロフィール編集ダイアログ */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">マイプロフィール</DialogTitle>
          </DialogHeader>
          
          <div className="px-1 py-4">
            <div className="flex flex-col items-center mb-6">
              {user.customAvatarUrl ? (
                <div className="relative">
                  <img 
                    src={user.customAvatarUrl} 
                    alt={user.name}
                    className="h-20 w-20 rounded-full object-cover mb-4" 
                  />
                  <button
                    type="button"
                    onClick={() => setImageUploadOpen(true)}
                    className="absolute bottom-3 right-0 bg-primary-600 rounded-full p-1 shadow-md hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className={`h-20 w-20 rounded-full bg-${user.avatarColor}-500 flex items-center justify-center text-white text-xl font-semibold mb-4`}>
                    {userInitials}
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUploadOpen(true)}
                    className="absolute bottom-3 right-0 bg-primary-600 rounded-full p-1 shadow-md hover:bg-primary-700 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}
              
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
                
                <FormItem>
                  <FormLabel>部署</FormLabel>
                  <Input
                    type="text"
                    value={user.department || "未設定"}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">部署は管理者によって設定されます</p>
                </FormItem>
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
                <Button variant="outline" className="mr-2" type="button">
                  キャンセル
                </Button>
              </DialogClose>
              <Button
                type="button"
                disabled={updateProfileMutation.isPending}
                className="bg-primary-600 hover:bg-primary-700"
                onClick={() => {
                  console.log("フォームデータ:", form.getValues());
                  form.handleSubmit(onSubmit)();
                }}
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
    </div>
  );
}