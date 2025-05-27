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

            {/* 感謝の気持ちを伝えるボタン - コンパクトなスタイル */}
            <Button 
              className="bg-[#3990EA] hover:bg-[#3990EA]/90 text-white px-3 py-2 rounded-full transition-colors flex items-center gap-2"
              onClick={() => {
                // カード作成ダイアログを開く処理をここに追加
                console.log('感謝の気持ちを伝えるボタンがクリックされました');
              }}
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Plus className="h-3 w-3" />
              </div>
              <div className="text-left">
                <div className="text-xs font-medium">感謝の気持ちを伝える</div>
                <div className="text-xs opacity-80">新しいサンクスカードを作成</div>
              </div>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}