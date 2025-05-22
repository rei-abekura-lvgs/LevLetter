import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Award, Gift, TrendingUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { user: authUser } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="w-64 border-r bg-white min-h-screen p-4 flex flex-col">
      {user && (
        <div className="flex-1 flex flex-col">
          {/* ユーザー情報カード */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              {user.customAvatarUrl ? (
                <img 
                  src={user.customAvatarUrl} 
                  alt={user.name}
                  className="h-10 w-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className={`h-10 w-10 rounded-full bg-${user.avatarColor || "primary"} flex items-center justify-center text-primary-foreground`}>
                  {user.displayName?.[0] || user.name[0]}
                </div>
              )}
              <div>
                <p className="font-medium">{user.displayName || user.name}</p>
                <p className="text-sm text-muted-foreground">{user.department || "所属なし"}</p>
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
                  今週の付与可能ポイント
                </div>
                <span className="text-xl font-bold text-primary">{user.weeklyPoints} PT</span>
              </div>
              <Progress value={(user.weeklyPoints / 500) * 100} className="h-2.5" />
              <p className="text-xs text-gray-500 mt-2">毎週500ポイントが付与されます</p>
            </div>
            
            {/* 累計獲得ポイント */}
            <div className="bg-white p-4 rounded-md border">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium">
                  <Award className="h-5 w-5 mr-2 text-amber-500" />
                  累計獲得ポイント
                </div>
                <span className="text-xl font-bold text-amber-500">{user.totalPointsReceived} PT</span>
              </div>
            </div>
            
            {/* ポイントランキング */}
            <div className="bg-white p-4 rounded-md border">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                  ポイントランキング
                </div>
                <span className="text-sm px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-full font-medium">--位</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 rounded-md text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}