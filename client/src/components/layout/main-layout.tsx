import { ReactNode } from "react";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useAuth } from "@/context/auth-context";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* デスクトップ用サイドバー */}
      <Sidebar user={user} />

      {/* メインコンテンツエリア */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* モバイル用ヘッダー */}
        <MobileNav user={user} />

        {/* メインコンテンツ */}
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none pb-16 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
