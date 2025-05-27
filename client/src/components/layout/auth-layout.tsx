import { ReactNode, useEffect, useState } from 'react';
import { BearLogo } from '../bear-logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [bearPosition, setBearPosition] = useState({ x: 50, y: 50 });
  const [bearDirection, setBearDirection] = useState({ x: 2, y: 1.5 });

  // スクリーンセーバーのアニメーション
  useEffect(() => {
    let animationFrame: number;
    
    if (isScreensaverActive) {
      const animate = () => {
        setBearPosition(prevPosition => {
          let newX = prevPosition.x + bearDirection.x;
          let newY = prevPosition.y + bearDirection.y;
          let newDirectionX = bearDirection.x;
          let newDirectionY = bearDirection.y;

          if (newX <= 5 || newX >= 90) {
            newDirectionX = -newDirectionX;
            newX = Math.max(5, Math.min(90, newX));
          }
          if (newY <= 5 || newY >= 90) {
            newDirectionY = -newDirectionY;
            newY = Math.max(5, Math.min(90, newY));
          }

          setBearDirection({ x: newDirectionX, y: newDirectionY });
          return { x: newX, y: newY };
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isScreensaverActive]);

  // キーボードイベント
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScreensaverActive) {
        setIsScreensaverActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScreensaverActive]);

  const handleBearClick = () => {
    setIsScreensaverActive(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3990EA] to-[#2563EB] flex">
      {/* 左側 - LP風の特徴紹介 */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 text-white">
        <div className="max-w-md space-y-8">
          {/* ロゴとタイトル */}
          <div className="text-center">
            <div 
              onClick={handleBearClick}
              className="inline-block cursor-pointer hover:scale-110 transition-transform duration-200 mb-6"
            >
              <BearLogo size={120} useTransparent={true} bgColor="bg-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">LevLetter</h1>
            <p className="text-xl opacity-90">企業の感謝文化を育む</p>
          </div>

          {/* 特徴セクション */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">特徴</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg">簡単に感謝の気持ちを伝えられる</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg">ポイント付与でモチベーションアップ</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg">チーム単位での感謝カード送信</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg">社内コミュニケーションの活性化</p>
              </div>
            </div>
          </div>

          {/* 導入実績 */}
          <div className="text-center">
            <p className="text-lg opacity-80">多くの企業で導入実績あり</p>
            <p className="text-sm opacity-60 mt-2">感謝の文化で職場を変革</p>
          </div>
        </div>
      </div>

      {/* 右側 - ログインエリア */}
      <div className="w-full max-w-md bg-white flex flex-col justify-center">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">ログイン</h2>
            <p className="text-gray-600">アカウントにアクセス</p>
          </div>
          {children}
        </div>
      </div>

      {/* スクリーンセーバーオーバーレイ */}
      {isScreensaverActive && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10001,
            cursor: 'pointer'
          }}
          onClick={() => setIsScreensaverActive(false)}
        >
          <div
            style={{
              position: 'absolute',
              left: `${bearPosition.x}%`,
              top: `${bearPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: 'none',
              pointerEvents: 'none'
            }}
          >
            <BearLogo size={60} useTransparent={true} bgColor="bg-white" />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '50px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '16px',
            opacity: 0.7,
            textAlign: 'center'
          }}>
            ESCキーまたはクリックで終了
          </div>
        </div>
      )}
    </div>
  );
}