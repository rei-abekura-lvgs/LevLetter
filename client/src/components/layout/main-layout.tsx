import { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import Sidebar from "./sidebar";
import MobileNav from "./mobile-nav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isMobile && <Sidebar user={user} />}
      
      <div className="flex-1">
        {isMobile && <MobileNav user={user} />}
        
        <main className="p-4 md:p-6 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}