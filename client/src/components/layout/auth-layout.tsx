import { ReactNode, useState, useEffect } from "react";
import { BearLogo } from "@/components/bear-logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [bearPosition, setBearPosition] = useState({ x: 50, y: 50 });
  const [bearDirection, setBearDirection] = useState({ x: 2, y: 1.5 });
  
  // ゲーム状態
  const [isGameActive, setIsGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [bearSpeed, setBearSpeed] = useState(2);
  const [gameStarted, setGameStarted] = useState(false);

  // ゲームタイマー
  useEffect(() => {
    if (!isGameActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, timeLeft]);

  // クマアニメーション（スクリーンセーバー & ゲーム）
  useEffect(() => {
    if (!isScreensaverActive) return;

    const interval = setInterval(() => {
      setBearPosition(prev => {
        let newX = prev.x + bearDirection.x * bearSpeed;
        let newY = prev.y + bearDirection.y * bearSpeed;
        let newDirectionX = bearDirection.x;
        let newDirectionY = bearDirection.y;

        // 画面端での反射
        if (newX <= 5 || newX >= 95) {
          newDirectionX = -newDirectionX;
          newX = Math.max(5, Math.min(95, newX));
        }
        if (newY <= 5 || newY >= 95) {
          newDirectionY = -newDirectionY;
          newY = Math.max(5, Math.min(95, newY));
        }

        setBearDirection({ x: newDirectionX, y: newDirectionY });
        return { x: newX, y: newY };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isScreensaverActive, bearDirection, bearSpeed]);

  // ESCキーでスクリーンセーバー終了
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isScreensaverActive) {
        console.log("📱 スクリーンセーバー終了 - ESC");
        setIsScreensaverActive(false);
      }
    };

    if (isScreensaverActive) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isScreensaverActive]);

  // ゲーム開始
  const startGame = () => {
    console.log("🎮 ゲーム開始！");
    setIsScreensaverActive(true);
    setIsGameActive(true);
    setGameStarted(true);
    setScore(0);
    setTimeLeft(30);
    setBearSpeed(2);
    setBearPosition({ 
      x: 20 + Math.random() * 60, 
      y: 20 + Math.random() * 60 
    });
    setBearDirection({ 
      x: (Math.random() - 0.5) * 4, 
      y: (Math.random() - 0.5) * 4 
    });
  };

  // クマをキャッチ
  const catchBear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGameActive) return;
    
    console.log("🎯 クマキャッチ！");
    setScore(prev => prev + 1);
    
    // 速度アップ（最大5まで）
    setBearSpeed(prev => Math.min(5, prev + 0.2));
    
    // 新しい位置にクマを移動
    setBearPosition({
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80
    });
    setBearDirection({
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 6
    });
  };

  // スクリーンセーバー開始（従来の機能）
  const handleBearClick = () => {
    console.log("🐻 クマがクリックされました！");
    setIsScreensaverActive(true);
    setBearPosition({ x: 50, y: 50 });
    setBearDirection({ x: 2 + Math.random() * 2, y: 1.5 + Math.random() * 2 });
    console.log("🖥️ スクリーンセーバー開始:", { active: true, position: { x: 50, y: 50 } });
  };

  // ゲーム終了
  const endGame = () => {
    setIsGameActive(false);
    setGameStarted(false);
    console.log("🏁 ゲーム終了！スコア:", score);
  };

  return (
    <>
      {/* スクリーンセーバーオーバーレイ */}
      {isScreensaverActive && (
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            userSelect: 'none',
            cursor: 'pointer'
          }}
          onClick={() => {
            if (isGameActive) return; // ゲーム中はクリックで終了しない
            console.log("📱 スクリーンセーバー終了 - クリック");
            setIsScreensaverActive(false);
            endGame();
          }}
        >
          {/* ゲーム開始前の画面 */}
          {!gameStarted && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'white'
            }}>
              <BearLogo size={100} useTransparent={true} bgColor="bg-white" />
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', margin: '20px 0' }}>
                クマキャッチゲーム！
              </h2>
              <p style={{ fontSize: '18px', marginBottom: '30px', opacity: 0.9 }}>
                動き回るクマをクリックして捕まえよう！<br />
                30秒でどれだけ捕まえられるかな？
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                style={{
                  backgroundColor: '#3990EA',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  fontSize: '20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ゲーム開始！
              </button>
            </div>
          )}

          {/* ゲーム中の画面 */}
          {gameStarted && (
            <>
              {/* クマ */}
              <div
                onClick={catchBear}
                style={{
                  position: 'absolute',
                  left: `${bearPosition.x}%`,
                  top: `${bearPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 10001
                }}
              >
                <BearLogo size={60} useTransparent={true} bgColor="bg-white" />
              </div>

              {/* ゲームUI */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                スコア: {score}
              </div>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold'
              }}>
                残り時間: {timeLeft}秒
              </div>
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontSize: '16px',
                opacity: 0.8
              }}>
                クマをクリックして捕まえよう！
              </div>
            </>
          )}

          {/* ゲーム終了画面 */}
          {gameStarted && !isGameActive && timeLeft === 0 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: '40px',
              borderRadius: '20px'
            }}>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 20px 0' }}>
                ゲーム終了！
              </h2>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3990EA', margin: '10px 0' }}>
                スコア: {score}匹
              </p>
              <p style={{ fontSize: '16px', opacity: 0.9, margin: '20px 0' }}>
                {score >= 15 ? "素晴らしい！クマキャッチマスター！" :
                 score >= 10 ? "上手！なかなかの腕前です！" :
                 score >= 5 ? "良い調子！もう少し頑張れます！" :
                 "練習あるのみ！再挑戦してみましょう！"}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  style={{
                    backgroundColor: '#3990EA',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  もう一度
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsScreensaverActive(false);
                    endGame();
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    border: '1px solid white',
                    padding: '12px 24px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  終了
                </button>
              </div>
            </div>
          )}

          {/* スクリーンセーバーモード（ゲーム機能なし） */}
          {!gameStarted && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: `${bearPosition.x}%`,
                  top: `${bearPosition.y}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              >
                <BearLogo size={80} useTransparent={true} bgColor="bg-white" />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                ESCキーまたはクリックで終了
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="min-h-screen flex flex-col md:flex-row relative">
        {/* ブランドエリア */}
        <div className="bg-primary md:w-1/2 p-8 flex flex-col justify-center items-center">
          <div className="max-w-md mx-auto text-center">
            <div className="flex flex-col items-center gap-4 mb-8">
              <div 
                onClick={handleBearClick}
                className="cursor-pointer hover:scale-110 transition-all duration-300 hover:rotate-12"
                title="クリックでクマキャッチゲーム開始！"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                  animation: 'bounce 2s infinite'
                }}
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
    </>
  );
}