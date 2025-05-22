import React from 'react';
import { cn } from '@/lib/utils';
import * as AvatarPrimitive from "@radix-ui/react-avatar";

interface BearAvatarProps {
  userName: string;
  color?: string;
  className?: string;
}

// カスタムアバタールートコンポーネント
const BearAvatarRoot = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
BearAvatarRoot.displayName = "BearAvatarRoot";

// カスタムアバタフォールバックコンポーネント
const BearAvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
));
BearAvatarFallback.displayName = "BearAvatarFallback";

export function BearAvatar({ userName, color, className }: BearAvatarProps) {
  // ユーザー名のイニシャルをフォールバックとして使用
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 背景色の処理（tailwindのクラス名または直接のカラーコード）
  const bgColor = color?.startsWith('#') ? color : (color || "#C6E4D4");

  return (
    <BearAvatarRoot className={cn(className)}>
      <div className="w-full h-full flex items-center justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0"
        >
          {/* 背景色 */}
          <rect width="200" height="200" rx="100" fill={bgColor} />
          
          {/* クマの顔 */}
          <g transform="translate(30, 30) scale(0.7)">
            {/* 顔 */}
            <circle cx="100" cy="90" r="70" fill="white" stroke="#583E23" strokeWidth="8" />
            
            {/* 左耳 */}
            <circle cx="40" cy="40" r="25" fill="white" stroke="#583E23" strokeWidth="8" />
            
            {/* 右耳 */}
            <circle cx="160" cy="40" r="25" fill="white" stroke="#583E23" strokeWidth="8" />
            
            {/* 左目 */}
            <circle cx="70" cy="80" r="8" fill="#583E23" />
            
            {/* 右目 */}
            <circle cx="130" cy="80" r="8" fill="#583E23" />
            
            {/* 鼻 */}
            <ellipse cx="100" cy="100" rx="15" ry="10" fill="#583E23" />
            
            {/* 口 */}
            <path d="M85 115 Q100 125 115 115" stroke="#583E23" strokeWidth="5" strokeLinecap="round" />
          </g>
        </svg>
      </div>
      
      {/* イニシャルのフォールバック（SVGが表示できない場合） */}
      <BearAvatarFallback style={{ backgroundColor: bgColor }}>
        {getInitials(userName)}
      </BearAvatarFallback>
    </BearAvatarRoot>
  );
}