import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UnifiedAvatarProps {
  user: {
    customAvatarUrl?: string | null;
    avatarColor?: string;
    name: string;
    displayName?: string | null;
  };
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function UnifiedAvatar({ user, size = "md", className = "" }: UnifiedAvatarProps) {
  const bearAvatarUrl = "/bear_icon.png";
  
  // サイズ設定
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base", 
    xl: "text-lg"
  };

  // ユーザー名のイニシャル取得
  const getUserInitial = () => {
    const name = user.displayName || user.name;
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className} group relative`}>
      {/* Google認証またはカスタムアバターがある場合 */}
      {user.customAvatarUrl ? (
        <AvatarImage 
          src={user.customAvatarUrl} 
          alt={user.displayName || user.name}
          className="object-cover"
        />
      ) : null}
      
      <AvatarFallback className="bg-transparent border-none p-0 overflow-hidden">
        {/* デフォルト：クマアイコン */}
        <img 
          src={bearAvatarUrl} 
          alt="アバター" 
          className="w-full h-full object-contain"
        />
        
        {/* ホバー時に名前イニシャルをオーバーレイ表示 */}
        <div 
          className={`absolute inset-0 bg-gray-800 bg-opacity-75 text-white flex items-center justify-center font-bold ${textSizeClasses[size]} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        >
          {getUserInitial()}
        </div>
      </AvatarFallback>
    </Avatar>
  );
}