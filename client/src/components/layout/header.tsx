import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useAuth } from "@/context/auth-context";
import { BearAvatar } from "@/components/ui/bear-avatar";
import { BearLogo } from "@/components/bear-logo";
import { NotificationBell } from "@/components/notification-bell";
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
            <Link href="/dashboard">
              <div className="relative flex items-center space-x-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer group">
                <svg className="w-4 h-4 text-[#3990EA]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span className="text-sm font-medium text-[#3990EA]">
                  {user.weeklyPoints}pt/500pt
                </span>
                
                {/* ツールチップ */}
                <div className="absolute top-full mt-2 right-0 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="text-left">
                    <div className="font-medium">今週の残りポイント</div>
                    <div className="text-gray-300 mt-1">毎週月曜日に500pt付与</div>
                    <div className="text-gray-300">クリックで詳細表示</div>
                    <div className="text-orange-300 mt-2 text-[11px]">💡 最新情報はブラウザ更新で確認</div>
                  </div>
                  {/* 矢印 */}
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-gray-800"></div>
                </div>
              </div>
            </Link>

            {/* 通知ベル */}
            <NotificationBell />

          </>
        )}
      </div>
    </header>
  );
}