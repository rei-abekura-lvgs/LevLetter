import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Heart, MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import bearAvatarUrl from "@assets/ChatGPT Image 2025年5月22日 20_52_25_1748333385657.png";

interface NotificationUser {
  id: number;
  name: string;
  displayName: string | null;
  customAvatarUrl: string | null;
  avatarColor: string;
}

interface Notification {
  id: number;
  userId: number;
  type: 'new_card' | 'card_like';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedCardId: number | null;
  relatedUser: NotificationUser | null;
}

export default function NotificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      console.log("📨 通知データ取得開始");
      const response = await fetch("/api/notifications", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`通知取得エラー: ${response.status}`);
      }
      const data = await response.json();
      console.log("📨 通知データ取得完了:", data);
      return data;
    }
  });

  const markAsRead = async (notificationId: number) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "通知を既読にしました" });
    } catch (error) {
      console.error('Mark as read error:', error);
      toast({ 
        title: "エラーが発生しました",
        description: "通知の既読処理に失敗しました",
        variant: "destructive" 
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "すべての通知を既読にしました" });
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast({ 
        title: "エラーが発生しました",
        description: "通知の一括既読処理に失敗しました",
        variant: "destructive" 
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_card':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'card_like':
        return <Heart className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">通知</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAllAsRead}
          >
            すべて既読
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">通知はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
              onClick={() => !notification.isRead && markAsRead(notification.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {notification.relatedUser ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={notification.relatedUser.customAvatarUrl || bearAvatarUrl} 
                          alt={notification.relatedUser.displayName || notification.relatedUser.name}
                        />
                        <AvatarFallback className={`text-white bg-${notification.relatedUser.avatarColor}`}>
                          {(notification.relatedUser.displayName || notification.relatedUser.name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getNotificationIcon(notification.type)}
                      <h3 className="font-medium text-gray-900 text-sm">
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(notification.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}