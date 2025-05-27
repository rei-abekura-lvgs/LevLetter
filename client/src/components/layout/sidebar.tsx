import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context-new";
import { Award, Gift, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { BearLogo } from "@/components/bear-logo";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user: propUser }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth(); // 認証コンテキストから直接取得（楽観的更新対応）

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="w-64 border-r bg-white h-full p-4 flex flex-col">

      
      {user && (
        <div className="flex-1 flex flex-col">
          {/* ユーザー情報カード - レイアウト改善 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col items-center text-center mb-2">
              {user.customAvatarUrl ? (
                <img 
                  src={user.customAvatarUrl} 
                  alt={user.name}
                  className="h-16 w-16 rounded-full object-cover border border-[#3990EA] mb-3 shadow-sm"
                />
              ) : (
                <div className="mb-3">
                  <BearLogo size={64} useTransparent={true} bgColor="bg-[#3990EA]" />
                </div>
              )}
              <div className="w-full">
                <p className="font-medium text-[#3990EA]">{user.displayName || user.name}</p>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{user.department || "所属なし"}</p>
              </div>
            </div>
          </div>
          
          {/* ポイント情報 */}
          <div className="space-y-6 mb-auto">
            <h2 className="text-lg font-semibold mb-3">ポイント状況</h2>
            
            {/* 今週の付与可能ポイント */}
            <div className="bg-white p-4 rounded-md border">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center text-sm font-medium">
                  <Gift className="h-5 w-5 mr-2 text-primary" />
                  今週の利用可能ポイント
                </div>
                <span className="text-xl font-bold text-primary">{user.weeklyPoints} PT</span>
              </div>
              <Progress value={(user.weeklyPoints / 500) * 100} className="h-2.5" />
              <p className="text-xs text-gray-500 mt-2">毎週500ポイントが付与されます</p>
            </div>
            
            {/* 累計獲得ポイント */}
            <div className="bg-white p-4 rounded-md border space-y-3">
              <div className="text-sm font-medium text-gray-700 mb-2">累計獲得ポイント</div>
              
              {/* 過去累計 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2 text-amber-500" />
                  過去累計
                </div>
                <span className="text-lg font-bold text-amber-500">{user.totalPointsReceived} PT</span>
              </div>
              
              {/* 週間累計 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                  今週の獲得
                </div>
                <span className="text-lg font-bold text-green-500">{user.weeklyPointsReceived || 0} PT</span>
              </div>
            </div>
            
            {/* ポイントランキング */}
            <Link href="/ranking">
              <div className="bg-white p-4 rounded-md border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-medium">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                    ポイントランキング
                  </div>
                  <span className="text-sm px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">詳細→</span>
                </div>
              </div>
            </Link>
          </div>
          
          {/* ナビゲーションメニュー */}
          <div className="space-y-2 mt-6">
            <Link href="/">
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                location === "/" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
              )}>
                <Award className="h-5 w-5" />
                <span className="font-medium">ホーム</span>
              </div>
            </Link>
            
            <Link href="/dashboard">
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                location === "/dashboard" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
              )}>
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">ダッシュボード</span>
              </div>
            </Link>
            
            <Link href="/ranking">
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                location === "/ranking" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
              )}>
                <Award className="h-5 w-5" />
                <span className="font-medium">ランキング</span>
              </div>
            </Link>
            
            <Link href="/profile">
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                location === "/profile" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
              )}>
                <Gift className="h-5 w-5" />
                <span className="font-medium">プロフィール</span>
              </div>
            </Link>
          </div>
          
          {/* ログアウトボタン */}
          <div className="mt-auto pt-4 border-t">
            <button 
              onClick={handleLogout}
              className="w-full text-left text-red-600 hover:text-red-700 text-sm font-medium"
            >
              ログアウト
            </button>
          </div>

        </div>
      )}
    </div>
  );
}