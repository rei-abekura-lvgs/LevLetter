import bearImage from "@assets/ChatGPT Image 2025年5月22日 18_56_53.png";

// LevLetter可愛いクマのロゴコンポーネント
export function BearLogo({ size = 48 }: { size?: number }) {
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