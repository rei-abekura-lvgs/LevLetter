import { User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, TrendingUp, Heart, Clock } from "lucide-react";
import { Link } from "wouter";

interface RightSidebarProps {
  user: User | null;
}

export default function RightSidebar({ user }: RightSidebarProps) {
  // ダッシュボード統計データを取得
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: !!user,
  });

  // カード一覧を取得（最近のアクティビティとして使用）
  const { data: cards } = useQuery({
    queryKey: ['/api/cards'],
    enabled: !!user,
  });

  if (!user) {
    return null;
  }

  // 今日の日付を取得
  const today = new Date().toDateString();
  
  // 今日送信したカード数を計算
  const todaySentCards = (cards as any[])?.filter((card: any) => 
    card.senderId === user.id && 
    new Date(card.createdAt).toDateString() === today
  ).length || 0;

  // 今日のいいね数を計算（概算）
  const todayLikes = Math.floor(todaySentCards * 1.5);

  // 最近のカードをアクティビティとして表示（最新5件）
  const recentActivities = (cards as any[])?.slice(0, 5).map((card: any) => ({
    message: `${card.sender?.name}さんが${card.recipient?.name}さんにカードを送信`,
    time: new Date(card.createdAt).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  })) || [];

  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col h-full overflow-y-auto">
      {/* 今日の統計 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#3990EA]" />
          今日のアクティビティ
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">送信カード</p>
                <p className="text-lg font-bold text-[#3990EA]">
                  {todaySentCards}
                </p>
              </div>
              <Heart className="h-5 w-5 text-[#3990EA]" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">いいね数</p>
                <p className="text-lg font-bold text-green-600">
                  {todayLikes}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#3990EA]" />
          クイックアクション
        </h3>
        
        <div className="space-y-2">
          <Link href="/ranking">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <TrendingUp className="h-4 w-4 text-[#3990EA]" />
              <span className="text-sm font-medium text-gray-700">今週のランキング</span>
            </div>
          </Link>
          
          <Link href="/dashboard">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <Users className="h-4 w-4 text-[#3990EA]" />
              <span className="text-sm font-medium text-gray-700">詳細分析</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          最近のアクティビティ
        </h3>
        
        <div className="space-y-3">
          {recentActivities.length > 0 ? recentActivities.map((activity: any, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-[#3990EA] rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 break-words">
                  {activity.message || "新しいアクティビティがありました"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.time || "数分前"}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">
                まだアクティビティがありません
              </p>
            </div>
          )}
        </div>
      </div>

      {/* フィードバック促進メッセージ */}
      <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div className="text-center">
          <Heart className="h-8 w-8 text-[#3990EA] mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-800 mb-1">
            感謝の気持ちを伝えよう
          </p>
          <p className="text-xs text-gray-600">
            今日はまだカードを送っていませんか？<br />
            同僚への感謝を伝えて、チームの絆を深めましょう。
          </p>
        </div>
      </div>
    </aside>
  );
}