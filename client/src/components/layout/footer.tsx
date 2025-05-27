import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
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