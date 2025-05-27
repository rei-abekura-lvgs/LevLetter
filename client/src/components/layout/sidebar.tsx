import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context-new";
import { Home, Settings, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { BearLogo } from "@/components/bear-logo";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user: propUser }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

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
          
          {/* シンプルなナビゲーション */}
          <div className="space-y-2 mb-auto">
            <Link href="/">
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                location === "/" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
              )}>
                <Home className="h-5 w-5" />
                <span className="font-medium">ホーム</span>
              </div>
            </Link>
            
            <Link href="/profile">
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                location === "/profile" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
              )}>
                <UserCircle className="h-5 w-5" />
                <span className="font-medium">プロフィール設定</span>
              </div>
            </Link>
            
            {user.isAdmin && (
              <Link href="/admin">
                <div className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                  location === "/admin" ? "bg-[#3990EA] text-white" : "text-gray-700 hover:bg-gray-100"
                )}>
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">管理者設定</span>
                </div>
              </Link>
            )}
          </div>
          
          {/* ログアウトボタン */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full text-left text-gray-700 hover:bg-gray-100 p-3 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  );
}