import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "levletter-development-secret";

/**
 * パスワードリセット用のトークンを生成する
 * @param userId ユーザーID
 * @param email ユーザーのメールアドレス
 * @returns JWT形式のトークン
 */
export function generatePasswordResetToken(userId: number, email: string): string {
  // 24時間有効なトークン
  return jwt.sign(
    { userId, email, type: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * パスワードリセットトークンを検証する
 * @param token JWTトークン
 * @returns 検証結果とペイロード
 */
export function verifyPasswordResetToken(token: string): { 
  valid: boolean; 
  userId?: number; 
  email?: string;
  error?: string;
} {
  console.log("トークン検証開始:", token.substring(0, 20) + "...");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'password-reset') {
      return { valid: false, error: '無効なトークンです' };
    }
    
    return { 
      valid: true, 
      userId: decoded.userId, 
      email: decoded.email 
    };
  } catch (error) {
    console.error('トークン検証エラー:', error);
    return { 
      valid: false, 
      error: 'トークンの有効期限が切れているか、無効です' 
    };
  }
}

/**
 * ランダムなパスワードを生成する
 * @param length パスワードの長さ
 * @returns ランダムパスワード
 */
export function generateRandomPassword(length: number = 10): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}