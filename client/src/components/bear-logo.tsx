import { useState, useEffect } from 'react';
import whiteBearIcon from "@assets/ChatGPT Image 2025年5月22日 20_52_25.png";

interface Bear {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
}

// LevLetter可愛いクマのロゴコンポーネント
export function BearLogo({ 
  size = 48, 
  useTransparent = false, 
  useNewIcon = false,
  bgColor = "bg-white" 
}: { 
  size?: number; 
  useTransparent?: boolean; 
  useNewIcon?: boolean;
  bgColor?: string; 
}) {
  const [bears, setBears] = useState<Bear[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [bearCount, setBearCount] = useState(0);

  const createRandomBear = (id: number): Bear => ({
    id,
    x: Math.random() * (window.innerWidth - 80),
    y: Math.random() * (window.innerHeight - 80),
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    size: 60 + Math.random() * 40,
    rotation: Math.random() * 360
  });

  const handleBearClick = () => {
    const newBear = createRandomBear(bearCount);
    setBears(prev => [...prev, newBear]);
    setBearCount(prev => prev + 1);
    setIsAnimating(true);
  };

  // クマ同士の衝突検知と反発
  const checkCollisions = (bears: Bear[]): Bear[] => {
    const updatedBears = [...bears];
    
    for (let i = 0; i < updatedBears.length; i++) {
      for (let j = i + 1; j < updatedBears.length; j++) {
        const bear1 = updatedBears[i];
        const bear2 = updatedBears[j];
        
        const dx = bear2.x - bear1.x;
        const dy = bear2.y - bear1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (bear1.size + bear2.size) / 3;
        
        if (distance < minDistance && distance > 0) {
          // 衝突時の反発
          const angle = Math.atan2(dy, dx);
          const force = (minDistance - distance) * 0.1;
          
          updatedBears[i].vx -= Math.cos(angle) * force;
          updatedBears[i].vy -= Math.sin(angle) * force;
          updatedBears[j].vx += Math.cos(angle) * force;
          updatedBears[j].vy += Math.sin(angle) * force;
        }
      }
    }
    
    return updatedBears;
  };

  // クマのアニメーション
  useEffect(() => {
    if (!isAnimating || bears.length === 0) return;

    const animate = () => {
      setBears(currentBears => {
        let updatedBears = currentBears.map(bear => {
          let newX = bear.x + bear.vx;
          let newY = bear.y + bear.vy;
          let newVx = bear.vx;
          let newVy = bear.vy;

          // 壁との衝突
          if (newX <= 0 || newX >= window.innerWidth - bear.size) {
            newVx = -newVx * 0.9; // 減衰
            newX = Math.max(0, Math.min(window.innerWidth - bear.size, newX));
          }
          if (newY <= 0 || newY >= window.innerHeight - bear.size) {
            newVy = -newVy * 0.9; // 減衰
            newY = Math.max(0, Math.min(window.innerHeight - bear.size, newY));
          }

          return {
            ...bear,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: bear.rotation + (newVx + newVy) * 2
          };
        });

        // クマ同士の衝突チェック
        updatedBears = checkCollisions(updatedBears);
        
        return updatedBears;
      });
    };

    const interval = setInterval(animate, 60);
    return () => clearInterval(interval);
  }, [isAnimating, bears.length]);

  return (
    <>
      {/* 通常のクマロゴ */}
      <div 
        className="bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 hover:scale-125 hover:rotate-12 hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer"
        style={{ width: size, height: size }}
        onClick={handleBearClick}
        title="クリックでクマを増やす！"
      >
        <img 
          src={whiteBearIcon} 
          alt="LevLetter Bear Logo" 
          width={size * 0.7} 
          height={size * 0.7}
          className="object-contain transition-transform duration-300"
        />
      </div>
      
      {/* アニメーションするクマたち */}
      {isAnimating && bears.length > 0 && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {bears.map(bear => (
            <div
              key={bear.id}
              className="absolute transition-all duration-[60ms] ease-linear"
              style={{
                left: `${bear.x}px`,
                top: `${bear.y}px`,
                transform: `rotate(${bear.rotation}deg)`,
                width: `${bear.size}px`,
                height: `${bear.size}px`
              }}
            >
              <div className="w-full h-full bg-white rounded-full shadow-lg border-2 border-blue-200 flex items-center justify-center">
                <img 
                  src={whiteBearIcon} 
                  alt="Dancing Bear" 
                  className="object-contain w-3/4 h-3/4"
                />
              </div>
            </div>
          ))}
          
          {/* クリアボタン */}
          <div className="absolute top-4 right-4 pointer-events-auto">
            <button
              onClick={() => {
                setBears([]);
                setIsAnimating(false);
                setBearCount(0);
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              🐻 クマをクリア ({bears.length}匹)
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// スクリーンセーバー用のクマコンポーネント
export function ScreensaverBear() {
  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-[3000ms] ease-linear"
      style={{
        animationName: 'float-around',
        animationDuration: '20s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear'
      }}
    >
      <div 
        className="bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-blue-200 animate-bounce"
        style={{ width: 80, height: 80 }}
      >
        <img 
          src={whiteBearIcon} 
          alt="Floating Bear" 
          width={56} 
          height={56}
          className="object-contain animate-pulse"
        />
      </div>
    </div>
  );
}