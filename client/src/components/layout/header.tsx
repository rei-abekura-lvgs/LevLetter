import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { BearAvatar } from "@/components/ui/bear-avatar";
import { BearLogo } from "@/components/bear-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Settings, 
  User as UserIcon, 
  LogOut, 
  Bell, 
  Menu, 
  Home, 
  FileText, 
  Building2,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, getInitials } from "@/lib/utils";

interface HeaderProps {
  toggleSidebar?: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [notifications, setNotifications] = useState<number>(2); // 仮の通知数

  // getInitialsはutilsから使用

  // ナビゲーションリンク
  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div
          className={cn(
            "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center">
        {isMobile && toggleSidebar && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Link href="/">
          <span className="text-xl font-bold text-primary">LevLetter</span>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                      {notifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>通知</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  山田さんがあなたのカードにいいねしました
                </DropdownMenuItem>
                <DropdownMenuItem>
                  佐藤さんから新しいカードが届きました
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center">
                  すべて既読にする
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full border-2 border-[#3990EA] hover:bg-[#3990EA]/10">
                  {user.customAvatarUrl ? (
                    <img 
                      src={user.customAvatarUrl} 
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <BearLogo size={36} useTransparent={true} bgColor="bg-[#3990EA]" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="bg-[#3990EA]/5 rounded-t-md pb-3">
                  <div className="flex items-center gap-3">
                    {user.customAvatarUrl ? (
                      <img 
                        src={user.customAvatarUrl} 
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover border border-[#3990EA]"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-[#3990EA] flex items-center justify-center text-white font-medium">
                        {user.displayName?.[0] || user.name[0]}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold">{user.displayName || user.name}</span>
                      <span className="text-xs text-gray-600">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem className="py-2 focus:bg-[#3990EA]/10 focus:text-[#3990EA]">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>プロフィール設定</span>
                  </DropdownMenuItem>
                </Link>
                
                {/* 管理者メニュー */}
                {user.isAdmin && (
                  <Link href="/admin">
                    <DropdownMenuItem className="py-2 focus:bg-[#046EB8]/10 focus:text-[#046EB8]">
                      <Star className="mr-2 h-4 w-4 text-amber-500" />
                      <span>管理者設定</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}