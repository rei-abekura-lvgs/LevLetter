import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Home, Award, Gift, Star, TrendingUp, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="w-64 border-r bg-white min-h-screen p-4 flex flex-col">
      <div className="py-6">
        <h1 className="text-2xl font-bold text-primary text-center">LevLetter</h1>
      </div>

      <div className="flex-1 space-y-2 py-4">
        <NavItem href="/" icon={Home} label="ホーム" />
      </div>

      {user && (
        <div className="border-t pt-4 mt-auto">
          {/* ユーザー情報カード */}
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user.displayName?.[0] || user.name[0]}
              </div>
              <div>
                <p className="font-medium">{user.displayName || user.name}</p>
                <p className="text-sm text-muted-foreground">{user.department || "所属なし"}</p>
              </div>
            </div>
            
            {/* ポイント情報 */}
            <div className="space-y-4 mt-4">
              {/* 今週の付与可能ポイント */}
              <div className="bg-white p-3 rounded-md border">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center text-sm font-medium">
                    <Gift className="h-4 w-4 mr-2 text-primary" />
                    今週の付与可能ポイント
                  </div>
                  <span className="text-lg font-bold text-primary">{user.weeklyPoints} PT</span>
                </div>
                <Progress value={(user.weeklyPoints / 500) * 100} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">毎週500ポイントが付与されます</p>
              </div>
              
              {/* 累計獲得ポイント */}
              <div className="bg-white p-3 rounded-md border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-medium">
                    <Award className="h-4 w-4 mr-2 text-amber-500" />
                    累計獲得ポイント
                  </div>
                  <span className="text-lg font-bold text-amber-500">{user.totalPointsReceived} PT</span>
                </div>
              </div>
              
              {/* ポイントランキング */}
              <div className="bg-white p-3 rounded-md border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-medium">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                    ポイントランキング
                  </div>
                  <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">--位</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-md text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>ログアウト</span>
          </button>
        </div>
      )}
    </div>
  );
}