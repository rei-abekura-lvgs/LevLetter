import { useState } from "react";
import { Link } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

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

  // 通知データを取得
  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
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

  // 未読通知の数を計算
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  console.log("🔔 通知ベル状態:", { 
    isLoading, 
    error: error?.message, 
    totalNotifications: notifications.length,
    unreadCount 
  });

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}