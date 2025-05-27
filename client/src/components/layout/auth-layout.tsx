import { ReactNode, useEffect, useState } from 'react';
import { BearLogo } from '../bear-logo';
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [bearPosition, setBearPosition] = useState({ x: 50, y: 50 });
  const [bearDirection, setBearDirection] = useState({ x: 2, y: 1.5 });

  // スクリーンセーバーのアニメーション - ゆっくり安定版
  useEffect(() => {
    let animationFrame: number;
    let lastTime = 0;
    
    if (isScreensaverActive) {
      const animate = (currentTime: number) => {
        // 60fpsに制限してゆっくりに
        if (currentTime - lastTime > 80) { // 80ms間隔でゆっくり
          setBearPosition(prevPosition => {
            let newX = prevPosition.x + bearDirection.x * 0.3; // 速度を0.3倍に
            let newY = prevPosition.y + bearDirection.y * 0.3;

            // 壁に衝突した時の反射処理
            if (newX <= 2 || newX >= 95) {
              setBearDirection(prev => ({ x: -prev.x, y: prev.y }));
              newX = Math.max(2, Math.min(95, newX));
            }
            if (newY <= 2 || newY >= 95) {
              setBearDirection(prev => ({ x: prev.x, y: -prev.y }));
              newY = Math.max(2, Math.min(95, newY));
            }

            return { x: newX, y: newY };
          });
          lastTime = currentTime;
        }
        
        animationFrame = requestAnimationFrame(animate);
      };
      
      animationFrame = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isScreensaverActive]);

  // アクティビティ監視とスクリーンセーバー自動起動
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      setIsScreensaverActive(false);
      clearTimeout(inactivityTimer);
      
      // 8秒後にスクリーンセーバーを起動
      inactivityTimer = setTimeout(() => {
        setIsScreensaverActive(true);
      }, 8000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // イベントリスナー追加
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // 初期タイマー開始
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      {/* スクリーンセーバー */}
      {isScreensaverActive && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${bearPosition.x}%`,
            top: `${bearPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'none'
          }}
        >
          <div className="animate-bounce">
            <BearLogo size={80} />
          </div>
        </div>
      )}

      {/* ロゴとナビゲーション */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/landing">
          <div className="flex items-center space-x-3 cursor-pointer group">
            <BearLogo size={40} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                LevLetter
              </h1>
            </div>
          </div>
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <Link href="/landing">
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>ホームに戻る</span>
          </button>
        </Link>
      </div>

      {/* メインコンテンツ */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}