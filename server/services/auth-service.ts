import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from '@shared/schema';
import { storage } from '../storage';

export class AuthService {
  // パスワードをハッシュ化
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // パスワードを検証
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // ランダムトークンを生成
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // ユーザー登録
  static async register(email: string, password: string, name: string, department?: string): Promise<User> {
    // 既存ユーザーチェック
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('このメールアドレスは既に登録されています');
    }

    // パスワードハッシュ化
    const hashedPassword = await this.hashPassword(password);
    
    // メール認証トークン生成
    const emailVerificationToken = this.generateToken();

    // ユーザー作成
    const userData = {
      email,
      password: hashedPassword,
      name,
      department: department || null,
      emailVerified: false,
      emailVerificationToken,
    };

    const user = await storage.createUser(userData);
    
    // TODO: メール認証メールを送信
    console.log(`認証メール送信予定: ${email} - Token: ${emailVerificationToken}`);
    
    return user;
  }

  // ログイン
  static async login(email: string, password: string): Promise<User> {
    const user = await storage.getUserByEmail(email);
    if (!user || !user.password) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    const isValid = await this.verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    return user;
  }

  // メール認証
  static async verifyEmail(token: string): Promise<User> {
    const user = await storage.getUserByEmailVerificationToken(token);
    if (!user) {
      throw new Error('無効な認証トークンです');
    }

    // メール認証完了
    await storage.updateUser(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });

    const updatedUser = await storage.getUser(user.id);
    if (!updatedUser) {
      throw new Error('ユーザーが見つかりません');
    }

    return updatedUser;
  }

  // パスワードリセット要求
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // セキュリティのため、ユーザーが存在しなくても成功として扱う
      return;
    }

    const resetToken = this.generateToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1時間後

    await storage.updateUser(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // TODO: パスワードリセットメールを送信
    console.log(`パスワードリセットメール送信予定: ${email} - Token: ${resetToken}`);
  }

  // パスワードリセット
  static async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await storage.getUserByPasswordResetToken(token);
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new Error('無効または期限切れのリセットトークンです');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await storage.updateUser(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    const updatedUser = await storage.getUser(user.id);
    if (!updatedUser) {
      throw new Error('ユーザーが見つかりません');
    }

    return updatedUser;
  }

  // パスワード変更
  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user || !user.password) {
      throw new Error('ユーザーが見つかりません');
    }

    const isValid = await this.verifyPassword(currentPassword, user.password);
    if (!isValid) {
      throw new Error('現在のパスワードが正しくありません');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await storage.updateUser(userId, { password: hashedPassword });
  }
}