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
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        
        const { html, text } = getPasswordResetEmailTemplate({
          userName: user.name,
          resetUrl
        });
        
        await sendEmail({
          to: user.email,
          subject: "【LevLetter】パスワードリセットのご案内",
          htmlContent: html,
          textContent: text
        });
        
        console.log("パスワードリセットメール送信成功:", user.email);
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
      
      // トークン検証
      const verificationResult = verifyPasswordResetToken(token);
      if (!verificationResult.valid) {
        return res.status(400).json({ message: "無効または期限切れのトークンです" });
      }
      
      const { id } = verificationResult.payload;
      
      // ユーザー存在確認
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }
      
      // 新しいパスワードを設定または自動生成
      let newPassword = password;
      let isAutoGenerated = false;
      
      if (!newPassword) {
        newPassword = generateRandomPassword();
        isAutoGenerated = true;
      }
      
      // ユーザー更新
      await storage.updateUser(user.id, { password: newPassword });
      
      console.log("パスワードリセット成功:", user.id, user.email, isAutoGenerated ? "自動生成" : "手動設定");
      
      return res.json({
        message: "パスワードがリセットされました",
        password: isAutoGenerated ? newPassword : undefined,
        isAutoGenerated
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
        name: data.name,
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

  // 部署API
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
      const data = insertDepartmentSchema.parse(req.body);
      
      // 部署存在確認
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      
      // 部署更新
      const updatedDepartment = await storage.updateDepartment(id, data);
      
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
      console.log("部署削除リクエスト:", id);
      
      // 部署存在確認
      const department = await storage.getDepartment(id);
      if (!department) {
        return res.status(404).json({ message: "部署が見つかりません" });
      }
      
      // 部署削除
      await storage.deleteDepartment(id);
      
      console.log("部署削除成功:", id);
      return res.json({ message: "部署を削除しました" });
    } catch (error) {
      console.error("Error deleting department:", error);
      return res.status(500).json({ message: "部署の削除に失敗しました" });
    }
  });

  // サーバー起動
  const httpServer = createServer(app);
  return httpServer;
}
