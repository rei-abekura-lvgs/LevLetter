import { Request, Response } from "express";
import { storage, hashPassword } from "./storage";
import { User } from "@shared/schema";

// 認証ログ関数
export function logAuth(message: string, data?: any) {
  console.log(`🔐 ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

// セッション情報をログ出力
export function logSession(req: Request, action: string) {
  logAuth(`${action} - セッションID: ${req.sessionID}`);
  logAuth(`セッション内容`, req.session);
}

// セッションにユーザーを設定
export function setUserSession(req: Request, userId: number) {
  logSession(req, "セッション保存前");
  (req.session as any).userId = userId;
  logAuth(`セッションにユーザーID設定: ${userId}`);
  logSession(req, "セッション保存後");
}

// セッションからユーザーIDを取得
export function getUserIdFromSession(req: Request): number | null {
  const userId = (req.session as any).userId;
  logAuth(`セッションから取得したユーザーID: ${userId}`);
  return userId || null;
}

// パスワード検証
export async function verifyPassword(email: string, password: string): Promise<User | null> {
  logAuth(`認証試行開始 - メール: ${email}`);
  
  try {
    const user = await storage.authenticateUser(email, password);
    if (user) {
      logAuth(`認証成功 - ユーザー: ${user.name} (ID: ${user.id})`);
    } else {
      logAuth(`認証失敗 - メール: ${email}`);
    }
    return user;
  } catch (error) {
    logAuth(`認証エラー - メール: ${email}`, error);
    return null;
  }
}

// ユーザー登録（パスワード設定）
export async function registerUserPassword(email: string, password: string): Promise<User | null> {
  logAuth(`新規登録処理開始 - メール: ${email}`);
  
  // 既存ユーザー確認
  const existingUser = await storage.getUserByEmail(email);
  if (!existingUser) {
    logAuth(`ユーザーが見つかりません: ${email}`);
    return null;
  }
  
  if (existingUser.password) {
    logAuth(`既に登録済み: ${email}`);
    return null;
  }
  
  // パスワードハッシュ化と更新
  const hashedPassword = await hashPassword(password);
  logAuth(`パスワードハッシュ化完了`);
  
  const updatedUser = await storage.updateUser(existingUser.id, {
    password: hashedPassword,
    passwordInitialized: true,
  });
  
  // 検証
  const verifiedUser = await verifyPassword(email, password);
  if (!verifiedUser) {
    logAuth(`パスワード設定後の検証失敗: ${email}`);
    throw new Error("登録処理でエラーが発生しました");
  }
  
  logAuth(`登録完了 - ユーザー: ${updatedUser.name}`);
  return updatedUser;
}

// 認証エラーレスポンス
export function sendAuthError(res: Response, message: string = "認証が必要です") {
  return res.status(401).json({ message });
}

// 成功レスポンス（パスワード除去）
export function sendUserResponse(res: Response, user: User, message: string) {
  const { password, ...userWithoutPassword } = user;
  return res.status(200).json({ message, user: userWithoutPassword });
}