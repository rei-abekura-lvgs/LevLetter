import bearImage from "@assets/ChatGPT Image 2025年5月22日 18_56_53.png";
import bearTransparentImage from "@assets/ChatGPT Image 2025年5月22日 20_25_45.png";
import newBearIcon from "@assets/ChatGPT Image 2025年5月23日 12_20_03.png";
import whiteBearIcon from "@assets/ChatGPT Image 2025年5月22日 20_52_25.png";

// LevLetter可愛いクマのロゴコンポーネント
export function BearLogo({ 
  size = 48, 
  useTransparent = false, 
  useNewIcon = false,
  bgColor = "bg-[#3990EA]" 
}: { 
  size?: number; 
  useTransparent?: boolean; 
  useNewIcon?: boolean;
  bgColor?: string; 
}) {
  // デフォルトで白いクマアイコン（ハートのLL付き）を使用
  return (
    <img 
      src={whiteBearIcon} 
      alt="LevLetter Bear Logo" 
      width={size} 
      height={size}
      className="object-contain drop-shadow-sm"
    />
  );
}