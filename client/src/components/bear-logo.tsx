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
  // 白い円形背景にクマアイコンを表示
  return (
    <div 
      className="bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200"
      style={{ width: size, height: size }}
    >
      <img 
        src={whiteBearIcon} 
        alt="LevLetter Bear Logo" 
        width={size * 0.7} 
        height={size * 0.7}
        className="object-contain"
      />
    </div>
  );
}