import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useAuth } from "@/context/auth-context-new";
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
  Star,
  Heart,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, getInitials } from "@/lib/utils";

interface HeaderProps {
  toggleSidebar?: () => void;
  onCardFormOpen?: () => void;
}

export default function Header({ toggleSidebar, onCardFormOpen }: HeaderProps) {
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

      <div className="flex items-center space-x-3">
        {user && (
          <>
            {/* ポイント表示 */}
            <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              <svg className="w-4 h-4 text-[#3990EA]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-sm font-medium text-[#3990EA]">
                {user.weeklyPoints}pt
              </span>
            </div>

            {/* 通知ボタン */}
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {notifications}
                  </span>
                )}
              </Button>
            </Link>

            {/* ユーザーメニュー */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <BearAvatar 
                    name={user.name}
                    avatarColor={user.avatarColor}
                    customAvatarUrl={user.customAvatarUrl}
                    size="sm"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </DropdownMenuItem>
                </Link>
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