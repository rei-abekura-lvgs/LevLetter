import { useState } from "react";
import { User } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Home, Send, User as UserIcon, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";

interface MobileNavProps {
  user: User | null;
}

export default function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <a
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
          onClick={() => setIsOpen(false)}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </a>
      </Link>
    );
  };

  return (
    <>

      {isOpen && (
        <div className="fixed inset-0 bg-background z-50 pt-16">
          <div className="p-4 space-y-2">
            <NavItem href="/" icon={Home} label="ホーム" />
            <NavItem href="/my-cards" icon={Send} label="マイカード" />
            <NavItem href="/profile" icon={UserIcon} label="プロフィール" />
            
            <div className="border-t my-4 pt-4">
              {user && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    {user.customAvatarUrl ? (
                      <img 
                        src={user.customAvatarUrl} 
                        alt={user.name}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className={`h-10 w-10 rounded-full bg-${user.avatarColor || "primary"} flex items-center justify-center text-primary-foreground`}>
                        {user.displayName?.[0] || user.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{user.displayName || user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-md text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}