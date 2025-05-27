import bearImage from "@assets/ChatGPT Image 2025年5月22日 18_56_53.png";
import bearTransparentImage from "@assets/ChatGPT Image 2025年5月22日 20_25_45.png";
import newBearIcon from "@assets/ChatGPT Image 2025年5月23日 12_20_03.png";
import whiteBearIcon from "@assets/ChatGPT Image 2025年5月22日 20_52_25.png";

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
  // 白い円形背景に茶色の線画クマアイコン
  return (
    <div 
      className={`${bgColor} rounded-full flex items-center justify-center shadow-lg border border-gray-100`}
      style={{ width: size, height: size }}
    >
      <svg 
        width={size * 0.6} 
        height={size * 0.6} 
        viewBox="0 0 100 100" 
        className="text-amber-700"
      >
        {/* クマの頭 */}
        <circle cx="50" cy="45" r="25" fill="none" stroke="currentColor" strokeWidth="3"/>
        
        {/* 左耳 */}
        <circle cx="35" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="3"/>
        <circle cx="35" cy="25" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        
        {/* 右耳 */}
        <circle cx="65" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="3"/>
        <circle cx="65" cy="25" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
        
        {/* 目 */}
        <circle cx="42" cy="40" r="2" fill="currentColor"/>
        <circle cx="58" cy="40" r="2" fill="currentColor"/>
        
        {/* 鼻 */}
        <ellipse cx="50" cy="48" rx="2" ry="1.5" fill="currentColor"/>
        
        {/* 口 */}
        <path d="M 45 52 Q 50 56 55 52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        
        {/* 体 */}
        <ellipse cx="50" cy="75" rx="18" ry="15" fill="none" stroke="currentColor" strokeWidth="3"/>
        
        {/* 左腕 */}
        <ellipse cx="30" cy="70" rx="5" ry="12" fill="none" stroke="currentColor" strokeWidth="3"/>
        
        {/* 右腕 */}
        <ellipse cx="70" cy="70" rx="5" ry="12" fill="none" stroke="currentColor" strokeWidth="3"/>
        
        {/* ハートのLL */}
        <path d="M 45 70 C 45 67, 47 65, 50 68 C 53 65, 55 67, 55 70 C 55 73, 50 78, 50 78 C 50 78, 45 73, 45 70 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
        <text x="50" y="73" textAnchor="middle" fontSize="6" fill="currentColor" fontWeight="bold">LL</text>
      </svg>
    </div>
  );
}