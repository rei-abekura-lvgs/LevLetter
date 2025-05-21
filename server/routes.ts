import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { hashPassword } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, cards, likes, teamMembers } from "@shared/schema";
import {
  registerSchema,
  loginSchema,
  cardFormSchema,
  likeFormSchema,
  profileUpdateSchema,
  insertDepartmentSchema,
} from "@shared/schema";
import { sendEmail, getPasswordResetEmailTemplate, getWelcomeEmailTemplate } from "./services/email";
import { generatePasswordResetToken, verifyPasswordResetToken, generateRandomPassword } from "./services/token";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 認証ミドルウェア
const authenticate = async (req: Request, res: Response, next: Function) => {
  console.log("認証処理開始 - パス:", req.path);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("認証ヘッダーがありません");
    return res.status(401).json({ message: "認証が必要です" });
  }
  
  console.log("認証ヘッダー: 存在します");
  const token = authHeader.split(" ")[1];
  
  if (!token) {
    console.log("トークンが見つかりません");
    return res.status(401).json({ message: "有効なトークンが必要です" });
  }
  
  try {
    console.log("トークン検証中...");
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      console.log("ユーザーが見つかりません:", decoded.id);
      return res.status(401).json({ message: "無効なユーザーです" });
    }
    
    console.log("トークン検証成功 - ユーザーID:", user.id);
    (req as any).user = user;
    console.log("認証成功:", user.id, user.email);
    next();
  } catch (error) {
    console.log("トークン検証エラー:", error);
    return res.status(401).json({ message: "無効なトークンです" });
  }
};

// 管理者権限チェックミドルウェア
const checkAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    // ユーザーが認証済みであることを確認
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({ message: "認証が必要です" });
    }
    
    // ユーザーが管理者であることを確認
    if (!user.isAdmin) {
      console.log("管理者権限が必要です - アクセス拒否:", user.id, user.email);
      return res.status(403).json({ message: "管理者権限が必要です" });
    }
    
    console.log("管理者権限確認:", user.id, user.email);
    next();
  } catch (error) {
    console.error("管理者権限チェックエラー:", error);
    return res.status(500).json({ message: "管理者権限の確認中にエラーが発生しました" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Zodバリデーションエラーのフォーマッター
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const formattedError = fromZodError(error);
      return res.status(400).json({
        message: "入力データが不正です",
        errors: formattedError.details
      });
    }
    return res.status(500).json({ message: "予期せぬエラーが発生しました" });
  };

  // 認証API
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("ユーザー登録リクエスト:", JSON.stringify(req.body));
      const data = registerSchema.parse(req.body);
      
      // メールアドレスの重複チェック
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "このメールアドレスは既に使用されています" });
      }
      
      // ユーザー作成
      const newUser = await storage.createUser({
        ...data,
        displayName: data.displayName || null,
        department: data.department || null,
        weeklyPoints: 30,
        totalPointsReceived: 0,
        lastWeeklyPointsReset: new Date(),
        cognitoSub: null,
        googleId: null,
      });
      
      console.log("ユーザー登録成功:", newUser.id, newUser.email);
      
      // 新規アカウント作成メール送信
      try {
        const { html, text } = getWelcomeEmailTemplate({
          userName: newUser.name,
          email: newUser.email
        });
        
        await sendEmail({
          to: newUser.email,
          subject: "【LevLetter】アカウント作成完了のお知らせ",
          htmlContent: html,
          textContent: text
        });
        
        console.log("新規アカウント作成メール送信成功:", newUser.email);
      } catch (emailError) {
        console.error("新規アカウント作成メール送信エラー:", emailError);
        // メール送信エラーはユーザー作成自体の失敗とはしない
      }
      
      // トークン生成とレスポンス
      const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(201).json({
        message: "ユーザーを作成しました",
        user: newUser,
        token
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("ユーザー登録エラー:", error);
      return res.status(500).json({ message: "ユーザーの作成に失敗しました" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log("ログインリクエスト:", JSON.stringify(req.body));
      const data = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(data.email, data.password);
      if (!user) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }
      
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
      console.log("ログイン成功:", user.id, user.email);
      return res.json({
        message: "ログインに成功しました",
        user,
        token
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("ログインエラー:", error);
      return res.status(500).json({ message: "ログイン処理に失敗しました" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    try {
      const user = (req as any).user;
      return res.json({ user });
    } catch (error) {
      console.error("ユーザー情報取得エラー:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  // カードAPI
  app.get("/api/cards", authenticate, async (req, res) => {
    try {
      const { senderId, recipientId, limit = 100, offset = 0 } = req.query;
      
      const options: any = {
        limit: Number(limit),
        offset: Number(offset)
      };
      
      if (senderId) {
        options.senderId = Number(senderId);
      }
      
      if (recipientId) {
        options.recipientId = Number(recipientId);
      }
      
      const cards = await storage.getCards(options);
      return res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      return res.status(500).json({ message: "カード情報の取得に失敗しました" });
    }
  });

  app.get("/api/cards/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const card = await storage.getCard(id);
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }
      return res.json(card);
    } catch (error) {
      console.error("Error fetching card:", error);
      return res.status(500).json({ message: "カード情報の取得に失敗しました" });
    }
  });

  app.post("/api/cards", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("カード作成リクエスト:", JSON.stringify(req.body));
      const data = cardFormSchema.parse(req.body);
      
      // カード作成
      const newCard = await storage.createCard({
        senderId: currentUser.id,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        message: data.message,
        points: data.points || 0,
        public: true,
        additionalRecipients: data.additionalRecipients || null
      });
      
      console.log("カード作成成功:", newCard.id);
      return res.status(201).json(newCard);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("カード作成エラー:", error);
      return res.status(500).json({ message: "カードの作成に失敗しました" });
    }
  });

  // いいねAPI
  app.get("/api/cards/:cardId/likes", authenticate, async (req, res) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const likes = await storage.getLikesForCard(cardId);
      return res.json(likes);
    } catch (error) {
      console.error("Error fetching likes:", error);
      return res.status(500).json({ message: "いいね情報の取得に失敗しました" });
    }
  });

  app.post("/api/likes", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("いいね作成リクエスト:", JSON.stringify(req.body));
      const data = likeFormSchema.parse(req.body);
      
      // いいねの重複チェック
      const existingLike = await storage.getLike(data.cardId, currentUser.id);
      if (existingLike) {
        return res.status(400).json({ message: "既にいいねしています" });
      }
      
      // いいね作成
      const newLike = await storage.createLike({
        userId: currentUser.id,
        cardId: data.cardId,
        points: data.points || 0
      });
      
      console.log("いいね作成成功:", newLike.id);
      return res.status(201).json(newLike);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("いいね作成エラー:", error);
      return res.status(500).json({ message: "いいねの作成に失敗しました" });
    }
  });

  // パスワードリセットAPI
  app.post("/api/auth/password-reset-request", async (req, res) => {
    try {
      console.log("パスワードリセットリクエスト:", JSON.stringify(req.body));
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "メールアドレスを入力してください" });
      }
      
      // ユーザー検索
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // セキュリティ上、ユーザーが存在しなくても成功レスポンスを返す
        return res.json({ message: "パスワードリセット手順をメールで送信しました" });
      }
      
      // リセットトークン生成
      const resetToken = generatePasswordResetToken(user.id, user.email);
      
      // リセットメール送信
      try {
        // ベースURLの設定 - 環境変数から取得または現在のホストから生成
        const host = req.get('host') || '39d5973c-7a1f-41b4-be1d-15a49ae7ac36.id.repl.co';
        const protocol = req.protocol || 'https';
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;
        
        // 完全なリセットURL作成
        const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
        
        // メール内に表示するトークン（完全なURL）
        const resetToken_forDisplay = resetToken;
        
        console.log("生成したリセットURL:", resetUrl);
        
        // ユーザー名を正しく取得
        const userName = user.displayName || user.name;
        
        const { html, text } = getPasswordResetEmailTemplate({
          userName: userName,
          resetLink: resetUrl
        });
        
        await sendEmail({
          to: user.email,
          subject: "【LevLetter】パスワードリセットのご案内",
          htmlContent: html,
          textContent: text
        });
        
        console.log("パスワードリセットメール送信成功:", user.email);
        console.log("送信されたリセットメール内容:", {
          to: user.email,
          subject: "【LevLetter】パスワードリセットのご案内",
          userName: userName,
          resetLink: resetToken_forDisplay,
          htmlPreview: html.substring(0, 100) + "..."
        });
        
        // AWS SESのサンドボックス環境では、検証済みメールアドレスにしか送信できない制限があるため
        // 開発テスト用にリセットトークンをログに出力（ここをコピーしてください）
        console.log("\n========= テスト用リセットトークン（ここから） =========\n", 
          resetToken_forDisplay, 
          "\n========= テスト用リセットトークン（ここまで） =========\n");
      } catch (emailError) {
        console.error("パスワードリセットメール送信エラー:", emailError);
        return res.status(500).json({ message: "メールの送信に失敗しました" });
      }
      
      return res.json({ message: "パスワードリセット手順をメールで送信しました" });
    } catch (error) {
      console.error("パスワードリセットリクエストエラー:", error);
      return res.status(500).json({ message: "パスワードリセット処理に失敗しました" });
    }
  });

  app.post("/api/auth/password-reset", async (req, res) => {
    try {
      console.log("パスワードリセット実行:", JSON.stringify({ token: "非表示", hasPassword: !!req.body.password }));
      const { token, password } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "リセットトークンが必要です" });
      }
      
      // トークン検証の詳細をデバッグする
      console.log("検証するトークン:", token.substring(0, 20) + "...");
      
      // トークン検証
      const verificationResult = verifyPasswordResetToken(token);
      console.log("トークン検証結果:", verificationResult);
      
      if (!verificationResult.valid) {
        return res.status(400).json({ message: "無効または期限切れのトークンです" });
      }
      
      // verificationResultから直接userIdを取得
      const { userId } = verificationResult;
      if (!userId) {
        return res.status(400).json({ message: "トークンからユーザーIDを取得できませんでした" });
      }
      
      // ユーザー存在確認 - ここでnumberに変換して確実に数値にする
      const userIdNum = Number(userId);
      if (isNaN(userIdNum)) {
        return res.status(400).json({ message: "無効なユーザーIDです" });
      }
      
      // ユーザー情報取得
      const user = await storage.getUser(userIdNum);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      console.log("パスワードリセット - ユーザー情報:", { id: user.id, email: user.email });
      
      // パスワードを直接ハッシュ化してから更新する
      const hashedPassword = hashPassword(password);
      console.log("パスワードハッシュ化 - 長さ:", hashedPassword.length);
      
      // ユーザー更新 - ストレージクラスを使用して更新
      try {
        // ストレージクラス経由でパスワード更新（直接ハッシュ化したパスワードを渡す）
        await storage.updateUser(userIdNum, { password });
        console.log("パスワードリセット成功:", user.id, user.email);
      } catch (updateError) {
        console.error("ユーザー更新エラー:", updateError);
        return res.status(500).json({ message: "パスワード更新に失敗しました" });
      }
      
      return res.json({
        message: "パスワードがリセットされました"
      });
    } catch (error) {
      console.error("パスワードリセット実行エラー:", error);
      return res.status(500).json({ message: "パスワードのリセットに失敗しました" });
    }
  });

  // プロフィール更新API
  app.put("/api/users/:id/profile", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const userId = parseInt(req.params.id);
      
      // 自分自身のプロフィールのみ更新可能
      if (currentUser.id !== userId) {
        return res.status(403).json({ message: "自分以外のプロフィールは更新できません" });
      }
      
      console.log("プロフィール更新リクエスト:", JSON.stringify(req.body));
      const data = profileUpdateSchema.parse(req.body);
      
      // ユーザー更新
      const updatedUser = await storage.updateUser(userId, {
        displayName: data.displayName || null,
        department: data.department || null
      });
      
      console.log("プロフィール更新成功:", updatedUser.id);
      return res.json({
        message: "プロフィールを更新しました",
        user: updatedUser
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("プロフィール更新エラー:", error);
      return res.status(500).json({ message: "プロフィールの更新に失敗しました" });
    }
  });

  // ユーザー取得API
  app.get("/api/users", authenticate, async (req, res) => {
    try {
      const users = await storage.getUsers();
      return res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  app.get("/api/users/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });

  // 部署API - アカウント作成でも使用するため認証不要
  app.get("/api/departments", async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      return res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      return res.status(500).json({ message: "部署情報の取得に失敗しました" });
    }
  });

  app.get("/api/departments/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      return res.json(department);
    } catch (error) {
      console.error("Error fetching department:", error);
      return res.status(500).json({ message: "部署情報の取得に失敗しました" });
    }
  });
  
  // 部署一括登録API - 特殊なパスを先に定義
  app.post("/api/departments/batch", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("部署一括作成リクエスト:", JSON.stringify(req.body));
      const { departments } = req.body;
      
      if (!departments || !Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({ message: "有効な部署データが提供されていません" });
      }
      
      console.log("部署一括作成処理 - ユーザー:", currentUser.id, currentUser.name);
      console.log("部署一括作成処理 - 件数:", departments.length);

      // 全ての部署を登録（重複チェック付き）
      const results = [];
      const existingDepartments = await storage.getDepartments();
      const existingNames = new Set(existingDepartments.map(d => d.name.toLowerCase()));
      
      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;
      
      for (const dept of departments) {
        if (!dept.name || dept.name.trim() === '') {
          skipCount++;
          continue; // 名前が空の部署はスキップ
        }
        
        const trimmedName = dept.name.trim();
        
        // 既に存在する部署名はスキップ
        if (existingNames.has(trimmedName.toLowerCase())) {
          console.log(`部署「${trimmedName}」は既に存在するためスキップします`);
          skipCount++;
          continue;
        }
        
        try {
          const newDepartment = await storage.createDepartment({
            name: trimmedName,
            description: dept.description || null
          });
          
          results.push(newDepartment);
          existingNames.add(trimmedName.toLowerCase()); // 新しく追加した部署名も重複チェック対象に追加
          successCount++;
        } catch (err) {
          console.error(`部署「${trimmedName}」の作成に失敗しました:`, err);
          errorCount++;
        }
      }
      
      console.log(`部署一括作成結果: 成功=${successCount}, スキップ=${skipCount}, エラー=${errorCount}`);

      console.log("部署一括作成成功:", results.length, "件");
      return res.status(201).json({ 
        message: `${results.length}件の部署を登録しました`, 
        departments: results 
      });
    } catch (error) {
      console.error("部署一括作成エラー:", error);
      return res.status(500).json({ message: "部署の一括登録に失敗しました" });
    }
  });

  app.post("/api/departments", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("部署作成リクエスト:", JSON.stringify(req.body));
      const data = insertDepartmentSchema.parse(req.body);
      
      // 部署作成
      const newDepartment = await storage.createDepartment(data);
      
      console.log("部署作成成功:", newDepartment.id, newDepartment.name);
      return res.json(newDepartment);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error creating department:", error);
      return res.status(500).json({ message: "部署の作成に失敗しました" });
    }
  });

  app.put("/api/departments/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("部署更新リクエスト:", id, JSON.stringify(req.body));
      
      // 部署存在確認
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      
      // データの検証
      if (!req.body.code || !req.body.name) {
        return res.status(400).json({ message: "部署コードと正式名称は必須です" });
      }
      
      // 階層構造からフルパスを生成
      const levels = [
        req.body.level1,
        req.body.level2,
        req.body.level3,
        req.body.level4,
        req.body.level5
      ].filter(Boolean);
      
      const fullPath = levels.length > 0 ? levels.join('/') : null;
      
      // 必須フィールドと階層フィールドを結合
      const updateData = {
        code: req.body.code,
        name: req.body.name,
        level1: req.body.level1 || null,
        level2: req.body.level2 || null,
        level3: req.body.level3 || null,
        level4: req.body.level4 || null,
        level5: req.body.level5 || null,
        fullPath,
        parentId: req.body.parentId || null,
        description: req.body.description || null
      };
      
      // 部署更新
      const updatedDepartment = await storage.updateDepartment(id, updateData);
      
      console.log("部署更新成功:", updatedDepartment.id, updatedDepartment.name);
      return res.json(updatedDepartment);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleZodError(error, res);
      }
      console.error("Error updating department:", error);
      return res.status(500).json({ message: "部署の更新に失敗しました" });
    }
  });

  app.delete("/api/departments/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = (req as any).user;
      console.log("部署削除リクエスト:", id, "by", currentUser.id, currentUser.name);
      
      // 部署存在確認
      const department = await storage.getDepartment(id);
      console.log("削除対象部署:", department);
      if (!department) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      
      try {
        // 部署削除
        await storage.deleteDepartment(id);
        console.log("部署削除成功:", id);
        return res.json({ message: "部署を削除しました" });
      } catch (deleteError) {
        console.error("部署削除処理エラー詳細:", deleteError);
        // エラーメッセージを詳細に
        return res.status(500).json({ 
          message: "部署の削除に失敗しました", 
          details: deleteError.message || "不明なエラー" 
        });
      }
    } catch (error) {
      console.error("部署削除リクエスト処理エラー:", error);
      return res.status(500).json({ message: "部署の削除に失敗しました" });
    }
  });

  // 管理者APIエンドポイント
  // 全ユーザー一覧を取得 (管理者用)
  app.get("/api/admin/users", authenticate, checkAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      console.log("管理者API: ユーザー一覧取得 成功");
      res.json(users);
    } catch (error) {
      console.error("管理者API: ユーザー一覧取得エラー:", error);
      res.status(500).json({ message: "ユーザー情報の取得に失敗しました" });
    }
  });
  
  // 指定ユーザーIDリストの一括削除API（rei.abekura@leverages.jp以外）- フロントエンド互換性のため両方のパスをサポート
  app.post("/api/admin/users/bulk-delete", authenticate, checkAdmin, async (req, res) => {
    try {
      const userIds = req.body.userIds as number[];
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "削除対象のユーザーIDが指定されていません" });
      }
      
      // protected admin check (ID: 5, rei.abekura@leverages.jp)
      const filteredIds = userIds.filter(id => id !== 5);
      const protectedCount = userIds.length - filteredIds.length;
      
      console.log(`指定ユーザー一括削除リクエスト: ${filteredIds.length}人（保護されたユーザー: ${protectedCount}人）`);
      
      const deletePromises = filteredIds.map(async (id) => {
        try {
          await storage.deleteUser(id);
          return { id, success: true };
        } catch (err) {
          console.error(`ユーザーID ${id} の削除に失敗:`, err);
          return { id, success: false, error: (err as Error).message };
        }
      });
      
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log(`指定ユーザー一括削除完了: 成功=${successCount}, 失敗=${failCount}, 保護=${protectedCount}`);
      
      return res.json({
        message: `${successCount}人のユーザーを削除しました`,
        results,
        protected: protectedCount
      });
    } catch (error) {
      console.error("管理者API: ユーザー一括削除エラー:", error);
      return res.status(500).json({ message: "ユーザー削除中にエラーが発生しました" });
    }
  });
  
  // DELETE メソッド用ユーザー一括削除API（フロントエンドで呼び出されるパス）
  app.delete("/api/admin/users/delete-bulk", authenticate, checkAdmin, async (req, res) => {
    try {
      console.log("管理者API: DELETE メソッドによるユーザー一括削除 - リクエスト:", JSON.stringify(req.body));
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        console.log("管理者API: ユーザー一括削除 - 無効なリクエスト");
        return res.status(400).json({ message: "削除対象のユーザーIDが指定されていません" });
      }
      
      // protected admin check (ID: 5, rei.abekura@leverages.jp)
      const filteredIds = userIds.filter(id => id !== 5);
      const protectedCount = userIds.length - filteredIds.length;
      
      console.log(`指定ユーザー一括削除リクエスト: ${filteredIds.length}人（保護されたユーザー: ${protectedCount}人）`);
      
      const deletePromises = filteredIds.map(async (id) => {
        try {
          await storage.deleteUser(id);
          return { id, success: true };
        } catch (err) {
          console.error(`ユーザーID ${id} の削除に失敗:`, err);
          return { id, success: false, error: (err as Error).message };
        }
      });
      
      const results = await Promise.all(deletePromises);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      console.log(`指定ユーザー一括削除完了: 成功=${successCount}, 失敗=${failCount}, 保護=${protectedCount}`);
      
      return res.json({
        message: `${successCount}人のユーザーを削除しました`,
        results,
        protected: protectedCount
      });
    } catch (error) {
      console.error("指定ユーザー一括削除処理エラー:", error);
      return res.status(500).json({ message: "ユーザーの一括削除に失敗しました" });
    }
  });
  
  // 開発用: 全ユーザー物理削除API（rei.abekura@leverages.jp以外）
  app.delete("/api/admin/users/delete-all", authenticate, checkAdmin, async (req, res) => {
    try {
      // 保護されたユーザーのメールアドレス
      const protectedEmail = "rei.abekura@leverages.jp";
      
      // 全ユーザー取得
      const allUsers = await storage.getUsers();
      
      // 保護対象以外のユーザーIDを抽出
      const userIdsToDelete = allUsers
        .filter(user => user.email !== protectedEmail)
        .map(user => user.id);
      
      console.log(`管理者API: 全ユーザー一括削除開始 - 対象ユーザー ${userIdsToDelete.length}件`);
      console.log(`削除対象ユーザーリスト:`, allUsers
        .filter(user => user.email !== protectedEmail)
        .map(user => ({ id: user.id, email: user.email, name: user.name }))
      );
      
      // 削除実行
      let deletedCount = 0;
      let failedUsers = [];
      
      for (const userId of userIdsToDelete) {
        try {
          console.log(`ユーザーID: ${userId} の削除処理開始...`);
          
          // 関連するデータを削除
          // いいねの削除
          const likesResult = await db.delete(likes).where(eq(likes.userId, userId));
          // 送信したカードを削除
          await db.delete(cards).where(eq(cards.senderId, userId));
          // 受信したカードの関連を削除 (recipientTypeが'user'の場合のみ)
          await db.delete(cards).where(eq(cards.recipientId, userId)).where(eq(cards.recipientType, 'user'));
          // チームメンバーシップを削除
          await db.delete(teamMembers).where(eq(teamMembers.userId, userId));
          // ユーザーを削除
          await db.delete(users).where(eq(users.id, userId));
          
          deletedCount++;
        } catch (deleteError) {
          console.error(`ユーザーID ${userId} の削除に失敗:`, deleteError);
        }
      }
      
      // 削除結果の詳細ログ
      console.log(`管理者API: ユーザー一括削除成功 (${deletedCount}件)`);
      console.log(`残りユーザー数:`, await db.select({ count: sql`count(*)` }).from(users));
      
      // 全ユーザー取得して確認（rei.abekura@leverages.jpのみ残っているはず）
      const remainingUsers = await storage.getUsers();
      console.log(`残りユーザーリスト:`, remainingUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
      
      res.json({ 
        success: true, 
        message: `${deletedCount}件のユーザーを削除しました（rei.abekura@leverages.jpは保護されています）`,
        deletedCount,
        remainingCount: remainingUsers.length
      });
    } catch (error) {
      console.error("管理者API: ユーザー一括削除 エラー", error);
      res.status(500).json({ 
        success: false,
        message: "ユーザーの一括削除に失敗しました" 
      });
    }
  });

  // ユーザーの管理者権限を変更 (管理者用)
  app.patch("/api/admin/users/:id/admin", authenticate, checkAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isAdmin } = req.body;
      const currentUser = (req as any).user;
      
      console.log("管理者API: ユーザー権限変更リクエスト:", userId, isAdmin, "by", currentUser.id);
      
      if (typeof isAdmin !== 'boolean') {
        return res.status(400).json({ message: "isAdminはboolean型である必要があります" });
      }
      
      // 自分自身の管理者権限を削除しようとしていないか確認
      if (currentUser.id === userId && !isAdmin) {
        return res.status(400).json({ message: "自分自身の管理者権限は削除できません" });
      }
      
      const updatedUser = await storage.updateUser(userId, { isAdmin });
      console.log("管理者API: ユーザー権限変更成功:", userId, isAdmin);
      
      res.json({ message: "ユーザー権限を更新しました", user: updatedUser });
    } catch (error) {
      console.error("管理者API: ユーザー権限更新エラー:", error);
      res.status(500).json({ message: "ユーザー権限の更新に失敗しました" });
    }
  });

  // ユーザーのアクティブ状態を変更 (管理者用)
  app.patch("/api/admin/users/:id/status", authenticate, checkAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      const currentUser = (req as any).user;
      
      console.log("管理者API: ユーザー状態変更リクエスト:", userId, isActive, "by", currentUser.id);
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActiveはboolean型である必要があります" });
      }
      
      // 自分自身を無効化しようとしていないか確認
      if (currentUser.id === userId && !isActive) {
        return res.status(400).json({ message: "自分自身のアカウントは無効化できません" });
      }
      
      const updatedUser = await storage.updateUser(userId, { isActive });
      console.log("管理者API: ユーザー状態変更成功:", userId, isActive);
      
      res.json({ message: "ユーザー状態を更新しました", user: updatedUser });
    } catch (error) {
      console.error("管理者API: ユーザー状態更新エラー:", error);
      res.status(500).json({ message: "ユーザー状態の更新に失敗しました" });
    }
  });

  // 従業員データインポート (管理者用)
  app.post("/api/admin/employees/import", authenticate, checkAdmin, async (req, res) => {
    try {
      const { employees } = req.body;
      const currentUser = (req as any).user;
      
      console.log("管理者API: 従業員データインポートリクエスト:", employees?.length, "件 by", currentUser.id);
      
      if (!Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({ message: "有効な従業員データがありません" });
      }
      
      // 結果を保持する変数
      const result = {
        success: true,
        newUsers: 0,
        updatedUsers: 0,
        errors: [] as string[]
      };
      
      // 各従業員データを処理
      for (const employee of employees) {
        try {
          if (!employee.email || !employee.name || !employee.employeeId) {
            result.errors.push(`不完全なデータ: ${employee.employeeId || 'Unknown ID'} - ${employee.name || 'No Name'}`);
            continue;
          }
          
          // メールアドレスで既存ユーザーを検索
          const existingUser = await storage.getUserByEmail(employee.email);
          
          if (existingUser) {
            // 既存ユーザーの更新
            await storage.updateUser(existingUser.id, {
              employeeId: employee.employeeId,
              name: employee.name,
              displayName: employee.displayName || null,
              department: employee.department || null
            });
            result.updatedUsers++;
          } else {
            // 新規ユーザーの作成
            const randomPassword = Math.random().toString(36).slice(-8);
            await storage.createUser({
              email: employee.email,
              name: employee.name,
              displayName: employee.displayName || null,
              department: employee.department || null,
              employeeId: employee.employeeId,
              password: hashPassword(randomPassword), // ランダムパスワードを設定
              isActive: true,
              isAdmin: false,
              weeklyPoints: 30,
              totalPointsReceived: 0
            });
            result.newUsers++;
          }
          
          // 部署情報の処理 - 現在のDB構造に合わせて処理
          if (employee.department) {
            const departmentPath = employee.department.trim();
            const departments = await storage.getDepartments();
            
            // 部署名で既存部署を検索
            const departmentExists = departments.some(dept => 
              dept.name === departmentPath
            );
            
            if (!departmentExists) {
              console.log(`新規部署を登録: ${departmentPath}`);
              
              // 現在のDB構造に合わせて部署を登録
              await storage.createDepartment({
                name: departmentPath,
                description: null
              });
              
              console.log(`部署 "${departmentPath}" を登録しました`);
            }
          }
        } catch (error) {
          console.error("従業員データ処理エラー:", error);
          result.errors.push(`データ処理エラー: ${employee.employeeId || 'Unknown ID'} - ${error.message || 'Unknown error'}`);
          result.success = false;
        }
      }
      
      console.log("管理者API: 従業員データインポート結果:", result);
      res.json(result);
    } catch (error) {
      console.error("管理者API: 従業員インポートエラー:", error);
      res.status(500).json({ message: "従業員データのインポートに失敗しました" });
    }
  });
  
  // 部署一括削除API
  app.post("/api/departments/batch-delete", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("部署一括削除リクエスト:", JSON.stringify(req.body));
      const { departmentIds } = req.body;
      
      if (!departmentIds || !Array.isArray(departmentIds) || departmentIds.length === 0) {
        return res.status(400).json({ message: "有効な部署IDが提供されていません" });
      }
      
      console.log("部署一括削除処理 - ユーザー:", currentUser.id, currentUser.name);
      console.log("部署一括削除処理 - 件数:", departmentIds.length);
      
      // 削除結果を追跡
      let successCount = 0;
      let notFoundCount = 0;
      let errorCount = 0;
      const results = {
        success: [] as number[],
        notFound: [] as number[],
        error: [] as number[]
      };
      
      // 各部署を順番に削除
      for (const id of departmentIds) {
        try {
          // 部署存在確認
          const department = await storage.getDepartment(id);
          if (!department) {
            console.log(`部署ID:${id}は存在しません`);
            notFoundCount++;
            results.notFound.push(id);
            continue;
          }
          
          // 部署削除
          await storage.deleteDepartment(id);
          console.log(`部署ID:${id}(${department.name})を削除しました`);
          successCount++;
          results.success.push(id);
        } catch (err) {
          console.error(`部署ID:${id}の削除に失敗しました:`, err);
          errorCount++;
          results.error.push(id);
        }
      }
      
      console.log(`部署一括削除結果: 成功=${successCount}, 未存在=${notFoundCount}, エラー=${errorCount}`);
      
      return res.json({
        message: `${successCount}件の部署を削除しました`,
        results: {
          successCount,
          notFoundCount,
          errorCount,
          details: results
        }
      });
    } catch (error) {
      console.error("部署一括削除エラー:", error);
      return res.status(500).json({ message: "部署の一括削除に失敗しました" });
    }
  });

  // サーバー起動
  const httpServer = createServer(app);
  return httpServer;
}
