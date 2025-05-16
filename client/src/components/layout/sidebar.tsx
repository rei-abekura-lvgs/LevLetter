import { User } from "../../../shared/schema";
import { Link, useLocation } from "wouter";
import { Home, Send, User as UserIcon, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { logout } from "../../lib/auth";

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
      <Link href={href}>
        <a
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </a>
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
        <NavItem href="/my-cards" icon={Send} label="マイカード" />
        <NavItem href="/profile" icon={UserIcon} label="プロフィール" />
      </div>

      {user && (
        <div className="border-t pt-4 mt-auto">
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user.displayName?.[0] || user.name[0]}
              </div>
              <div>
                <p className="font-medium">{user.displayName || user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
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