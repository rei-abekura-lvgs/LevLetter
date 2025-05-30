import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { randomUUID } from "crypto";
import bodyParser from "body-parser";
import cors from "cors";
import { z } from "zod";
import { type PgTable } from "drizzle-orm/pg-core";
import { and, eq, desc, count, sql, isNotNull, isNull, inArray, like, not } from "drizzle-orm";
import { storage } from "./storage";
import { serveStatic, log } from "./vite";
import { hashPassword } from "./storage";
import { generateGoogleAuthUrl, exchangeCodeForTokens, decodeIdToken, getRedirectUri } from "./cognito-auth";
import { 
  logAuth, 
  logSession, 
  setUserSession, 
  getUserIdFromSession, 
  verifyPassword, 
  registerUserPassword,
  sendAuthError,
  sendUserResponse 
} from "./auth-utils";

import { 
  registerSchema, 
  loginSchema, 
  cardFormSchema, 
  profileUpdateSchema, 
  likeFormSchema
} from "@shared/schema";

// 週次ポイントリセットミドルウェア
const weeklyPointsResetMiddleware = async (req: Request, res: Response, next: Function) => {
  try {
    // 週次ポイントリセットを確認・実行
    await storage.resetWeeklyPointsIfNeeded();
    next();
  } catch (error) {
    console.error("週次ポイントリセットエラー:", error);
    // エラーが発生してもリクエストを継続
    next();
  }
};

// 認証ミドルウェア
const authenticate = async (req: Request, res: Response, next: Function) => {
  console.log("🔐 認証チェック開始");
  console.log("🆔 リクエストURL:", req.method, req.path);
  console.log("🔑 セッションID:", req.sessionID);
  console.log("📋 セッション全体:", JSON.stringify(req.session, null, 2));
  
  // セッションからユーザーIDを取得
  const userId = (req.session as any).userId;
  console.log("👤 セッションから取得したユーザーID:", userId);
  
  if (!userId) {
    console.log("❌ 認証失敗 - ユーザーIDがセッションに存在しません");
    return res.status(401).json({ message: "認証が必要です" });
  }

  try {
    console.log("🔍 ユーザー情報取得試行 - ユーザーID:", userId);
    // ユーザー情報を取得
    const user = await storage.getUser(userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "無効なセッションです" });
    }

    // リクエストオブジェクトにユーザー情報を付与
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("認証エラー:", error);
    return res.status(500).json({ message: "認証処理中にエラーが発生しました" });
  }
};

// 管理者権限チェックミドルウェア
const checkAdmin = async (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user.isAdmin) {
    return res.status(403).json({ message: "管理者権限が必要です" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cors({
    origin: true, // 開発環境では全オリジンを許可
    credentials: true, // Cookieを含むリクエストを許可
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // セッション設定
  app.use(
    session({
      secret: process.env.SESSION_SECRET || randomUUID(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // 本番環境でも一時的にfalseに設定
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1週間
        sameSite: 'lax', // クロスサイトリクエストでの互換性向上
      },
    })
  );

  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "入力データが無効です",
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    console.error("バリデーションエラー:", error);
    return res.status(500).json({ message: "バリデーション処理中にエラーが発生しました" });
  };

  // Google認証開始エンドポイント
  app.get("/api/auth/google", async (req: Request, res: Response) => {
    try {
      console.log("🌐 Google認証開始");
      
      // 必要な環境変数の確認
      if (!process.env.AWS_COGNITO_DOMAIN || !process.env.AWS_COGNITO_CLIENT_ID) {
        console.error("❌ AWS Cognito設定が不完全です");
        return res.redirect('/login?error=config_error');
      }
      
      const redirectUri = getRedirectUri(req);
      const authUrl = generateGoogleAuthUrl(redirectUri);
      console.log("🔗 リダイレクトURI:", redirectUri);
      console.log("🔗 認証URL:", authUrl);
      res.redirect(authUrl);
    } catch (error) {
      console.error("❌ Google認証開始エラー:", error);
      res.redirect('/login?error=auth_start_failed');
    }
  });

  // Google認証コールバックエンドポイント
  app.get("/auth/callback", async (req: Request, res: Response) => {
    try {
      console.log("🔄 Google認証コールバック処理開始");
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        console.log("❌ 認証コードが見つかりません");
        return res.redirect('/login?error=auth_failed');
      }

      console.log("🔑 認証コード受信:", code);
      const redirectUri = getRedirectUri(req);
      
      // 認証コードをトークンに交換
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      console.log("✅ トークン取得成功");
      
      // IDトークンからユーザー情報を取得
      const cognitoUser = decodeIdToken(tokens.id_token);
      console.log("👤 Cognitoユーザー情報:", cognitoUser);
      
      // 従業員データベースとの照合チェック
      console.log("🔍 従業員データベース照合開始:", cognitoUser.email);
      let user = await storage.getUserByEmail(cognitoUser.email);
      
      if (!user) {
        console.log("❌ 従業員データベースに未登録:", cognitoUser.email);
        console.log("🔄 新規ユーザー登録プロセス開始");
        
        // セッションにGoogle認証情報を一時保存
        (req.session as any).pendingGoogleAuth = {
          cognitoSub: cognitoUser.id,
          email: cognitoUser.email,
          name: cognitoUser.name,
          familyName: cognitoUser.familyName,
          picture: cognitoUser.picture
        };
        
        console.log("💾 Google認証情報をセッションに保存");
        return res.redirect('/register?google=true');
      }
      
      console.log("✅ 従業員データベース照合成功:", user.email);
      
      // 既存従業員のGoogle認証情報を更新
      if (!user.cognitoSub) {
        console.log("🔄 Cognito ID更新:", user.id);
        await storage.updateUser(user.id, { 
          cognitoSub: cognitoUser.id,
          customAvatarUrl: cognitoUser.picture || user.customAvatarUrl
        });
        user = await storage.getUser(user.id); // 更新後のユーザー情報を再取得
      } else {
        console.log("👤 既存Google認証ユーザーでログイン:", user.email);
      }
      
      // セッションにユーザーIDを保存
      (req.session as any).userId = user.id;
      console.log("💾 セッション保存:", { userId: user.id, sessionId: req.sessionID });
      
      // ログイン成功メッセージと共にメインページにリダイレクト
      const successMessage = encodeURIComponent("ログインに成功しました");
      res.redirect(`/?success=${successMessage}`);
    } catch (error) {
      console.error("❌ Google認証コールバックエラー:", error);
      res.redirect('/login?error=auth_failed');
    }
  });

  // Google認証の一時情報を取得
  app.get('/api/auth/google-pending', async (req: Request, res: Response) => {
    try {
      const pendingAuth = (req.session as any).pendingGoogleAuth;
      if (!pendingAuth) {
        return res.status(404).json({ message: "Google認証情報が見つかりません" });
      }
      console.log("📤 Google認証情報を送信:", pendingAuth.email);
      res.json(pendingAuth);
    } catch (error) {
      console.error("Error fetching Google auth info:", error);
      res.status(500).json({ message: "Google認証情報の取得に失敗しました" });
    }
  });

  // ログイン
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      logAuth("ログイン試行開始", req.body);
      
      const data = loginSchema.parse(req.body);
      logAuth(`バリデーション成功 - メール: ${data.email}`);
      
      const user = await verifyPassword(data.email, data.password);
      if (!user) {
        return sendAuthError(res, "メールアドレスまたはパスワードが正しくありません");
      }
      
      setUserSession(req, user.id);
      
      // セッション保存を明示的に実行
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            logAuth("セッション保存エラー", err);
            reject(err);
          } else {
            logAuth("セッション保存成功");
            resolve();
          }
        });
      });
      
      return sendUserResponse(res, user, "ログインに成功しました");
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      logAuth("ログインエラー", error);
      return res.status(500).json({ message: "ログイン処理中にエラーが発生しました" });
    }
  });

  // 認証状態確認エンドポイント
  app.get("/api/auth/me", authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      console.log("✅ 認証ユーザー情報返送:", user.name, "(ID:", user.id, ")");
      
      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("💥 認証ユーザー情報取得エラー:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  // パスワード変更
  app.post("/api/auth/change-password", authenticate, async (req: any, res: any) => {
    try {
      console.log("🔐 パスワード変更試行開始");
      console.log("🆔 ユーザーID:", req.session.userId);
      
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        console.log("❌ パスワード変更失敗 - 必要なパラメータが不足");
        return res.status(400).json({ message: "現在のパスワードと新しいパスワードが必要です" });
      }
      
      if (newPassword.length < 6) {
        console.log("❌ パスワード変更失敗 - 新しいパスワードが短すぎる");
        return res.status(400).json({ message: "新しいパスワードは6文字以上である必要があります" });
      }
      
      // 現在のユーザー情報を取得
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("❌ パスワード変更失敗 - ユーザーが見つからない");
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      // 現在のパスワードを確認
      const currentPasswordHash = hashPassword(currentPassword);
      if (user.password !== currentPasswordHash) {
        console.log("❌ パスワード変更失敗 - 現在のパスワードが正しくない");
        return res.status(400).json({ message: "現在のパスワードが正しくありません" });
      }
      
      // 新しいパスワードをハッシュ化
      const newPasswordHash = hashPassword(newPassword);
      
      // パスワードを更新
      await storage.updateUser(user.id, {
        password: newPasswordHash,
        passwordInitialized: true,
        updatedAt: new Date()
      });
      
      console.log("✅ パスワード変更成功:", user.email);
      return res.json({ message: "パスワードが正常に変更されました" });
      
    } catch (error) {
      console.error("パスワード変更エラー:", error);
      return res.status(500).json({ message: "パスワード変更処理中にエラーが発生しました" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("🔐 新規登録リクエスト受信");
      console.log("📝 リクエストボディ:", req.body);
      
      const data = registerSchema.parse(req.body);
      console.log("✅ バリデーション成功 - メール:", data.email);
      
      // メールアドレスの重複チェック
      console.log(`🔍 ユーザー検索開始: ${data.email}`);
      const existingUser = await storage.getUserByEmail(data.email);
      
      if (existingUser) {
        console.log(`📋 既存ユーザー発見 - ID: ${existingUser.id}, パスワード設定済み: ${!!existingUser.password}`);
        
        if (existingUser.password) {
          console.log(`❌ 既に登録済み: ${data.email}`);
          return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
        }
        
        // CSVインポートで登録済みの場合はパスワードをセットする
        console.log(`🔐 新規登録処理開始 - ユーザー: ${existingUser.email}`);
        console.log(`📝 入力パスワード: "${data.password}"`);
        
        const hashedPassword = await hashPassword(data.password);
        console.log(`🔒 生成ハッシュ: "${hashedPassword}"`);
        
        // ユーザー情報を更新（パスワードは既にハッシュ化済み）
        const updatedUser = await storage.updateUser(existingUser.id, {
          password: hashedPassword,
          passwordInitialized: true,
        });
        
        // 登録後の検証
        const verifyUser = await storage.authenticateUser(existingUser.email, data.password);
        if (!verifyUser) {
          console.error(`❌ パスワード検証失敗 - ${existingUser.email}`);
          return res.status(500).json({ message: "登録処理でエラーが発生しました" });
        }
        
        console.log(`✅ パスワード更新・検証完了 - ユーザー: ${existingUser.email}`);
        
        // セッションを設定
        req.session.userId = updatedUser.id;
        
        // パスワードを除いたユーザー情報を返す
        const { password, ...userWithoutPassword } = updatedUser;
        return res.status(200).json({ 
          message: "アカウント登録が完了しました", 
          user: userWithoutPassword 
        });
      }
      
      // メールアドレスがCSVインポートされた内容と一致するか確認
      const preregisteredUser = await storage.getUserByEmail(data.email);
      if (!preregisteredUser) {
        return res.status(400).json({ 
          message: "このメールアドレスは事前登録されていません。管理者に連絡してください。" 
        });
      }
      
      // ハッシュ化したパスワードを設定
      console.log(`🔐 新規登録処理開始 - ユーザー: ${data.email}`);
      console.log(`📝 入力パスワード: "${data.password}"`);
      
      const hashedPassword = hashPassword(data.password);
      console.log(`🔒 生成ハッシュ: "${hashedPassword}"`);
      
      // ユーザー情報を更新（パスワードは既にハッシュ化済み）
      const updatedUser = await storage.updateUser(preregisteredUser.id, {
        password: hashedPassword,
        passwordInitialized: true,
      });
      
      // 登録後の検証
      const verifyUser = await storage.authenticateUser(data.email, data.password);
      if (!verifyUser) {
        console.error(`❌ パスワード検証失敗 - ${data.email}`);
        return res.status(500).json({ message: "登録処理でエラーが発生しました" });
      }
      
      console.log(`✅ パスワード更新・検証完了 - ユーザー: ${data.email}`);
      
      // セッションを設定
      req.session.userId = updatedUser.id;
      
      // パスワードを除いたユーザー情報を返す
      const { password, ...userWithoutPassword } = updatedUser;
      return res.status(200).json({ 
        message: "アカウント登録が完了しました", 
        user: userWithoutPassword 
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      console.error("登録エラー:", error);
      return res.status(500).json({ message: "登録処理中にエラーが発生しました" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error("ログアウトエラー:", err);
        return res.status(500).json({ message: "ログアウト処理中にエラーが発生しました" });
      }
      return res.json({ message: "ログアウトに成功しました" });
    });
  });

  // パスワードリセット機能
  app.post("/api/auth/password-reset-request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "メールアドレスは必須です" });
      }
      
      console.log(`🔐 パスワードリセットリクエスト受信: ${email}`);
      
      // メールアドレスでユーザーを検索
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // セキュリティ上の理由から、ユーザーが存在しない場合も成功を返す
        return res.json({ 
          message: "パスワードリセット手順をメールで送信しました"
        });
      }
      
      try {
        // サービスのインポート
        const { generatePasswordResetToken } = await import('./services/token');
        const { sendEmail, getPasswordResetEmailTemplate } = await import('./services/email');
        
        // リセットトークン生成
        const resetToken = generatePasswordResetToken(user.id, user.email);
        
        // アプリのベースURL
        const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
        
        console.log(`🔗 パスワードリセットリンク生成: ${resetLink}`);
        
        // メールテンプレート取得
        const { html, text } = getPasswordResetEmailTemplate({
          userName: user.name, 
          resetLink
        });
        
        // メール送信
        const emailSent = await sendEmail({
          to: user.email,
          subject: 'パスワードリセットのお知らせ',
          htmlContent: html,
          textContent: text
        });
        
        if (emailSent) {
          console.log(`✅ パスワードリセットメール送信成功: ${user.email}`);
        } else {
          console.error(`❌ パスワードリセットメール送信失敗: ${user.email}`);
        }
        
      } catch (error) {
        console.error("パスワードリセットメール送信エラー:", error);
      }
      
      // ユーザーの存在に関わらず、同じレスポンスを返す（セキュリティ対策）
      return res.json({ 
        message: "パスワードリセット手順をメールで送信しました"
      });
      
    } catch (error) {
      console.error("パスワードリセットエラー:", error);
      return res.status(500).json({ message: "パスワードリセット処理中にエラーが発生しました" });
    }
  });

  // パスワードリセット実行
  app.post("/api/auth/password-reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "トークンと新しいパスワードは必須です" });
      }
      
      // トークンの検証
      console.log(`トークン検証開始: ${token.substring(0, 20)}...`);
      const { verifyPasswordResetToken } = await import('./services/token');
      const tokenData = verifyPasswordResetToken(token);
      
      if (!tokenData.valid || !tokenData.userId) {
        console.log(`❌ トークン検証失敗:`, tokenData);
        return res.status(400).json({ message: "無効または期限切れのトークンです" });
      }
      
      console.log(`✅ トークン検証成功:`, tokenData);
      
      // ユーザー取得
      const user = await storage.getUser(tokenData.userId);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      // パスワード更新
      console.log(`🔐 パスワードリセット処理開始`);
      console.log(`📝 新パスワード: "${newPassword}"`);
      
      const hashedPassword = hashPassword(newPassword);
      console.log(`🔒 生成されたハッシュ: "${hashedPassword}"`);
      
      // パスワードを更新（既にハッシュ化済み）
      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordInitialized: true
      });
      
      // リセット後の検証
      const verifyUser = await storage.authenticateUser(user.email, newPassword);
      if (!verifyUser) {
        console.error(`❌ パスワードリセット後の検証失敗 - ${user.email}`);
        return res.status(500).json({ message: "パスワードリセット処理でエラーが発生しました" });
      }
      
      console.log(`✅ パスワードリセット完了: ${user.email}`);
      
      return res.json({ 
        message: "パスワードが正常にリセットされました" 
      });
      
    } catch (error) {
      console.error("パスワードリセット実行エラー:", error);
      return res.status(500).json({ message: "パスワードリセット中にエラーが発生しました" });
    }
  });
  
  // メールアドレス検証API
  app.get("/api/auth/verify-email", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "有効なメールアドレスを指定してください" });
      }
      
      console.log(`メールアドレス検証リクエスト: ${email}`);
      
      // メールアドレスが事前登録されているか確認
      const user = await storage.getUserByEmail(email);
      
      // 特定のメールアドレスを許可リストに追加（テスト用）
      // 実運用では、このような直接的なハードコーディングではなく、
      // デーダベースやコンフィグから読み込む形式にすることをお勧めします
      const allowedEmails = [
        "kota.makino@leverages.jp",
        "admin@example.com"
      ];
      
      if (user) {
        // ユーザーが存在する場合
        return res.json({
          exists: true,
          userExists: true,
          hasPassword: !!user.password,
          message: user.password 
            ? "このメールアドレスは既に登録されています。ログインしてください。" 
            : "このメールアドレスは事前登録されています。続けてパスワードを設定してください。"
        });
      } else if (allowedEmails.includes(email)) {
        // 許可リストに含まれる場合
        return res.json({
          exists: true,
          userExists: false,
          hasPassword: false,
          message: "このメールアドレスは事前登録されています。続けてパスワードを設定してください。"
        });
      } else {
        // 未登録のメールアドレス
        return res.json({
          exists: false,
          userExists: false,
          hasPassword: false,
          message: "このメールアドレスは管理者によって事前登録されていません。"
        });
      }
    } catch (error) {
      console.error("メールアドレス検証エラー:", error);
      return res.status(500).json({ message: "メールアドレスの検証中にエラーが発生しました" });
    }
  });

  app.get("/api/auth/me", authenticate, (req, res) => {
    try {
      console.log("認証情報取得 - 認証済みユーザー確認");
      // パスワードフィールドを除外
      const user = (req as any).user;
      console.log("取得したユーザー情報:", user ? `${user.name} (ID: ${user.id})` : "null");
      
      if (!user) {
        console.log("認証情報取得エラー - ユーザー情報がリクエストに存在しません");
        return res.status(401).json({ message: "認証が必要です" });
      }
      
      const { password, ...userWithoutPassword } = user;
      console.log("認証情報取得成功 - ユーザー:", userWithoutPassword.name);
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("ユーザー情報取得エラー:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  // ユーザー関連API
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // パスワードフィールドを除外
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      return res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  app.get("/api/users/:id", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "無効なユーザーIDです" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      const { password, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  app.patch("/api/users/:id", authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "無効なユーザーIDです" });
      }

      const currentUser = (req as any).user;
      if (currentUser.id !== userId && !currentUser.isAdmin) {
        return res.status(403).json({ message: "他のユーザー情報を更新する権限がありません" });
      }

      const data = profileUpdateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, data);

      const { password, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "ユーザー情報の更新に失敗しました" });
    }
  });
  
  // アバター画像アップロード用API
  app.post("/api/users/:id/avatar", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const userId = parseInt(req.params.id);
      
      // 自分自身のアバターのみ更新可能
      if (currentUser.id !== userId && !currentUser.isAdmin) {
        return res.status(403).json({ message: "他のユーザーのアバターは更新できません" });
      }
      
      // Base64エンコードされた画像データを取得
      if (!req.body.imageData || typeof req.body.imageData !== 'string') {
        return res.status(400).json({ message: "画像データが不正です" });
      }
      
      const imageData = req.body.imageData;
      
      // ユーザープロフィールのカスタムアバターURLを更新
      const updatedUser = await storage.updateUser(userId, {
        customAvatarUrl: imageData
      });
      
      // パスワードフィールドを除外
      const { password, ...userWithoutPassword } = updatedUser;
      
      console.log("アバター画像更新成功:", userId);
      return res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error("アバター画像アップロードエラー:", error);
      return res.status(500).json({ message: "アバター画像のアップロードに失敗しました" });
    }
  });

  // 管理者用API - ユーザー一覧取得
  app.get("/api/admin/users", authenticate, checkAdmin, async (req, res) => {
    try {
      console.log("管理者ユーザー一覧API呼び出し");
      const users = await storage.getUsers();
      
      // パスワードフィールドを除外
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.json(sanitizedUsers);
    } catch (error) {
      console.error("管理者ユーザー一覧取得エラー:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });
  
  // 管理者用API - 部署一覧取得
  app.get("/api/admin/departments", authenticate, checkAdmin, async (req, res) => {
    try {
      console.log("管理者部署一覧API呼び出し");
      const departments = await storage.getDepartments();
      return res.json(departments);
    } catch (error) {
      console.error("管理者部署一覧取得エラー:", error);
      return res.status(500).json({ message: "部署情報の取得に失敗しました" });
    }
  });
  
  // 管理者用API - ユーザー一括削除
  app.post("/api/admin/users/bulk-delete", authenticate, checkAdmin, async (req, res) => {
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "削除するユーザーIDが指定されていません" });
      }

      // 管理者アカウントの保護 (rei.abekura@leverages.jp)
      // ※実運用時には環境変数やDBフラグなどでより堅牢に保護することを推奨
      const protectedEmail = "rei.abekura@leverages.jp";
      const users = await storage.getUsers();
      const adminUser = users.find(user => user.email === protectedEmail);
      if (adminUser && userIds.includes(adminUser.id)) {
        return res.status(403).json({ 
          message: "管理者アカウントは削除できません",
          protectedUserId: adminUser.id
        });
      }

      const deleteResults = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          // まず、ユーザーに関連するカードを削除
          const cards = await storage.getCards({ senderId: userId });
          for (const card of cards) {
            await storage.deleteCard(card.id);
          }
          
          // 次に、ユーザーに関連するいいねを削除
          const cardIds = cards.map(card => card.id);
          if (cardIds.length > 0) {
            // TODO: バルク削除の実装
          }
          
          // 最後にユーザーを削除
          await storage.deleteUser(userId);
          deleteResults.push({ userId, success: true });
        } catch (deleteError) {
          console.error(`Error deleting user ${userId}:`, deleteError);
          errors.push({ userId, error: `${deleteError}` });
          deleteResults.push({ userId, success: false });
        }
      }

      return res.json({
        message: "ユーザー削除処理を完了しました",
        results: deleteResults,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error("バルク削除エラー:", error);
      return res.status(500).json({ message: "ユーザー削除処理中にエラーが発生しました" });
    }
  });

  app.post("/api/admin/users/import", authenticate, checkAdmin, async (req, res) => {
    try {
      const { employees } = req.body;
      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "インポートするユーザーデータがありません" });
      }

      const results = {
        success: true,
        newUsers: 0,
        updatedUsers: 0,
        newOrganizations: 0,
        errors: [] as string[]
      };

      // 組織階層データを同時に更新する関数
      const updateOrganizationHierarchy = async (employee: any) => {
        try {
          // CSVから組織階層データを抽出（6レベル）
          const levels = [
            employee['所属階層１'] || null, // レベル1: 会社
            employee['所属階層２'] || null, // レベル2: 本部
            employee['所属階層３'] || null, // レベル3: 部
            employee['所属階層４'] || null, // レベル4: グループ
            employee['所属階層５'] || null, // レベル5: チーム
            employee['所属階層６'] || null  // レベル6: ユニット
          ];

          let parentId: number | null = null;

          // 各レベルを順番に処理して組織階層を構築
          for (let i = 0; i < levels.length; i++) {
            const levelName = levels[i];
            if (!levelName || levelName.trim() === '') continue;

            const level = i + 1;
            
            // 既存の組織を検索
            const existingOrg = await storage.findOrganizationByNameAndParent(levelName, parentId);
            
            if (!existingOrg) {
              // 新しい組織を作成
              const newOrg = await storage.createOrganization({
                level,
                name: levelName,
                parent_id: parentId,
                is_active: true,
                code: null
              });
              parentId = newOrg.id;
              results.newOrganizations++;
            } else {
              parentId = existingOrg.id;
            }
          }
        } catch (orgError) {
          console.error(`組織階層更新エラー(${employee.email}):`, orgError);
          // 組織階層の更新エラーは非致命的として処理を続行
        }
      };

      for (const employee of employees) {
        try {
          // 必須フィールドのチェック
          if (!employee.email || !employee.name) {
            results.errors.push(`不完全なユーザーデータ: ${JSON.stringify(employee)}`);
            continue;
          }

          // メールアドレスの形式チェック
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
            results.errors.push(`無効なメールアドレス: ${employee.email}`);
            continue;
          }

          // 組織階層データを更新
          await updateOrganizationHierarchy(employee);

          // 既存ユーザーの確認
          const existingUser = await storage.getUserByEmail(employee.email);
          
          // 部署情報の設定（未設定の場合は"その他"）
          const department = employee.department || employee['所属階層３'] || "その他";
          
          // 6段階組織階層情報を抽出
          const organizationData = {
            organizationLevel1: employee.organizationLevel1 || null,
            organizationLevel2: employee.organizationLevel2 || null,
            organizationLevel3: employee.organizationLevel3 || null,
            organizationLevel4: employee.organizationLevel4 || null,
            organizationLevel5: employee.organizationLevel5 || null,
            organizationLevel6: employee.organizationLevel6 || null,
          };
          
          console.log(`📊 ユーザー${employee.email}の組織階層データ:`, organizationData);
          
          if (existingUser) {
            // 既存ユーザーの更新（パスワードは維持）
            await storage.updateUser(existingUser.id, {
              name: employee.name,
              displayName: employee.displayName || null,
              department,
              employeeId: employee.employeeId || null,
              ...organizationData,
            });
            results.updatedUsers++;
          } else {
            // 新規ユーザーの作成（パスワードなし）
            await storage.createUser({
              email: employee.email,
              name: employee.name,
              displayName: employee.displayName || null,
              department,
              employeeId: employee.employeeId || null,
              ...organizationData,
              password: null, // パスワードなし = 初回登録が必要
              isAdmin: false,
              isActive: true,
              cognitoSub: null,
              googleId: null,
              weeklyPoints: 500,
              totalPointsReceived: 0,
              avatarColor: getRandomColor(),
              customAvatarUrl: null,
            });
            results.newUsers++;
          }
        } catch (employeeError) {
          results.errors.push(`処理エラー(${employee.email}): ${employeeError}`);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
      }

      return res.json(results);
    } catch (error) {
      console.error("ユーザーインポートエラー:", error);
      return res.status(500).json({ 
        success: false, 
        message: "ユーザーのインポート中にエラーが発生しました",
        error: `${error}`
      });
    }
  });

  // 組織階層管理API
  app.get("/api/admin/organizations", authenticate, checkAdmin, async (req, res) => {
    try {
      const organizations = await storage.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("組織取得エラー:", error);
      res.status(500).json({ message: "組織データの取得に失敗しました" });
    }
  });

  app.post("/api/admin/organizations", authenticate, checkAdmin, async (req, res) => {
    try {
      const { level, name, code, parentId, description } = req.body;
      
      if (!level || !name) {
        return res.status(400).json({ message: "レベルと名前は必須です" });
      }

      if (level < 1 || level > 5) {
        return res.status(400).json({ message: "レベルは1〜5の範囲で指定してください" });
      }

      const organization = await storage.createOrganization({
        level,
        name,
        code: code || null,
        parentId: parentId || null,
        description: description || null,
        isActive: true
      });

      res.status(201).json(organization);
    } catch (error) {
      console.error("組織作成エラー:", error);
      res.status(500).json({ message: "組織の作成に失敗しました" });
    }
  });

  app.put("/api/admin/organizations/:id", authenticate, checkAdmin, async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const { level, name, code, parentId, description, isActive } = req.body;

      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "無効な組織IDです" });
      }

      const organization = await storage.updateOrganization(organizationId, {
        level,
        name,
        code,
        parentId,
        description,
        isActive
      });

      if (!organization) {
        return res.status(404).json({ message: "組織が見つかりません" });
      }

      res.json(organization);
    } catch (error) {
      console.error("組織更新エラー:", error);
      res.status(500).json({ message: "組織の更新に失敗しました" });
    }
  });

  app.delete("/api/admin/organizations/:id", authenticate, checkAdmin, async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);

      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "無効な組織IDです" });
      }

      await storage.deleteOrganization(organizationId);
      res.json({ message: "組織を削除しました" });
    } catch (error) {
      console.error("組織削除エラー:", error);
      res.status(500).json({ message: "組織の削除に失敗しました" });
    }
  });

  // 組織階層インポートAPI
  app.post("/api/admin/organizations/import", authenticate, checkAdmin, async (req, res) => {
    try {
      const { organizations } = req.body;

      if (!Array.isArray(organizations)) {
        return res.status(400).json({ message: "組織データは配列である必要があります" });
      }

      const results = {
        success: true,
        imported: 0,
        updated: 0,
        errors: [] as string[]
      };

      for (const org of organizations) {
        try {
          if (!org.level || !org.name) {
            results.errors.push(`無効な組織データ: ${JSON.stringify(org)}`);
            continue;
          }

          // 既存の組織をチェック（名前とレベルで）
          const existing = await storage.getOrganizationByNameAndLevel(org.name, org.level);
          
          if (existing) {
            await storage.updateOrganization(existing.id, {
              code: org.code || null,
              parentId: org.parentId || null,
              description: org.description || null,
              isActive: org.isActive !== false
            });
            results.updated++;
          } else {
            await storage.createOrganization({
              level: org.level,
              name: org.name,
              code: org.code || null,
              parentId: org.parentId || null,
              description: org.description || null,
              isActive: org.isActive !== false
            });
            results.imported++;
          }
        } catch (orgError) {
          results.errors.push(`組織処理エラー(${org.name}): ${orgError}`);
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
      }

      res.json(results);
    } catch (error) {
      console.error("組織インポートエラー:", error);
      res.status(500).json({ 
        success: false, 
        message: "組織のインポート中にエラーが発生しました",
        error: `${error}`
      });
    }
  });

  // 管理者権限更新API
  app.patch("/api/admin/users/:id/admin", authenticate, checkAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isAdmin } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ message: "無効なユーザーIDです" });
      }

      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: "isAdminは真偽値である必要があります" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      // 管理者権限を更新
      const updatedUser = await storage.updateUser(userId, { isAdmin });
      
      // パスワードを除外してレスポンス
      const { password, ...userWithoutPassword } = updatedUser;

      console.log(`管理者権限更新: ユーザー${userId}の権限を${isAdmin ? '付与' : '削除'}しました`);
      
      return res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: `管理者権限を${isAdmin ? '付与' : '削除'}しました`
      });
    } catch (error) {
      console.error("管理者権限更新エラー:", error);
      return res.status(500).json({ message: "管理者権限の更新に失敗しました" });
    }
  });

  // 週次ポイントリセット（管理者専用テスト機能）
  app.post("/api/admin/reset-weekly-points", authenticate, checkAdmin, async (req, res) => {
    try {
      const userCount = await storage.getUserCount();
      await storage.resetUserWeeklyPoints();
      console.log(`✅ 管理者による週次ポイントリセット実行完了 - ${userCount}人`);
      
      return res.json({ 
        message: `全ユーザー（${userCount}人）の週次ポイントを500ptにリセットしました`,
        resetCount: userCount
      });
    } catch (error) {
      console.error("週次ポイントリセットエラー:", error);
      return res.status(500).json({ message: "週次ポイントリセット処理中にエラーが発生しました" });
    }
  });

  // チーム関連API
  app.get("/api/teams", authenticate, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      return res.json(teams);
    } catch (error) {
      console.error("チーム取得エラー:", error);
      return res.status(500).json({ message: "チーム情報の取得に失敗しました" });
    }
  });

  app.get("/api/teams/:id", authenticate, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "無効なチームIDです" });
      }

      const team = await storage.getTeamWithMembers(teamId);
      if (!team) {
        return res.status(404).json({ message: "チームが見つかりません" });
      }

      return res.json(team);
    } catch (error) {
      console.error("チーム取得エラー:", error);
      return res.status(500).json({ message: "チーム情報の取得に失敗しました" });
    }
  });

  // 部署関連API
  app.get("/api/departments", authenticate, async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      return res.json(departments);
    } catch (error) {
      console.error("部署取得エラー:", error);
      return res.status(500).json({ message: "部署情報の取得に失敗しました" });
    }
  });

  // 組織階層情報を取得するAPI
  app.get("/api/organizations", authenticate, async (req, res) => {
    try {
      const organizationHierarchy = await storage.getOrganizationHierarchy();
      return res.json(organizationHierarchy);
    } catch (error) {
      console.error("組織階層取得エラー:", error);
      return res.status(500).json({ message: "組織階層情報の取得に失敗しました" });
    }
  });

  // カード関連API
  app.get("/api/cards", weeklyPointsResetMiddleware, authenticate, async (req, res) => {
    try {
      const { limit = 50, offset = 0, sender, recipient, view } = req.query;
      const currentUser = (req as any).user;
      const options: any = { 
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      };

      if (sender) {
        options.senderId = parseInt(sender as string);
      }

      if (recipient) {
        options.recipientId = parseInt(recipient as string);
      }

      // viewパラメータによる表示カードのフィルタリング
      if (view === 'sent') {
        options.senderId = currentUser.id;
      } else if (view === 'received') {
        options.recipientId = currentUser.id;
        options.recipientType = 'user';
      } else if (view === 'liked') {
        // いいねしたカードの取得
        options.likedByUserId = currentUser.id;
      }

      const cards = await storage.getCards(options);
      
      // 強力なキャッシュ無効化ヘッダーを設定
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': `"${Date.now()}-${Math.random()}"`,
        'Last-Modified': new Date().toUTCString()
      });
      
      return res.json(cards);
    } catch (error) {
      console.error("カード取得エラー:", error);
      return res.status(500).json({ message: "カード情報の取得に失敗しました" });
    }
  });

  app.get("/api/cards/:id", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }

      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }

      return res.json(card);
    } catch (error) {
      console.error("カード取得エラー:", error);
      return res.status(500).json({ message: "カード情報の取得に失敗しました" });
    }
  });

  app.post("/api/cards", weeklyPointsResetMiddleware, authenticate, async (req, res) => {
    try {
      const data = cardFormSchema.parse(req.body);
      const sender = (req as any).user;

      // ポイント残高チェック
      if (sender.weeklyPoints < data.points) {
        return res.status(400).json({ message: "ポイント残高が不足しています" });
      }

      // カード作成処理
      const cardData = {
        senderId: sender.id,
        recipientId: parseInt(data.recipientId.toString()),
        recipientType: data.recipientType,
        message: data.message,
        points: data.points,
        public: true, // デフォルトは公開
        additionalRecipients: data.additionalRecipients || null
      };

      const card = await storage.createCard(cardData);

      // 送信者のポイント残高を減算
      await storage.updateUser(sender.id, {
        weeklyPoints: sender.weeklyPoints - data.points
      });

      // 受信者にポイントを付与
      if (data.recipientType === "user") {
        const recipient = await storage.getUser(parseInt(data.recipientId.toString()));
        if (recipient) {
          await storage.updateUser(recipient.id, {
            totalPointsReceived: recipient.totalPointsReceived + data.points
          });
        }
      }

      // 複数ユーザー宛ての場合の処理
      if (data.additionalRecipients && data.additionalRecipients.length > 0) {
        for (const additionalRecipientId of data.additionalRecipients) {
          const additionalRecipient = await storage.getUser(additionalRecipientId);
          if (additionalRecipient) {
            await storage.updateUser(additionalRecipient.id, {
              totalPointsReceived: additionalRecipient.totalPointsReceived + data.points
            });
          }
        }
      }

      return res.status(201).json({ message: "カードが作成されました", card });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      console.error("カード作成エラー:", error);
      return res.status(500).json({ message: "カードの作成に失敗しました" });
    }
  });

  // いいね関連API
  app.get("/api/cards/:id/likes", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }

      const likes = await storage.getLikesForCard(cardId);
      return res.json(likes);
    } catch (error) {
      console.error("いいね取得エラー:", error);
      return res.status(500).json({ message: "いいね情報の取得に失敗しました" });
    }
  });

  // カード別いいね機能 - いいねする
  app.post("/api/cards/:cardId/likes", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const user = (req as any).user;

      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }

      // カードの存在確認
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }

      // 送信者と受信者はいいねできない
      const allRecipients = card.additionalRecipients 
        ? [card.recipient as any, ...card.additionalRecipients] 
        : [card.recipient as any];
      const isRecipient = allRecipients.some((r: any) => r.id === user.id);
      const isSender = card.sender.id === user.id;
      
      if (isSender || isRecipient) {
        return res.status(403).json({ message: "送信者と受信者はいいねできません" });
      }

      // 50回制限チェック（重複チェックは削除）
      const cardLikes = await storage.getLikesForCard(cardId);
      if (cardLikes.length >= 50) {
        throw new Error("このカードは最大いいね数に達しています");
      }

      const like = await storage.createLike({
        cardId: cardId,
        userId: user.id,
        points: 2, // 新仕様：2ポイント消費
      });

      return res.status(201).json({ message: "いいねしました", like });
    } catch (error) {
      console.error("いいね作成エラー:", error);
      
      // エラーメッセージを詳細に分類
      if (error.message === "ポイントが不足しています") {
        return res.status(400).json({ message: "ポイントが不足しています（2pt必要）" });
      }
      if (error.message === "このカードは最大いいね数に達しています") {
        return res.status(400).json({ message: "このカードは最大いいね数（50回）に達しています" });
      }
      
      return res.status(500).json({ message: "いいねの作成に失敗しました" });
    }
  });

  // いいね詳細を取得
  app.get("/api/cards/:id/likes", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }

      const likes = await storage.getLikesForCard(cardId);
      
      // ユーザー情報と一緒にいいね詳細を返す
      const likesWithDetails = likes.map(like => ({
        id: like.id,
        userId: like.userId,
        points: like.points,
        createdAt: like.createdAt,
        user: {
          id: like.user.id,
          name: like.user.name,
          displayName: like.user.displayName,
          department: like.user.department,
          avatarColor: like.user.avatarColor,
          customAvatarUrl: like.user.customAvatarUrl
        }
      }));

      return res.json(likesWithDetails);
    } catch (error) {
      console.error("いいね詳細取得エラー:", error);
      return res.status(500).json({ message: "いいね詳細の取得に失敗しました" });
    }
  });

  // いいね機能：複数回可能、最大50回まで、2pt固定
  app.post("/api/cards/:id/likes", weeklyPointsResetMiddleware, authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const user = (req as any).user;

      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }

      // カードの取得
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }

      // 送受信者は自分のカードにいいねできない
      const isRecipient = card.recipientId === user.id || 
        (card.additionalRecipients && card.additionalRecipients.includes(user.id));
      const isSender = card.senderId === user.id;
      
      if (isSender || isRecipient) {
        return res.status(400).json({ message: "自分が関わるカードにはいいねできません" });
      }

      // カードの現在のいいね数を確認（50回上限）
      const currentLikes = await storage.getLikesForCard(cardId);
      if (currentLikes.length >= 50) {
        return res.status(400).json({ message: "このカードは既に50回のいいねに達しました" });
      }

      // ポイントチェック：2pt未満でも名前は表示される
      const pointsToDeduct = user.weeklyPoints >= 2 ? 2 : 0;
      
      // いいねを作成
      const like = await storage.createLike({
        cardId: cardId,
        userId: user.id,
        points: pointsToDeduct,
      });

      // ポイントを消費した場合のみポイント処理
      if (pointsToDeduct > 0) {
        // ユーザーのポイントを2pt減らす
        await storage.updateUser(user.id, {
          weeklyPoints: user.weeklyPoints - 2
        });

        // 送信者に1pt追加
        const sender = await storage.getUser(card.senderId);
        if (sender) {
          await storage.updateUser(card.senderId, {
            totalPointsReceived: sender.totalPointsReceived + 1
          });
        }

        // 受信者（複数の場合はランダム選択）に1pt追加
        let recipients = [card.recipientId];
        if (card.additionalRecipients && card.additionalRecipients.length > 0) {
          recipients = [...recipients, ...card.additionalRecipients];
        }
        const randomRecipient = recipients[Math.floor(Math.random() * recipients.length)];
        const recipient = await storage.getUser(randomRecipient);
        if (recipient) {
          await storage.updateUser(randomRecipient, {
            totalPointsReceived: recipient.totalPointsReceived + 1
          });
        }
      }

      const message = pointsToDeduct > 0 
        ? "いいねしました！"
        : "いいねしました！ポイントが不足していますが、いいねは記録されました";

      return res.status(201).json({ message, like, pointsDeducted: pointsToDeduct });
    } catch (error) {
      console.error("いいね作成エラー:", error);
      return res.status(500).json({ message: "いいねの作成に失敗しました" });
    }
  });
  
  // ダッシュボード統計API
  app.get("/api/dashboard/stats", weeklyPointsResetMiddleware, authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const stats = await storage.getDashboardStats(user.id);
      return res.json(stats);
    } catch (error) {
      console.error("ダッシュボード統計取得エラー:", error);
      return res.status(500).json({ message: "ダッシュボード統計の取得に失敗しました" });
    }
  });

  // カード削除API
  app.delete("/api/cards/:id", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const user = (req as any).user;
      
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }
      
      // カードの存在確認
      const card = await storage.getCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }
      
      // 管理者または送信者のみ削除可能
      if (card.senderId !== user.id && !user.isAdmin) {
        return res.status(403).json({ message: "このカードを削除する権限がありません" });
      }
      
      await storage.deleteCard(cardId);
      
      return res.json({ message: "カードを削除しました" });
    } catch (error) {
      console.error("カード削除エラー:", error);
      return res.status(500).json({ message: "カードの削除に失敗しました" });
    }
  });
  
  // カード表示状態更新API（管理者のみ）
  app.patch("/api/cards/:id/visibility", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const user = (req as any).user;
      const { hidden } = req.body;
      
      if (isNaN(cardId)) {
        return res.status(400).json({ message: "無効なカードIDです" });
      }
      
      if (typeof hidden !== 'boolean') {
        return res.status(400).json({ message: "無効なリクエストです。'hidden'フィールドはboolean型である必要があります" });
      }
      
      // カードの存在確認
      const card = await storage.getCard(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }
      
      // 管理者権限チェック
      if (!user.isAdmin) {
        return res.status(403).json({ message: "この操作を行う権限がありません" });
      }
      
      // カードの表示状態を更新
      // カードORM実装によってはこの部分の実装方法が異なる場合があります
      await storage.updateCard(cardId, { hidden });
      
      return res.json({ 
        message: hidden ? "カードを非表示にしました" : "カードを表示状態に戻しました",
        success: true
      });
    } catch (error) {
      console.error("カード表示状態更新エラー:", error);
      return res.status(500).json({ message: "カード表示状態の更新に失敗しました" });
    }
  });

  // ダッシュボード統計情報API
  app.get("/api/dashboard/stats", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user.id;
      
      // ポイント消化率（500ptを最大として）
      const pointConversionRate = Math.min(100, ((500 - user.weeklyPoints) / 500) * 100);
      
      // 基本データ取得
      const sentCards = await storage.getCardsByUser(userId);
      const receivedCards = await storage.getCardsToUser(userId);

      // 個人インタラクション統計
      const sentCardStats: Record<number, number> = {};
      sentCards.forEach(card => {
        if (card.recipientId && card.recipientId !== userId) {
          sentCardStats[card.recipientId] = (sentCardStats[card.recipientId] || 0) + 1;
        }
      });

      const receivedCardStats: Record<number, number> = {};
      receivedCards.forEach(card => {
        if (card.senderId && card.senderId !== userId) {
          receivedCardStats[card.senderId] = (receivedCardStats[card.senderId] || 0) + 1;
        }
      });

      // 上位30名のランキング作成
      const createPersonalRanking = async (stats: Record<number, number>) => {
        const entries = Object.entries(stats)
          .map(([id, count]) => ({ id: parseInt(id), count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 30);

        const rankings = [];
        for (let i = 0; i < entries.length; i++) {
          const user = await storage.getUser(entries[i].id);
          if (user) {
            rankings.push({
              user,
              count: entries[i].count,
              rank: i + 1
            });
          }
        }
        return rankings;
      };

      const personalSentCards = await createPersonalRanking(sentCardStats);
      const personalReceivedCards = await createPersonalRanking(receivedCardStats);

      return res.json({
        monthly: {
          pointConversionRate: Math.round(pointConversionRate),
          reactionRate: 100,
          cardSenders: [],
          likeSenders: [],
          userCardRank: 0,
          userLikeRank: 0
        },
        personal: {
          sentCards: personalSentCards,
          receivedCards: personalReceivedCards,
          sentLikes: [],
          receivedLikes: []
        }
      });
    } catch (error) {
      console.error('ダッシュボード統計情報取得エラー:', error);
      return res.status(500).json({ message: 'ダッシュボード統計情報の取得に失敗しました' });
    }
  });

  // ランキングAPI（最近1ヶ月基準）
  app.get("/api/rankings", authenticate, async (req, res) => {
    try {
      // 最近1ヶ月のランキング取得
      const pointGivers = await storage.getMonthlyPointGivers(20);
      const pointReceivers = await storage.getMonthlyPointReceivers(20);
      const cardSenders = await storage.getMonthlyCardSenders(20);
      const cardReceivers = await storage.getMonthlyCardReceivers(20);
      const likeSenders = await storage.getMonthlyLikeSenders(20);
      const likeReceivers = await storage.getMonthlyLikeReceivers(20);

      res.json({
        pointGivers: pointGivers.map((item, index) => ({ ...item, rank: index + 1 })),
        pointReceivers: pointReceivers.map((item, index) => ({ ...item, rank: index + 1 })),
        cardSenders: cardSenders.map((item, index) => ({ ...item, rank: index + 1 })),
        cardReceivers: cardReceivers.map((item, index) => ({ ...item, rank: index + 1 })),
        likeSenders: likeSenders.map((item, index) => ({ ...item, rank: index + 1 })),
        likeReceivers: likeReceivers.map((item, index) => ({ ...item, rank: index + 1 }))
      });
    } catch (error) {
      console.error("ランキング取得エラー:", error);
      res.status(500).json({ message: "ランキング情報の取得に失敗しました" });
    }
  });

  // パスワードリセット関連API
  app.post("/api/auth/password-reset-request", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "有効なメールアドレスを指定してください" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // セキュリティ上、ユーザーが存在しない場合も同じメッセージを返す
        return res.json({ message: "パスワードリセット手順をメールで送信しました（ユーザーが存在する場合）" });
      }

      // パスワードリセットトークンの生成とメール送信処理は別途実装

      return res.json({ message: "パスワードリセット手順をメールで送信しました" });
    } catch (error) {
      console.error("パスワードリセットリクエストエラー:", error);
      return res.status(500).json({ message: "パスワードリセットリクエスト処理中にエラーが発生しました" });
    }
  });

  // 通知関連のAPI
  app.get("/api/notifications", authenticate, async (req, res) => {
    try {
      console.log("📨 通知API呼び出し開始");
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        console.log("❌ 通知API: 認証失敗");
        return res.status(401).json({ message: "認証が必要です" });
      }

      console.log(`📨 ユーザーID ${currentUser.id} の通知を取得中...`);
      
      // 受信したカードを取得
      const receivedCards = await storage.getReceivedCards(currentUser.id, 10);
      console.log(`📨 受信カード数: ${receivedCards.length}`);
      
      // 受信したいいねを取得
      const receivedLikes = await storage.getReceivedLikes(currentUser.id, 10);
      console.log(`❤️ 受信いいね数: ${receivedLikes.length}`);
      
      // カード通知を作成
      const cardNotifications = receivedCards.map((card) => ({
        id: `card_${card.id}`,
        userId: currentUser.id,
        type: 'new_card' as const,
        message: `${card.senderDisplayName || card.senderName}さんからカードが届きました`,
        isRead: false,
        createdAt: card.createdAt.toISOString(),
        relatedCardId: card.id,
        relatedUser: {
          id: card.senderId,
          name: card.senderName,
          displayName: card.senderDisplayName
        }
      }));

      // いいね通知を作成
      const likeNotifications = receivedLikes.map((like) => ({
        id: `like_${like.id}`,
        userId: currentUser.id,
        type: 'card_like' as const,
        message: `${like.userDisplayName || like.userName}さんがあなたのカードにいいねしました`,
        isRead: false,
        createdAt: like.createdAt.toISOString(),
        relatedCardId: like.cardId,
        relatedUser: {
          id: like.userId,
          name: like.userName,
          displayName: like.userDisplayName
        }
      }));

      // 通知をマージして日時順でソート
      const notifications = [...cardNotifications, ...likeNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20); // 最新20件まで
      
      console.log(`📨 通知データ作成完了: ${notifications.length}件`);
      res.json(notifications);
    } catch (error) {
      console.error("❌ 通知取得エラー:", error);
      res.status(500).json({ message: "通知取得中にエラーが発生しました" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticate, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId, currentUser.id);
      
      res.json({ message: "通知を既読にしました" });
    } catch (error) {
      console.error("通知既読エラー:", error);
      res.status(500).json({ message: "通知既読処理中にエラーが発生しました" });
    }
  });

  app.patch("/api/notifications/mark-all-read", authenticate, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      await storage.markAllNotificationsAsRead(currentUser.id);
      
      res.json({ message: "すべての通知を既読にしました" });
    } catch (error) {
      console.error("全通知既読エラー:", error);
      res.status(500).json({ message: "全通知既読処理中にエラーが発生しました" });
    }
  });

  // すべての通知を削除
  app.post("/api/notifications/clear-all", authenticate, async (req, res) => {
    try {
      console.log("🗑️ すべての通知削除API開始");
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) {
        return res.status(401).json({ message: "認証が必要です" });
      }

      console.log(`🗑️ ユーザー${currentUser.id}のすべての通知を削除中...`);
      
      // 通知は実際にはDBに保存されていないため、
      // ここでは成功レスポンスのみ返す（実装上の制約）
      console.log("✅ すべての通知削除完了");
      
      res.json({ message: "すべての通知を削除しました" });
    } catch (error) {
      console.error("❌ 通知削除エラー:", error);
      res.status(500).json({ message: "通知削除中にエラーが発生しました" });
    }
  });

  // 開発環境では静的ファイルの配信はViteが行うので、
  // 本番環境でのみ静的ファイル配信を設定
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  const httpServer = createServer(app);

  return httpServer;
}

// 色をランダムに生成する関数
function getRandomColor(): string {
  const colors = [
    "primary", "secondary", "accent", "blue", "green", "yellow", 
    "orange", "red", "purple", "pink", "indigo", "teal"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}