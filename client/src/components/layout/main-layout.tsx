import { ReactNode } from "react";
import { User } from "@shared/schema";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const user = null; // 一時的に空のユーザーを設定

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {!isMobile && <Sidebar user={user} />}
      <div className="flex-1 flex flex-col">
        {isMobile && <MobileNav user={user} />}
        <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">
          {children}
        </main>
        <footer className="p-4 text-center text-sm text-muted-foreground border-t">
          &copy; {new Date().getFullYear()} LevLetter - All rights reserved
        </footer>
      </div>
    </div>
  );
}