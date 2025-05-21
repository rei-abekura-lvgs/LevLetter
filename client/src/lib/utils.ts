// utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 名前からイニシャルを取得する
 * @param name 名前
 * @returns イニシャル（1-2文字）
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  // 空白で分割して最初の2つの単語を取得
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // 1単語の場合は最初の1文字を返す
    return parts[0].charAt(0);
  } else {
    // 複数単語の場合は最初の2単語の最初の文字を連結
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
}