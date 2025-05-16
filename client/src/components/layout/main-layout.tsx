import { ReactNode, useState } from "react";
import { useAuth } from "@/context/auth-context";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import Header from "./header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1">
        {/* デスクトップ用サイドバー */}
        {!isMobile && <Sidebar user={user} />}
        
        {/* モバイル用サイドバー - トグル可能 */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleSidebar}>
            <div className="h-full w-64 bg-white" onClick={e => e.stopPropagation()}>
              <Sidebar user={user} />
            </div>
          </div>
        )}
        
        <div className="flex-1">
          {isMobile && <MobileNav user={user} />}
          
          <main className="p-4 md:p-6 max-w-6xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}