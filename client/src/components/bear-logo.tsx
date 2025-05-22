// LevLetter可愛いクマのロゴコンポーネント
export function BearLogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      {/* クマの耳 */}
      <circle cx="25" cy="25" r="12" fill="#3990EA" stroke="#2563EB" strokeWidth="2"/>
      <circle cx="75" cy="25" r="12" fill="#3990EA" stroke="#2563EB" strokeWidth="2"/>
      <circle cx="25" cy="25" r="6" fill="#60A5FA"/>
      <circle cx="75" cy="25" r="6" fill="#60A5FA"/>
      
      {/* クマの顔 */}
      <circle cx="50" cy="45" r="25" fill="#3990EA" stroke="#2563EB" strokeWidth="2"/>
      
      {/* 目 */}
      <circle cx="42" cy="40" r="3" fill="#1E40AF"/>
      <circle cx="58" cy="40" r="3" fill="#1E40AF"/>
      <circle cx="43" cy="39" r="1" fill="white"/>
      <circle cx="59" cy="39" r="1" fill="white"/>
      
      {/* 鼻 */}
      <ellipse cx="50" cy="48" rx="2.5" ry="2" fill="#1E40AF"/>
      
      {/* 口 */}
      <path d="M 45 52 Q 50 55 55 52" stroke="#1E40AF" strokeWidth="2" fill="none" strokeLinecap="round"/>
      
      {/* クマの体 */}
      <ellipse cx="50" cy="75" rx="18" ry="15" fill="#3990EA" stroke="#2563EB" strokeWidth="2"/>
      
      {/* ハートマーク（LLの文字入り） */}
      <path d="M 45 72 Q 42 69 45 66 Q 50 69 50 72 Q 50 69 55 66 Q 58 69 55 72 Q 50 78 45 72 Z" fill="#EC4899" stroke="#BE185D" strokeWidth="1"/>
      <text x="50" y="73" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">LL</text>
    </svg>
  );
}