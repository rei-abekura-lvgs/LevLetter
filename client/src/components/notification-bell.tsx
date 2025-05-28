import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Mail, Heart, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  userId: number;
  type: "new_card" | "card_like";
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCardId: number | null;
  relatedUser: {
    id: number;
    name: string;
    displayName: string | null;
  } | null;
}

export function NotificationBell() {
  console.log("🔔 通知ベルコンポーネントレンダリング");
  const [, setLocation] = useLocation();
  
  // 削除された通知のIDを管理
  const [clearedNotifications, setClearedNotifications] = useState<Set<string>>(() => {
    const cleared = localStorage.getItem('clearedNotifications');
    return cleared ? new Set(JSON.parse(cleared)) : new Set();
  });

  // 通知データを取得
  const { data: allNotifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      console.log("📨 通知データ取得開始（ベルコンポーネント）");
      const response = await fetch("/api/notifications", {
        credentials: 'include'
      });
      if (!response.ok) {
        console.error("❌ 通知取得失敗:", response.status, response.statusText);
        throw new Error(`通知取得エラー: ${response.status}`);
      }
      const data = await response.json();
      console.log("📨 通知データ取得完了（ベルコンポーネント）:", data);
      return data;
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  // 削除されていない通知のみを表示
  const notifications = allNotifications.filter(n => !clearedNotifications.has(n.id));

  // 未読通知の数を計算
  const unreadCount = notifications.length;
  
  console.log("🔔 通知ベル状態:", { 
    isLoading, 
    error: error?.message, 
    totalNotifications: allNotifications.length,
    unreadCount 
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 通知をクリックしたときの処理
  const handleNotificationClick = (notification: Notification) => {
    console.log("🔔 通知クリック:", notification);
    if (notification.relatedCardId) {
      console.log(`🎯 カード${notification.relatedCardId}にジャンプ開始`);
      // カードが存在する場合、ホームページに移動してカードにスクロール
      setLocation(`/?cardId=${notification.relatedCardId}`);
    }
  };

  // すべての通知を削除する処理
  const clearAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      console.log("🗑️ すべての通知を削除開始");
      const response = await apiRequest("POST", "/api/notifications/clear-all");
      return response;
    },
    onSuccess: () => {
      console.log("✅ すべての通知を削除完了");
      // 通知データをリフレッシュ
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "通知を削除しました",
        description: "すべての通知が削除されました",
      });
    },
    onError: (error) => {
      console.error("❌ 通知削除エラー:", error);
      toast({
        title: "エラー",
        description: "通知の削除に失敗しました",
        variant: "destructive",
      });
    }
  });

  // 通知の表示テキストを短縮
  const truncateMessage = (message: string, maxLength: number = 40) => {
    return message.length > maxLength ? message.substring(0, maxLength) + "..." : message;
  };

  // 時間表示をフォーマット
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ja 
      });
    } catch {
      return "不明";
    }
  };

  // 最新5件のみ表示
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 mr-4" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          通知 {unreadCount > 0 && `(${unreadCount})`}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            読み込み中...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-sm text-red-500">
            通知の取得に失敗しました
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            新しい通知はありません
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-2 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === "new_card" ? (
                      <Mail className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Heart className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {truncateMessage(notification.message)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatTime(notification.createdAt)}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="w-full text-center py-2 text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => clearAllNotificationsMutation.mutate()}
              disabled={clearAllNotificationsMutation.isPending}
            >
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                {clearAllNotificationsMutation.isPending ? "削除中..." : "すべての通知を消す"}
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}