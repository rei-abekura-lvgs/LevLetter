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
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
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
  const [clearedNotifications, setClearedNotifications] = useState<Set<string>>(() => {
    const cleared = localStorage.getItem('clearedNotifications');
    return cleared ? new Set(JSON.parse(cleared)) : new Set();
  });

  const { data: allNotifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
    retry: false,
    refetchOnWindowFocus: false
  });

  console.log("📨 通知データ取得開始（ベルコンポーネント）");

  // 削除されていない通知のみを表示
  const notifications = allNotifications.filter(n => !clearedNotifications.has(n.id));

  console.log("📨 通知データ取得完了（ベルコンポーネント）:", notifications);

  // 未読通知の数を計算
  const unreadCount = notifications.length;
  
  console.log("🔔 通知ベル状態:", { 
    isLoading, 
    error: error?.message, 
    totalNotifications: notifications.length,
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
      window.location.href = `/?cardId=${notification.relatedCardId}`;
    }
  };

  // すべての通知を削除する処理
  const clearAllNotifications = () => {
    console.log("🗑️ すべての通知を削除開始");
    
    // 現在の通知IDをすべてクリア済みとしてマーク
    const allNotificationIds = new Set([...clearedNotifications, ...notifications.map(n => n.id)]);
    setClearedNotifications(allNotificationIds);
    
    // ローカルストレージに保存
    localStorage.setItem('clearedNotifications', JSON.stringify([...allNotificationIds]));
    
    console.log("✅ すべての通知を削除完了");
    toast({
      title: "通知を削除しました",
      description: "すべての通知を削除しました",
      duration: 2000,
    });
  };

  if (error) {
    console.error("❌ 通知削除エラー:", error);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">通知</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              すべて消す
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-gray-500">読み込み中...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">新しい通知はありません</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="mt-0.5">
                {notification.type === "new_card" ? (
                  <Mail className="h-4 w-4 text-blue-500" />
                ) : (
                  <Heart className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {notification.type === "new_card" ? "📧" : "❤️"} {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}