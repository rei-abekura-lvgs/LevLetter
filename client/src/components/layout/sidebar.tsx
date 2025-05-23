import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Award, Gift, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import { BearLogo } from "@/components/bear-logo";

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
          

        </div>
      )}
    </div>
  );
}