import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  registerSchema,
  loginSchema,
  cardFormSchema,
  likeFormSchema,
  profileUpdateSchema,
  insertDepartmentSchema
} from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "levletter-development-secret";
const JWT_EXPIRES_IN = "7d";

// 認証ミドルウェア
const authenticate = async (req: Request, res: Response, next: Function) => {
  try {
    console.log("認証処理開始 - パス:", req.path);
    const authHeader = req.headers.authorization;
    console.log("認証ヘッダー:", authHeader ? "存在します" : "存在しません");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("認証失敗: Bearer トークンがありません");
      return res.status(401).json({ message: "認証が必要です" });
    }

    const token = authHeader.split(" ")[1];
    console.log("トークン検証中...");
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      console.log("トークン検証成功 - ユーザーID:", decoded.userId);
      
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        console.log("ユーザーが見つかりません:", decoded.userId);
        return res.status(401).json({ message: "無効なユーザーです" });
      }

      console.log("認証成功:", user.id, user.email);
      // リクエストにユーザー情報を追加
      (req as any).user = user;
      next();
    } catch (jwtError) {
      console.error("JWT検証エラー:", jwtError);
      return res.status(401).json({ message: "無効なトークンです" });
    }
  } catch (err) {
    console.error("認証全般エラー:", err);
    return res.status(401).json({ message: "認証に失敗しました" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // APIルート設定
  app.use("/api", (req, res, next) => {
    next();
  });

  // エラーハンドリングヘルパー
  const handleZodError = (error: unknown, res: Response) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ 
        message: "入力エラー", 
        errors: validationError.details 
      });
    }

    console.error("API Error:", error);
    return res.status(500).json({ message: "内部サーバーエラー" });
  };

  // 認証関連エンドポイント
  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("受信したリクエスト:", JSON.stringify(req.body));
      
      const data = registerSchema.parse(req.body);
      
      // メールアドレスの重複チェック
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
      }
      
      const user = await storage.createUser({
        email: data.email,
        name: data.name,
        password: data.password,
        department: data.department
      });

      // 新規アカウント作成時のメール送信
      try {
        // メール送信ユーティリティをインポート
        const { sendEmail, getWelcomeEmailTemplate } = await import('./services/email');
        
        // アプリのベースURL
        const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
        const loginLink = `${baseUrl}/login`;
        
        // メールテンプレート取得
        const { html, text } = getWelcomeEmailTemplate(
          user.name, 
          loginLink
        );
        
        // メール送信
        await sendEmail({
          to: user.email,
          subject: 'LevLetterへようこそ',
          htmlContent: html,
          textContent: text
        });
        
        console.log(`ウェルカムメール送信: ${user.email}`);
      } catch (emailError) {
        // メール送信エラーは致命的ではないのでログだけ
        console.error('ウェルカムメール送信エラー:', emailError);
      }

      // パスワードを除外
      const { password, ...userWithoutPassword } = user;

      // JWTトークンを生成
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("登録エラー:", error);
      return handleZodError(error, res);
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.authenticateUser(data.email, data.password);
      if (!user) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }

      // パスワードを除外
      const { password, ...userWithoutPassword } = user;

      // JWTトークンを生成
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      return res.json({ user: userWithoutPassword, token });
    } catch (error) {
      return handleZodError(error, res);
    }
  });

  app.get("/api/auth/me", authenticate, async (req, res) => {
    const user = (req as any).user;
    const { password, ...userWithoutPassword } = user;
    // レスポンス形式を登録・ログインエンドポイントと統一
    return res.json({ user: userWithoutPassword });
  });

  // ユーザー関連エンドポイント
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
      if (currentUser.id !== userId) {
        return res.status(403).json({ message: "自分のプロフィールのみ更新できます" });
      }

      const data = profileUpdateSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, data);
      const { password, ...userWithoutPassword } = updatedUser;

      return res.json(userWithoutPassword);
    } catch (error) {
      return handleZodError(error, res);
    }
  });

  // チーム関連エンドポイント
  app.get("/api/teams", authenticate, async (req, res) => {
    try {
      const teams = await storage.getTeams();
      return res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
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
      console.error("Error fetching team:", error);
      return res.status(500).json({ message: "チーム情報の取得に失敗しました" });
    }
  });

  // カード関連エンドポイント
  app.get("/api/cards", authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const senderId = req.query.senderId ? parseInt(req.query.senderId as string) : undefined;
      const recipientId = req.query.recipientId ? parseInt(req.query.recipientId as string) : undefined;

      const cards = await storage.getCards({ limit, offset, senderId, recipientId });
      return res.json(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
      return res.status(500).json({ message: "カード情報の取得に失敗しました" });
    }
  });

  app.post("/api/cards", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      console.log("カード作成リクエスト:", JSON.stringify(req.body));
      const data = cardFormSchema.parse(req.body);

      // リクエストデータのログ
      console.log("カード作成処理 - ユーザー:", currentUser.id, currentUser.name);
      console.log("カード作成処理 - 宛先:", data.recipientId, "タイプ:", data.recipientType);
      
      const recipientId = typeof data.recipientId === "string" 
        ? parseInt(data.recipientId) 
        : data.recipientId;
      
      const newCard = await storage.createCard({
        senderId: currentUser.id,
        recipientId: recipientId,
        recipientType: data.recipientType,
        message: data.message,
        points: data.points || 0, // ポイント情報を明示的に保存
        public: true, // MVPでは全て公開
        additionalRecipients: data.additionalRecipients || null
      });
      
      console.log("カード作成成功:", newCard.id);
      
      try {
        const cardWithRelations = await storage.getCard(newCard.id);
        console.log("カード関連情報取得成功:", cardWithRelations ? "データあり" : "データなし");
        return res.status(201).json(cardWithRelations);
      } catch (getCardError) {
        console.error("カード関連情報取得エラー:", getCardError);
        // 作成したカード情報だけでも返す
        return res.status(201).json(newCard);
      }
    } catch (error) {
      console.error("カード作成エラー:", error);
      return handleZodError(error, res);
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
      console.error("Error fetching card:", error);
      return res.status(500).json({ message: "カード情報の取得に失敗しました" });
    }
  });

  // パスワードリセット関連のエンドポイント
  // パスワードリセットリクエスト
  app.post("/api/auth/password-reset-request", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "メールアドレスは必須です" });
      }
      
      // メールアドレスでユーザーを検索
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // セキュリティ上の理由から、ユーザーが存在しない場合も成功を返す
        return res.json({ 
          success: true,
          message: "パスワードリセット用のメールを送信しました"
        });
      }
      
      try {
        // トークン生成ユーティリティとメール送信ユーティリティをインポート
        const { generatePasswordResetToken } = await import('./services/token');
        const { sendEmail, getPasswordResetEmailTemplate } = await import('./services/email');
        
        // リセットトークン生成
        const resetToken = generatePasswordResetToken(user.id, user.email);
        
        // アプリのベースURL
        const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
        
        // メールテンプレート取得
        const { html, text } = getPasswordResetEmailTemplate(
          user.name, 
          resetLink
        );
        
        // メール送信
        await sendEmail({
          to: user.email,
          subject: 'パスワードリセットのお知らせ',
          htmlContent: html,
          textContent: text
        });
        
        console.log(`パスワードリセットメール送信: ${user.email}`);
      } catch (emailError) {
        // メール送信エラーはログだけ
        console.error('パスワードリセットメール送信エラー:', emailError);
      }
      
      // セキュリティ上の理由から、常に成功を返す
      return res.json({ 
        success: true,
        message: "パスワードリセット用のメールを送信しました"
      });
    } catch (error) {
      console.error('パスワードリセットリクエストエラー:', error);
      return res.status(500).json({ message: "内部サーバーエラー" });
    }
  });
  
  // パスワードリセット実行
  app.post("/api/auth/password-reset", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          message: "トークンと新しいパスワードは必須です" 
        });
      }
      
      // 最低限のパスワード検証
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "パスワードは6文字以上である必要があります" 
        });
      }
      
      // トークン検証ユーティリティをインポート
      const { verifyPasswordResetToken } = await import('./services/token');
      
      // トークン検証
      const { valid, userId, email, error } = verifyPasswordResetToken(token);
      
      if (!valid || !userId || !email) {
        return res.status(400).json({ 
          message: error || "無効なトークンです" 
        });
      }
      
      // ユーザー検証
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      if (user.email !== email) {
        return res.status(400).json({ message: "トークンが無効です" });
      }
      
      // パスワード更新
      await storage.updateUser(userId, {
        password: newPassword  // hashPasswordはstorageクラス内で処理される前提
      });
      
      return res.json({ 
        success: true,
        message: "パスワードがリセットされました。ログインしてください。" 
      });
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return res.status(500).json({ message: "内部サーバーエラー" });
    }
  });

  // いいね関連エンドポイント
  app.post("/api/likes", authenticate, async (req, res) => {
    try {
      const currentUser = (req as any).user;
      const data = likeFormSchema.parse(req.body);

      // 自分のカードにはいいねできない
      const card = await storage.getCard(data.cardId);
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }

      if (card.sender.id === currentUser.id) {
        return res.status(400).json({ message: "自分のカードにはいいねできません" });
      }

      // すでにいいねしているか確認
      const existingLike = await storage.getLike(data.cardId, currentUser.id);
      if (existingLike) {
        return res.status(400).json({ message: "このカードにはすでにいいねしています" });
      }

      // ポイント残高の確認
      if (currentUser.weeklyPoints < data.points) {
        return res.status(400).json({ message: "ポイント残高が不足しています" });
      }

      const newLike = await storage.createLike({
        cardId: data.cardId,
        userId: currentUser.id,
        points: data.points
      });

      // 更新されたユーザー情報を取得
      const updatedUser = await storage.getUser(currentUser.id);
      const { password: _, ...userWithoutPassword } = updatedUser!;

      return res.status(201).json({
        like: newLike,
        user: userWithoutPassword
      });
    } catch (error) {
      return handleZodError(error, res);
    }
  });

  // 部署管理エンドポイント
  app.get("/api/departments", authenticate, async (req, res) => {
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

      // 全ての部署を登録
      const results = [];
      for (const dept of departments) {
        if (!dept.name || dept.name.trim() === '') {
          continue; // 名前が空の部署はスキップ
        }
        
        const newDepartment = await storage.createDepartment({
          name: dept.name.trim(),
          description: dept.description || null
        });
        
        results.push(newDepartment);
      }

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

      // 全ての部署を登録
      const results = [];
      for (const dept of departments) {
        if (!dept.name || dept.name.trim() === '') {
          continue; // 名前が空の部署はスキップ
        }
        
        const newDepartment = await storage.createDepartment({
          name: dept.name.trim(),
          description: dept.description || null
        });
        
        results.push(newDepartment);
      }

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
      
      // リクエストデータのログ
      console.log("部署作成処理 - ユーザー:", currentUser.id, currentUser.name);
      console.log("部署作成処理 - 名称:", data.name);
      
      const newDepartment = await storage.createDepartment({
        name: data.name,
        description: data.description
      });
      
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

      // 全ての部署を登録
      const results = [];
      for (const dept of departments) {
        if (!dept.name || dept.name.trim() === '') {
          continue; // 名前が空の部署はスキップ
        }
        
        const newDepartment = await storage.createDepartment({
          name: dept.name.trim(),
          description: dept.description || null
        });
        
        results.push(newDepartment);
      }

      console.log("部署一括作成成功:", results.length, "件");
      res.status(201).json({ 
        message: `${results.length}件の部署を登録しました`, 
        departments: results 
      });
    } catch (error) {
      console.error("部署一括作成エラー:", error);
      return res.status(500).json({ message: "部署の一括登録に失敗しました" });
    }
  });

  app.put("/api/departments/:id", authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = (req as any).user;
      console.log("部署更新リクエスト:", id, JSON.stringify(req.body));
      const data = insertDepartmentSchema.parse(req.body);
      
      // 部署の存在確認
      const existingDepartment = await storage.getDepartment(id);
      if (!existingDepartment) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      
      const updatedDepartment = await storage.updateDepartment(id, {
        name: data.name,
        description: data.description
      });
      
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
      
      // 部署の存在確認
      const existingDepartment = await storage.getDepartment(id);
      if (!existingDepartment) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      
      await storage.deleteDepartment(id);
      console.log("部署削除成功:", id);
      return res.json({ message: "部署を削除しました" });
    } catch (error) {
      console.error("Error deleting department:", error);
      return res.status(500).json({ message: "部署の削除に失敗しました" });
    }
  });

  return httpServer;
}
