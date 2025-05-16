import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 初期状態を設定
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // コンポーネントマウント時に実行
    checkIsMobile();
    
    // リサイズイベントに対応
    window.addEventListener("resize", checkIsMobile);
    
    // クリーンアップ
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return isMobile;
}