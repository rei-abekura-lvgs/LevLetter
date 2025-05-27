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
  }, [isScreensaverActive, bearDirection]);

  // キーボードイベント
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScreensaverActive) {
        console.log('📱 スクリーンセーバー終了 - ESC');
        setIsScreensaverActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isScreensaverActive]);

  const handleBearClick = () => {
    console.log('🐻 クマがクリックされました！');
    setIsScreensaverActive(true);
    console.log('🖥️ スクリーンセーバー開始:', { active: true, position: bearPosition });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 relative">
      {/* メインコンテンツ */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div 
              onClick={handleBearClick}
              className="inline-block cursor-pointer hover:scale-110 transition-transform duration-200"
              style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}
            >
              <BearLogo size={80} useTransparent={true} bgColor="bg-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">LevLetter</h1>
            <p className="text-gray-600 mt-2">感謝の気持ちを伝えよう</p>
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
          {/* 動くクマ */}
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

          {/* 終了メッセージ */}
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