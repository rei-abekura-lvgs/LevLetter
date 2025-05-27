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

      <div className="flex items-center space-x-2">
        {user && (
          <>
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

            {/* 感謝の気持ちを伝えるボタン - 洗練されたデザイン */}
            <Button 
              className="bg-gradient-to-r from-[#3990EA] to-[#2D7BD9] hover:from-[#2D7BD9] hover:to-[#2563EB] text-white px-4 py-3 rounded-xl transition-all duration-300 ease-out flex items-center gap-3 min-w-[220px] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group"
              onClick={() => {
                // カード作成ダイアログを開く処理をここに追加
                console.log('感謝の気持ちを伝えるボタンがクリックされました');
              }}
            >
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/25 transition-colors duration-300 group-hover:scale-110 transform">
                <svg className="w-5 h-5 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </div>
              <div className="text-left group-hover:translate-x-0.5 transform transition-transform duration-300">
                <div className="text-sm font-semibold drop-shadow-sm">感謝の気持ちを伝える</div>
                <div className="text-xs opacity-90 font-medium">新しいサンクスカードを作成</div>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </div>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}