import { ReactNode, useState } from "react";
import { useAuth } from "@/context/auth-context-new";
import Sidebar from "./sidebar";
import RightSidebar from "./right-sidebar";
import MobileNav from "./mobile-nav";
import Header from "./header";
import Footer from "./footer";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  onCardFormOpen?: () => void;
}

export default function MainLayout({ children, onCardFormOpen }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col flex-1">
        <Header toggleSidebar={toggleSidebar} onCardFormOpen={onCardFormOpen} />
        
        <div className="flex flex-1 overflow-hidden">
          {/* デスクトップ用サイドバー - 固定 */}
          {!isMobile && (
            <div className="w-64 flex-shrink-0">
              <Sidebar user={user} />
            </div>
          )}
          
          {/* モバイル用サイドバー - トグル可能 */}
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleSidebar}>
              <div className="h-full w-64 bg-white" onClick={e => e.stopPropagation()}>
                <Sidebar user={user} />
              </div>
            </div>
          )}
          
          <div className="flex-1 flex flex-col overflow-hidden">
            {isMobile && <MobileNav user={user} />}
            
            <div className="flex flex-1 overflow-hidden">
              <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full">
                {children}
              </main>
              
              {/* PC時のみ右側サイドバー表示 */}
              {!isMobile && (
                <div className="w-80 flex-shrink-0">
                  <RightSidebar user={user} />
                </div>
              )}
            </div>
            
            {/* モバイル時のみフッター表示 */}
            {isMobile && <Footer />}
          </div>
        </div>
      </div>
    </div>
  );
}