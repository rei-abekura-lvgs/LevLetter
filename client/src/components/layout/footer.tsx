import { Heart, BarChart3, TrendingUp, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Footer() {
  const [location] = useLocation();
  
  const navigationItems = [
    { path: "/", icon: Home, label: "タイムライン" },
    { path: "/dashboard", icon: BarChart3, label: "ダッシュボード" },
    { path: "/ranking", icon: TrendingUp, label: "ランキング" }
  ];

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
        {/* ナビゲーションバー */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-8">
            {navigationItems.map((item) => {
              const isActive = location === item.path;
              const IconComponent = item.icon;
              
              return (
                <Link key={item.path} href={item.path}>
                  <div className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* ロゴ・タイトル部分 */}
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-blue-600" />
            <span className="text-lg font-bold text-gray-800">LevLetter</span>
          </div>
          
          {/* 中央部分 - 説明文 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              社内コミュニケーションを促進するフィードバックカード
            </p>
          </div>
          
          {/* 右側部分 - コピーライト */}
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-500">
              © 2025 LevLetter. All rights reserved.
            </p>
          </div>
        </div>
        
        {/* モバイル時の追加情報 */}
        <div className="mt-4 pt-4 border-t border-gray-100 md:hidden">
          <div className="text-center">
            <p className="text-xs text-gray-400">
              感謝の気持ちを込めて、より良いチームワークを築きましょう
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}