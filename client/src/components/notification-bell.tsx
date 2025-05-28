import { useState, useEffect, useRef, useCallback } from "react";
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
  
  // 削除された通知のIDを管理（環境に依存しない初期化）
  const [clearedNotifications, setClearedNotifications] = useState<Set<string>>(() => {
    try {
      const cleared = localStorage.getItem('clearedNotifications');
      return cleared ? new Set(JSON.parse(cleared)) : new Set();
    } catch (error) {
      console.log("ローカルストレージアクセスエラー、空のSetで初期化");
      return new Set();
    }
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
  const notifications = allNotifications.filter(n => !clearedNotifications.has(String(n.id)));

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
      
      // 現在のページがホームページでない場合は、まずホームに移動
      if (window.location.pathname !== '/') {
        setLocation('/');
        // 少し遅延してからカードジャンプを実行
        setTimeout(() => {
          if (notification.relatedCardId) {
            jumpToCard(notification.relatedCardId);
          }
        }, 500);
      } else {
        // すでにホームページの場合は直接ジャンプ
        if (notification.relatedCardId) {
          jumpToCard(notification.relatedCardId);
        }
      }
    }
  };

  // カードジャンプ機能
  const jumpToCard = (cardId: number) => {
    console.log(`🎯 カード${cardId}への直接ジャンプ実行`);
    
    // カード要素を検索
    const cardElement = document.getElementById(`card-${cardId}`);
    if (cardElement) {
      console.log("✅ カード要素発見 - スクロール実行");
      cardElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    } else {
      console.log("❌ カード要素が見つからない - URLパラメータでリトライ");
      // カード要素が見つからない場合はURLパラメータ方式を使用
      setLocation(`/?cardId=${cardId}`);
    }
  };

  // すべての通知を削除する処理（ローカルストレージベース）
  const clearAllNotifications = () => {
    console.log("🗑️ すべての通知を削除開始");
    
    // 現在の通知IDをすべてクリア済みとしてマーク
    const allNotificationIds = new Set([...Array.from(clearedNotifications), ...notifications.map(n => String(n.id))]);
    setClearedNotifications(allNotificationIds);
    
    // ローカルストレージに保存
    localStorage.setItem('clearedNotifications', JSON.stringify(Array.from(allNotificationIds)));
    
    console.log("✅ すべての通知を削除完了");
    toast({
      title: "通知を削除しました",
      description: "すべての通知を削除しました",
      duration: 2000,
    });
  };

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

  // 最新10件を表示
  const recentNotifications = notifications.slice(0, 10);

  // 通知アイテムコンポーネント（Intersection Observer付き）
  const NotificationItem = ({ notification, isRead, onMarkAsRead, onClick }: {
    notification: any;
    isRead: boolean;
    onMarkAsRead: () => void;
    onClick: () => void;
  }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    // 自動既読化機能を削除（手動削除のみ）

    return (
      <DropdownMenuItem
        ref={itemRef}
        className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
        onClick={onClick}
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
          {!isRead && (
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
          )}
        </div>
      </DropdownMenuItem>
    );
  };

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
              <NotificationItem
                key={notification.id}
                notification={notification}
                isRead={clearedNotifications.has(notification.id)}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="w-full text-center py-2 text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={clearAllNotifications}
            >
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                すべての通知を消す
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="w-full text-center py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              onClick={() => {
                setClearedNotifications(new Set());
                try {
                  localStorage.removeItem('clearedNotifications');
                } catch (error) {
                  console.log("ローカルストレージ削除エラー:", error);
                }
                console.log("🔄 通知バッジをリセット");
                toast({
                  description: "通知バッジをリセットしました",
                });
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Bell className="h-4 w-4" />
                バッジをリセット
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}