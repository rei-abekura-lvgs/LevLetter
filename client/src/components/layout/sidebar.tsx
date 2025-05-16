import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { logout } from "@/lib/auth";

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow bg-white shadow-lg overflow-y-auto">
        {/* ロゴとナビゲーション */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">LevLetter</h1>
        </div>
        
        {/* メニュー項目 */}
        <div className="flex-grow flex flex-col mt-5">
          <nav className="flex-1 px-2 space-y-1">
            <Link href="/">
              <a className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === "/" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"} group`}>
                <i className="ri-home-line text-xl mr-3"></i>
                <span>タイムライン</span>
              </a>
            </Link>
            <Link href="/my-cards">
              <a className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === "/my-cards" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"} group`}>
                <i className="ri-mail-line text-xl mr-3"></i>
                <span>マイカード</span>
              </a>
            </Link>
            <Link href="/profile">
              <a className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === "/profile" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"} group`}>
                <i className="ri-user-line text-xl mr-3"></i>
                <span>プロフィール</span>
              </a>
            </Link>
          </nav>
        </div>
        
        {/* ユーザーインフォ */}
        {user && (
          <div className="flex items-center px-4 py-4 border-t border-gray-200">
            <div className="flex-shrink-0">
              <div className={`h-10 w-10 rounded-full bg-${user.avatarColor} flex items-center justify-center text-white font-medium`}>
                {user.name.split(/\s+/).map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('')}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user.displayName || user.name}</p>
              <div className="flex items-center text-xs text-gray-500">
                <i className="ri-coin-line mr-1"></i>
                <span>残り：{user.weeklyPoints}/500</span>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="ml-auto flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-500"
            >
              <i className="ri-logout-box-r-line"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
