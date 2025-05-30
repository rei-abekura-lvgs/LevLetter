import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";
import bcrypt from "bcrypt";

// bcryptベースのメール・パスワード認証システム
export class SimpleEmailAuth {
  
  // パスワードをbcryptでハッシュ化
  private static async hashPassword(password: string): Promise<string> {
    console.log(`🔐 パスワードハッシュ化開始`);
    const saltRounds = 12; // セキュリティレベル
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log(`🔐 ハッシュ化完了`);
    return hashedPassword;
  }

  // bcryptでパスワード検証
  private static async verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
    console.log(`🔑 パスワード検証開始`);
    try {
      const isMatch = await bcrypt.compare(inputPassword, storedPassword);
      console.log(`🔑 検証結果: ${isMatch ? '成功' : '失敗'}`);
      return isMatch;
    } catch (error) {
      console.error(`🔑 パスワード検証エラー:`, error);
      return false;
    }
  }

  // ユーザー登録
  static async register(email: string, password: string): Promise<User | null> {
    try {
      console.log(`📝 新規登録試行: ${email}`);
      
      // 既存ユーザーチェック
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // パスワードがNULLの場合は新しいパスワードを設定する
        if (!existingUser.password) {
          console.log(`🔄 事前登録ユーザーのパスワード設定: ${email}`);
          
          // パスワードハッシュ化
          const hashedPassword = await this.hashPassword(password);
          
          // 既存ユーザーのパスワードを更新
          const updatedUser = await storage.updateUser(existingUser.id, {
            password: hashedPassword,
            passwordInitialized: true
          });
          
          console.log(`✅ パスワード設定完了: ${email} (ID: ${existingUser.id})`);
          return await storage.getUser(existingUser.id); // 更新後のユーザー情報を取得
        } else {
          console.log(`❌ 既存ユーザーが存在（パスワード設定済み）: ${email}`);
          return null;
        }
      }

      // パスワードハッシュ化
      const hashedPassword = await this.hashPassword(password);

      // ユーザー作成
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        name: email.split('@')[0], // 仮の名前
        isActive: true,
        passwordInitialized: true
      });

      console.log(`✅ 新規登録成功: ${email} (ID: ${newUser.id})`);
      return newUser;
    } catch (error) {
      console.error(`❌ 登録エラー: ${email}`, error);
      return null;
    }
  }

  // ログイン
  static async login(email: string, password: string): Promise<User | null> {
    try {
      console.log(`🔐 ログイン試行: ${email}`);
      
      // ユーザー検索
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`❌ ユーザーが見つかりません: ${email}`);
        return null;
      }

      if (!user.password) {
        console.log(`❌ パスワードが設定されていません: ${email}`);
        return null;
      }

      // パスワード検証
      const isValid = await this.verifyPassword(password, user.password);
      if (!isValid) {
        console.log(`❌ パスワードが間違っています: ${email}`);
        return null;
      }

      console.log(`✅ ログイン成功: ${email} (ID: ${user.id})`);
      return user;
    } catch (error) {
      console.error(`❌ ログインエラー: ${email}`, error);
      return null;
    }
  }

  // セッション設定
  static setSession(req: Request, userId: number): void {
    console.log(`💾 セッション設定: ユーザーID ${userId}`);
    (req.session as any).userId = userId;
  }

  // セッション取得
  static getSession(req: Request): number | null {
    const userId = (req.session as any).userId;
    console.log(`🔍 セッション取得: ユーザーID ${userId || 'なし'}`);
    return userId || null;
  }

  // セッション削除
  static clearSession(req: Request): void {
    console.log(`🗑️ セッション削除`);
    (req.session as any).userId = null;
  }

  // 認証ミドルウェア
  static authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`🔒 認証チェック: ${req.method} ${req.path}`);
      
      const userId = SimpleEmailAuth.getSession(req);
      if (!userId) {
        console.log(`❌ 未認証リクエスト`);
        return res.status(401).json({ message: "認証が必要です" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`❌ ユーザーが見つかりません: ID ${userId}`);
        SimpleEmailAuth.clearSession(req);
        return res.status(401).json({ message: "ユーザーが見つかりません" });
      }

      console.log(`✅ 認証成功: ${user.email} (ID: ${user.id})`);
      (req as any).user = user;
      next();
    } catch (error) {
      console.error(`❌ 認証エラー:`, error);
      return res.status(500).json({ message: "認証エラー" });
    }
  };

  // ユーザー情報のサニタイズ
  static sanitizeUser(user: User) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}