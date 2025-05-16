import { Link, useLocation } from "wouter";
import { useState } from "react";
import { User } from "@shared/schema";

interface MobileNavProps {
  user: User | null;
}

export default function MobileNav({ user }: MobileNavProps) {
  const [location] = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* モバイル用ヘッダー */}
      <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white md:hidden">
        <h1 className="text-lg font-bold text-primary-600">LevLetter</h1>
        
        <div className="flex items-center">
          <button 
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            onClick={() => setShowMenu(!showMenu)}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
        </div>
      </div>

      {/* モバイルメニュー（開閉式） */}
      {showMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black opacity-25"
            onClick={() => setShowMenu(false)}
          ></div>
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">メニュー</h2>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowMenu(false)}
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <nav className="px-2 pt-4 pb-3 space-y-1">
              <Link href="/">
                <a 
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === "/" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"} group`}
                  onClick={() => setShowMenu(false)}
                >
                  <i className="ri-home-line text-xl mr-3"></i>
                  <span>タイムライン</span>
                </a>
              </Link>
              <Link href="/my-cards">
                <a 
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === "/my-cards" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"} group`}
                  onClick={() => setShowMenu(false)}
                >
                  <i className="ri-mail-line text-xl mr-3"></i>
                  <span>マイカード</span>
                </a>
              </Link>
              <Link href="/profile">
                <a 
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${location === "/profile" ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"} group`}
                  onClick={() => setShowMenu(false)}
                >
                  <i className="ri-user-line text-xl mr-3"></i>
                  <span>プロフィール</span>
                </a>
              </Link>
            </nav>
            {user && (
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center">
                  <div className={`h-10 w-10 rounded-full bg-${user.avatarColor} flex items-center justify-center text-white font-medium`}>
                    {user.name.split(/\s+/).map(part => part.charAt(0).toUpperCase()).slice(0, 2).join('')}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{user.displayName || user.name}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <i className="ri-coin-line mr-1"></i>
                      <span>残り：{user.weeklyPoints}/500</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* モバイル用フッターナビゲーション */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around items-center h-16">
          <Link href="/">
            <a className={`flex flex-col items-center justify-center w-full h-full ${location === "/" ? "text-primary-600" : "text-gray-500"}`}>
              <i className="ri-home-line text-xl"></i>
              <span className="text-xs mt-1">ホーム</span>
            </a>
          </Link>
          <Link href="/my-cards">
            <a className={`flex flex-col items-center justify-center w-full h-full ${location === "/my-cards" ? "text-primary-600" : "text-gray-500"}`}>
              <i className="ri-mail-line text-xl"></i>
              <span className="text-xs mt-1">マイカード</span>
            </a>
          </Link>
          <Link href="/profile">
            <a className={`flex flex-col items-center justify-center w-full h-full ${location === "/profile" ? "text-primary-600" : "text-gray-500"}`}>
              <i className="ri-user-line text-xl"></i>
              <span className="text-xs mt-1">プロフィール</span>
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}
