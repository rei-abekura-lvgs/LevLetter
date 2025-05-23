import bearImage from "@assets/ChatGPT Image 2025年5月22日 18_56_53.png";
import bearTransparentImage from "@assets/ChatGPT Image 2025年5月22日 20_25_45.png";
import bearDefaultIcon from "@assets/ChatGPT Image 2025年5月23日 12_20_03.png";

// LevLetter可愛いクマのロゴコンポーネント
export function BearLogo({ 
  size = 48, 
  useTransparent = false, 
  useDefaultIcon = false,
  bgColor = "bg-[#3990EA]" 
}: { 
  size?: number; 
  useTransparent?: boolean; 
  useDefaultIcon?: boolean;
  bgColor?: string; 
}) {

  
  // 新しいデフォルトアイコンを使用
  if (useDefaultIcon) {
    return (
      <img 
        src={bearDefaultIcon} 
        alt="LevLetter Bear Logo" 
        width={size} 
        height={size}
        className="object-contain rounded-full"
        onError={(e) => console.error("Bear default icon failed to load:", e)}
        onLoad={() => console.log("Bear default icon loaded successfully")}
      />
    );
  }

  if (useTransparent) {
    return (
      <div 
        className={`rounded-full ${bgColor} flex items-center justify-center p-1`}
        style={{ width: size, height: size }}
      >
        <img 
          src={bearTransparentImage} 
          alt="LevLetter Bear Logo" 
          width={size - 8} 
          height={size - 8}
          className="object-contain"
        />
      </div>
    );
  }

  return (
    <img 
      src={bearImage} 
      alt="LevLetter Bear Logo" 
      width={size} 
      height={size}
      className="object-contain drop-shadow-sm"
    />
  );
}