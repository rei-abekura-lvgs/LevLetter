import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileUpdateSchema, passwordChangeSchema } from "@shared/schema";
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
import { updateProfile, getDepartments, uploadAvatar, changePassword } from "@/lib/api";
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
  const [showPasswordChange, setShowPasswordChange] = useState(false);

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
  
  // 画像を圧縮する関数
  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          // 画像サイズを計算
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          // Canvas要素を作成して画像を描画
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = width;
          canvas.height = height;
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // 画像をBase64形式に変換
          const compressedDataUrl = canvas.toDataURL(file.type, quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  };

  // 画像アップロード処理
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズのチェック（初期チェック、10MB以上は完全に拒否）
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "エラー",
        description: "ファイルサイズが大きすぎます（最大10MB）",
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
    
    try {
      // 画像圧縮（ファイルサイズが1MB以上の場合）
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: "処理中",
          description: "画像を最適化しています...",
        });
        
        // 画像の品質を調整（サイズによって品質を変更）
        let quality = 0.7;
        if (file.size > 5 * 1024 * 1024) {
          quality = 0.5; // より大きいファイルはより圧縮
        }
        
        const compressedImage = await compressImage(file, 1200, 1200, quality);
        setPreviewImage(compressedImage);
        
        // データサイズ表示（デバッグ用）
        const originalSize = (file.size / 1024 / 1024).toFixed(2);
        const compressedSize = (compressedImage.length * 0.75 / 1024 / 1024).toFixed(2);
        console.log(`画像最適化: ${originalSize}MB → ${compressedSize}MB`);
        
        toast({
          title: "画像最適化完了",
          description: `${originalSize}MB → ${compressedSize}MB に最適化しました`,
        });
      } else {
        // 小さいファイルはそのまま表示
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("画像処理エラー:", error);
      toast({
        title: "エラー",
        description: "画像の処理中にエラーが発生しました",
        variant: "destructive",
      });
    }
  };
  
  // 画像アップロード送信
  const handleUploadImage = async () => {
    if (!previewImage) return;
    
    try {
      setUploadingImage(true);
      console.log("画像アップロード開始...");
      
      // アップロード実行
      const updatedUser = await uploadAvatar(user.id, previewImage);
      console.log("アップロード成功:", updatedUser);
      
      // 全てのキャッシュを更新して確実に反映させる
      // ユーザー情報のキャッシュを更新
      queryClient.invalidateQueries({
        queryKey: ["/api/auth/me"]
      });
      
      // ユーザー一覧を更新
      queryClient.invalidateQueries({
        queryKey: ["/api/users"]
      });
      
      // 管理者用ユーザー一覧の更新
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/users"]
      });
      
      // カード一覧の更新（アバターが表示されているため）
      queryClient.invalidateQueries({
        queryKey: ["/api/cards"]
      });
      
      // 強制的にすべてのキャッシュを更新
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: ["/api/auth/me"]
        });
      }, 500);
      
      // 成功通知
      toast({
        title: "アップロード完了",
        description: "プロフィール画像を更新しました。すべてのアイコンに適用されます。",
      });
      
      // モーダルを閉じる
      setPreviewImage(null);
      setImageUploadOpen(false);
    } catch (error) {
      console.error("画像アップロードエラー:", error);
      
      // 詳細なエラーメッセージを表示
      let errorMessage = "画像のアップロードに失敗しました";
      
      // エラーオブジェクトからメッセージを抽出
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage += `: ${JSON.stringify(error)}`;
      }
      
      toast({
        title: "エラー",
        description: errorMessage,
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

  // パスワード変更フォーム
  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast({
        title: "パスワード変更完了",
        description: "パスワードが正常に変更されました。",
      });
      
      // フォームをリセット
      passwordForm.reset();
      setShowPasswordChange(false);
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: `パスワード変更に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
        variant: "destructive"
      });
    }
  });

  const onPasswordSubmit = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword
    });
  };

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
                  <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                    <p className="text-sm text-gray-700 text-center mb-1">この画像は全てのアイコンで使用されます</p>
                    <p className="text-xs text-gray-500 text-center">「登録」ボタンをクリックして確定してください</p>
                  </div>
                  
                  <img 
                    src={previewImage} 
                    alt="プレビュー" 
                    className="w-full max-h-60 object-contain rounded-lg border border-gray-200" 
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
            
            {previewImage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-blue-700">
                    「登録する」ボタンをクリックして画像を確定してください
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                className="mr-3"
                onClick={() => {
                  setPreviewImage(null);
                  setImageUploadOpen(false);
                }}
              >
                キャンセル
              </Button>
              {previewImage && (
                <Button
                  type="button"
                  disabled={uploadingImage}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2 text-lg shadow-lg rounded-md"
                  onClick={handleUploadImage}
                >
                  {uploadingImage ? (
                    <>
                      登録中...
                      <span className="ml-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    </>
                  ) : (
                    <>
                      登録する
                      <Upload className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
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