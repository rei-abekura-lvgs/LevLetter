import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context-new";
import { Home, Settings, UserCircle, LogOut, Bell, BarChart3, Trophy, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { BearLogo } from "@/components/bear-logo";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user: propUser }: SidebarProps) {
  const [location] = useLocation();
  const { user: authUser, isAuthenticated } = useAuth();
  
  // サイドバー用にリアルタイムでユーザー情報を取得
  const { data: currentUser, refetch } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    enabled: isAuthenticated,
    refetchOnWindowFocus: true,
    staleTime: 0, // 常に最新データを使用
  });
  
  // 最新のユーザー情報を使用（キャッシュが更新された場合は即座に反映）
  const user = currentUser || authUser;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="w-64 border-r bg-white h-full p-4 flex flex-col">
      {user && (
        <div className="flex-1 flex flex-col">
          {/* ユーザー情報カード */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col items-center text-center">
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
                <p className="text-xs text-gray-600 mt-1">{user.department || "所属なし"}</p>
              </div>
            </div>
          </div>
          
          {/* 今週の残りポイント表示 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">今週の残りポイント</p>
            <p className="text-2xl font-bold text-[#3990EA] mb-1">{user?.weeklyPoints || 0}pt</p>
            <div className="text-xs text-gray-500">
              <p>毎週月曜日に500ptが付与されます</p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-[#3990EA] h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(user.weeklyPoints / 500) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 受信ポイント表示 */}
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">受信ポイント</p>
              <span className="text-xs text-gray-500">もらったポイント</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">今月受信</span>
                <span className="text-sm font-semibold text-green-600">{user.weeklyPointsReceived}pt</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">累計受信</span>
                <span className="text-lg font-bold text-green-700">{user.totalPointsReceived}pt</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">カードの受信やいいねで受け取ったポイント</p>
          </div>

          {/* 下部アクションエリア */}
          <div className="mt-auto pt-4 pb-6 border-t border-gray-200">
            <div className="space-y-2">
              <Link href="/profile">
                <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  location === "/profile" 
                    ? "bg-[#3990EA] text-white" 
                    : "text-gray-700 hover:bg-gray-100"
                )}>
                  <UserCircle className="h-4 w-4" />
                  プロフィール設定
                </button>
              </Link>

              {user.isAdmin && (
                <Link href="/admin">
                  <button className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                    location === "/admin" 
                      ? "bg-[#3990EA] text-white" 
                      : "text-gray-700 hover:bg-gray-100"
                  )}>
                    <Shield className="h-4 w-4" />
                    管理者設定
                  </button>
                </Link>
              )}

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}