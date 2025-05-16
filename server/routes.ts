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
  profileUpdateSchema
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
    return res.json(userWithoutPassword);
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
      const data = cardFormSchema.parse(req.body);

      const newCard = await storage.createCard({
        senderId: currentUser.id,
        recipientId: typeof data.recipientId === "string" 
          ? parseInt(data.recipientId) 
          : data.recipientId,
        recipientType: data.recipientType,
        message: data.message,
        public: true // MVPでは全て公開
      });

      const cardWithRelations = await storage.getCard(newCard.id);
      return res.status(201).json(cardWithRelations);
    } catch (error) {
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

  return httpServer;
}
