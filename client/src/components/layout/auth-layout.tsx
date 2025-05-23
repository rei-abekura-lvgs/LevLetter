import { ReactNode } from "react";
import { BearLogo } from "@/components/bear-logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ブランドエリア */}
      <div className="bg-primary md:w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <BearLogo size={60} useTransparent={true} bgColor="bg-white" />
            <h1 className="text-4xl font-bold text-white">LevLetter</h1>
          </div>
          <div className="bg-white/10 p-6 rounded-lg">
            <h2 className="text-xl font-medium text-white mb-3">特徴</h2>
            <ul className="text-primary-foreground space-y-2 text-left">
              <li>• 簡単に感謝の気持ちを伝えられる</li>
              <li>• ポイント付与でモチベーションアップ</li>
              <li>• チーム単位での感謝カード送信</li>
              <li>• 社内コミュニケーションの活性化</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* フォームエリア */}
      <div className="md:w-1/2 p-8 flex items-center justify-center bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}