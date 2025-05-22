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
import { 
  registerSchema, 
  loginSchema, 
  cardFormSchema, 
  profileUpdateSchema, 
  likeFormSchema
} from "@shared/schema";

// 認証ミドルウェア
const authenticate = async (req: Request, res: Response, next: Function) => {
  // セッションからユーザーIDを取得
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ message: "認証が必要です" });
  }

  try {
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
  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // セッション設定
  app.use(
    session({
      secret: process.env.SESSION_SECRET || randomUUID(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1週間
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

  // 認証関連API
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(data.email, data.password);
      
      if (!user) {
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }
      
      // ユーザーIDをセッションに保存
      req.session.userId = user.id;
      const { password, ...userWithoutPassword } = user;
      
      return res.json({ message: "ログインに成功しました", user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      console.error("ログインエラー:", error);
      return res.status(500).json({ message: "ログイン処理中にエラーが発生しました" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      console.log("リクエストボディ:", req.body);
      const data = registerSchema.parse(req.body);
      
      // メールアドレスの重複チェック
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        if (existingUser.password) {
          return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
        }
        
        // CSVインポートで登録済みの場合はパスワードをセットする
        const hashedPassword = hashPassword(data.password);
        
        // ユーザー情報を更新
        const updatedUser = await storage.updateUser(existingUser.id, {
          password: hashedPassword,
          passwordInitialized: true,
        });
        
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
      const hashedPassword = hashPassword(data.password);
      
      // ユーザー情報を更新
      const updatedUser = await storage.updateUser(preregisteredUser.id, {
        password: hashedPassword,
        passwordInitialized: true,
      });
      
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

  app.get("/api/auth/me", authenticate, (req, res) => {
    try {
      // パスワードフィールドを除外
      const user = (req as any).user;
      const { password, ...userWithoutPassword } = user;
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
        errors: [] as string[]
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

          // 既存ユーザーの確認
          const existingUser = await storage.getUserByEmail(employee.email);
          
          // 部署情報の設定（未設定の場合は"その他"）
          const department = employee.department || "その他";
          
          if (existingUser) {
            // 既存ユーザーの更新（パスワードは維持）
            await storage.updateUser(existingUser.id, {
              name: employee.name,
              displayName: employee.displayName || null,
              department,
              employeeId: employee.employeeId || null,
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
              password: null, // パスワードなし = 初回登録が必要
              passwordInitialized: false,
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

  // カード関連API
  app.get("/api/cards", authenticate, async (req, res) => {
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

  app.post("/api/cards", authenticate, async (req, res) => {
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

      // 複数ユーザー宛ての場合の処理
      if (data.additionalRecipients && data.additionalRecipients.length > 0) {
        // 追加の受信者へのポイント分配は既にストレージ層で処理される想定
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

  app.post("/api/likes", authenticate, async (req, res) => {
    try {
      const data = likeFormSchema.parse(req.body);
      const user = (req as any).user;

      // 既にいいねしているか確認
      const existingLike = await storage.getLike(data.cardId, user.id);
      if (existingLike) {
        return res.status(400).json({ message: "既にいいねしています" });
      }

      const like = await storage.createLike({
        cardId: data.cardId,
        userId: user.id,
        comment: data.comment || null,
        points: data.points || 0,
      });

      return res.status(201).json({ message: "いいねが作成されました", like });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      console.error("いいね作成エラー:", error);
      return res.status(500).json({ message: "いいねの作成に失敗しました" });
    }
  });

  // 統計情報API
  app.get("/api/stats", authenticate, async (req, res) => {
    try {
      // 仮の統計情報を返す
      return res.json({
        totalCards: 120,
        totalLikes: 342,
        topSenders: [
          { id: 1, name: "山田太郎", count: 15 },
          { id: 2, name: "佐藤次郎", count: 12 },
          { id: 3, name: "鈴木花子", count: 10 },
        ],
        topReceivers: [
          { id: 3, name: "鈴木花子", count: 18 },
          { id: 1, name: "山田太郎", count: 14 },
          { id: 4, name: "田中明", count: 11 },
        ],
      });
    } catch (error) {
      console.error("統計情報取得エラー:", error);
      return res.status(500).json({ message: "統計情報の取得に失敗しました" });
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