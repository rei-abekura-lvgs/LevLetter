import { Request, Response, NextFunction } from "express";
import { storage, hashPassword } from "./storage";
import { User } from "@shared/schema";

// シンプルな認証システム - セッション管理
export class SimpleAuth {
  // ログイン処理（開発用：パスワードをプレーンテキストで比較）
  static async login(email: string, password: string): Promise<User | null> {
    try {
      console.log(`🔐 SimpleAuth.login開始 - メール: ${email}`);
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        console.log(`❌ ユーザーまたはパスワードが見つかりません: ${email}`);
        return null;
      }

      console.log(`📝 入力パスワード: "${password}"`);
      console.log(`💾 DB保存パスワード: "${user.password}"`);

      // 開発中：プレーンテキストで比較
      const isMatch = user.password === password;
      console.log(`🔑 パスワード比較結果: ${isMatch ? '成功' : '失敗'}`);
      
      if (isMatch) {
        return user;
      }
      
      return null;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }

  // 新規登録処理
  static async register(email: string, password: string): Promise<User | null> {
    try {
      const existingUser = await storage.getUserByEmail(email);
      if (!existingUser) {
        return null; // 事前登録されていない
      }
      
      if (existingUser.password) {
        return null; // 既に登録済み
      }

      // 開発中：パスワードをプレーンテキストで保存
      const updatedUser = await storage.updateUser(existingUser.id, {
        password: password,
        passwordInitialized: true,
      });

      return updatedUser;
    } catch (error) {
      console.error("Register error:", error);
      return null;
    }
  }

  // セッション設定
  static setSession(req: Request, userId: number): void {
    (req.session as any).userId = userId;
  }

  // セッション取得
  static getSession(req: Request): number | null {
    return (req.session as any).userId || null;
  }

  // セッション削除
  static clearSession(req: Request): void {
    (req.session as any).userId = null;
  }

  // 認証ミドルウェア
  static authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const userId = SimpleAuth.getSession(req);
    
    if (!userId) {
      return res.status(401).json({ message: "認証が必要です" });
    }

    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        SimpleAuth.clearSession(req);
        return res.status(401).json({ message: "ユーザーが見つかりません" });
      }

      (req as any).user = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({ message: "認証エラー" });
    }
  };

  // パスワードを除いたユーザー情報を返す
  static sanitizeUser(user: User) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}