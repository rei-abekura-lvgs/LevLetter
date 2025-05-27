import { ReactNode, useState, useEffect } from "react";
import { BearLogo } from "@/components/bear-logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [bearPosition, setBearPosition] = useState({ x: 50, y: 50 });
  const [bearDirection, setBearDirection] = useState({ x: 2, y: 1.5 });

  // スクリーンセーバーアニメーション
  useEffect(() => {
    if (!isScreensaverActive) return;

    const interval = setInterval(() => {
      setBearPosition(prev => {
        let newX = prev.x + bearDirection.x;
        let newY = prev.y + bearDirection.y;
        let newDirectionX = bearDirection.x;
        let newDirectionY = bearDirection.y;

        // 画面端での反射
        if (newX <= 0 || newX >= 95) {
          newDirectionX = -newDirectionX;
          newX = Math.max(0, Math.min(95, newX));
        }
        if (newY <= 0 || newY >= 95) {
          newDirectionY = -newDirectionY;
          newY = Math.max(0, Math.min(95, newY));
        }

        setBearDirection({ x: newDirectionX, y: newDirectionY });
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isScreensaverActive, bearDirection]);

  // ESCキーでスクリーンセーバー終了
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScreensaverActive) {
        setIsScreensaverActive(false);
      }
    };

    if (isScreensaverActive) {
      document.addEventListener('keydown', handleKeyPress);
      document.addEventListener('click', () => setIsScreensaverActive(false));
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('click', () => setIsScreensaverActive(false));
    };
  }, [isScreensaverActive]);

  const handleBearClick = () => {
    console.log("🐻 クマがクリックされました！");
    setIsScreensaverActive(true);
    setBearPosition({ x: 50, y: 50 });
    setBearDirection({ x: 2 + Math.random() * 2, y: 1.5 + Math.random() * 2 });
    console.log("🖥️ スクリーンセーバー開始:", { active: true, position: { x: 50, y: 50 } });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      {/* スクリーンセーバーオーバーレイ */}
      {isScreensaverActive && (
        <div 
          className="fixed inset-0 bg-black z-[9999] cursor-pointer"
          style={{ 
            userSelect: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)'
          }}
          onClick={() => {
            console.log("📱 スクリーンセーバー終了 - クリック");
            setIsScreensaverActive(false);
          }}
        >
          <div
            className="absolute"
            style={{
              left: `${bearPosition.x}%`,
              top: `${bearPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          >
            <BearLogo size={80} useTransparent={true} bgColor="bg-white" />
          </div>
          <div className="absolute top-4 left-4 text-white text-lg font-medium">
            ESCキーまたはクリックで終了
          </div>
          <div className="absolute top-4 right-4 text-white text-sm opacity-70">
            スクリーンセーバーモード
          </div>
        </div>
      )}

      {/* ブランドエリア */}
      <div className="bg-primary md:w-1/2 p-8 flex flex-col justify-center items-center">
        <div className="max-w-md mx-auto text-center">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div 
              onClick={handleBearClick}
              className="cursor-pointer hover:scale-110 transition-transform duration-200"
              title="クリックでスクリーンセーバー開始！"
            >
              <BearLogo size={60} useTransparent={true} bgColor="bg-white" />
            </div>
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