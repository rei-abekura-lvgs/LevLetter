import { ReactNode, useState, useEffect } from "react";
import { BearLogo } from "@/components/bear-logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const [bearPosition, setBearPosition] = useState({ x: 50, y: 50 });
  const [bearDirection, setBearDirection] = useState({ x: 2, y: 1.5 });
  
  // ゲーム状態（育成ゲーム）
  const [isGameActive, setIsGameActive] = useState(false);
  const [totalClicks, setTotalClicks] = useState(0);
  const [bearLevel, setBearLevel] = useState(1);
  const [bearExp, setBearExp] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [bearSpeed] = useState(1.5);
  const [bears, setBears] = useState([
    { id: 1, x: 50, y: 50, directionX: 1, directionY: 1, level: 1, color: 'white' }
  ]);

  // レベルアップ計算
  const getExpForNextLevel = (level: number) => level * 10;
  const getBearColorByLevel = (level: number) => {
    if (level >= 10) return 'rainbow';
    if (level >= 7) return 'gold';
    if (level >= 5) return 'purple';
    if (level >= 3) return 'blue';
    return 'white';
  };
  
  // レベルアップチェック
  useEffect(() => {
    const expNeeded = getExpForNextLevel(bearLevel);
    if (bearExp >= expNeeded) {
      setBearLevel(prev => prev + 1);
      setBearExp(0);
      console.log("🎉 レベルアップ！レベル", bearLevel + 1);
      
      // レベルアップ時に新しいクマを追加
      if (bears.length < 10) {
        const newBearColor = getBearColorByLevel(bearLevel + 1);
        setBears(prev => [...prev, {
          id: Math.max(...prev.map(b => b.id)) + 1,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          directionX: (Math.random() - 0.5) * 2,
          directionY: (Math.random() - 0.5) * 2,
          level: bearLevel + 1,
          color: newBearColor
        }]);
      }
    }
  }, [bearExp, bearLevel, bears.length]);

  // クマアニメーション（複数クマ対応）
  useEffect(() => {
    if (!isScreensaverActive) return;

    const interval = setInterval(() => {
      if (gameStarted && isGameActive) {
        // ゲーム中：複数のクマを動かす
        setBears(prevBears => 
          prevBears.map(bear => {
            let newX = bear.x + bear.directionX * bearSpeed;
            let newY = bear.y + bear.directionY * bearSpeed;
            let newDirectionX = bear.directionX;
            let newDirectionY = bear.directionY;

            // 画面端での反射
            if (newX <= 5 || newX >= 95) {
              newDirectionX = -newDirectionX;
              newX = Math.max(5, Math.min(95, newX));
            }
            if (newY <= 5 || newY >= 95) {
              newDirectionY = -newDirectionY;
              newY = Math.max(5, Math.min(95, newY));
            }

            return {
              ...bear,
              x: newX,
              y: newY,
              directionX: newDirectionX,
              directionY: newDirectionY
            };
          })
        );
      } else {
        // スクリーンセーバー：単体クマ
        setBearPosition(prev => {
          let newX = prev.x + bearDirection.x * bearSpeed;
          let newY = prev.y + bearDirection.y * bearSpeed;
          let newDirectionX = bearDirection.x;
          let newDirectionY = bearDirection.y;

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
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isScreensaverActive, bearDirection, bearSpeed, gameStarted, isGameActive]);

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

  // 育成ゲーム開始
  const startGame = () => {
    console.log("🎮 育成ゲーム開始！");
    setIsScreensaverActive(true);
    setIsGameActive(true);
    setGameStarted(true);
    setTotalClicks(0);
    setBearLevel(1);
    setBearExp(0);
    
    // 初期クマ1匹
    setBears([{
      id: 1,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      directionX: (Math.random() - 0.5) * 2,
      directionY: (Math.random() - 0.5) * 2,
      level: 1,
      color: 'white'
    }]);
  };

  // クマをクリック（育成）
  const clickBear = (bearId: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isGameActive) return;
    
    console.log("🐻 クマクリック！ID:", bearId, "経験値+1");
    
    // 総クリック数とレベル経験値を増加
    setTotalClicks(prev => prev + 1);
    setBearExp(prev => prev + 1);
    
    // クリックエフェクト（クマを少し揺らす）
    setBears(prevBears => 
      prevBears.map(bear => 
        bear.id === bearId 
          ? {
              ...bear,
              x: Math.max(10, Math.min(90, bear.x + (Math.random() - 0.5) * 10)),
              y: Math.max(10, Math.min(90, bear.y + (Math.random() - 0.5) * 10))
            }
          : bear
      )
    );
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
              {/* 複数のクマ */}
              {bears.map(bear => (
                <div
                  key={bear.id}
                  onClick={catchBear(bear.id)}
                  style={{
                    position: 'absolute',
                    left: `${bear.x}%`,
                    top: `${bear.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    zIndex: 10001,
                    transition: 'none'
                  }}
                >
                  <BearLogo size={50} useTransparent={true} bgColor="bg-white" />
                </div>
              ))}

              {/* ゲームUI */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                スコア: {score} | クマ: {bears.length}匹
              </div>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '10px',
                borderRadius: '8px'
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
                opacity: 0.9,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '8px 16px',
                borderRadius: '20px'
              }}>
                クマをクリックすると新しいクマが現れる！
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