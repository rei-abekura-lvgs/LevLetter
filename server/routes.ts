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
  console.log("🔐 認証チェック開始");
  console.log("🆔 リクエストURL:", req.method, req.path);
  console.log("🔑 セッションID:", req.sessionID);
  console.log("📋 セッション全体:", JSON.stringify(req.session, null, 2));
  
  // セッションからユーザーIDを取得
  const userId = req.session.userId;
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
      console.log("🔐 ログイン試行開始");
      console.log("📝 リクエストボディ:", JSON.stringify(req.body, null, 2));
      
      const data = loginSchema.parse(req.body);
      console.log("✅ バリデーション成功 - メール:", data.email);
      
      const user = await storage.authenticateUser(data.email, data.password);
      
      if (!user) {
        console.log("❌ 認証失敗 - ユーザーが見つからない:", data.email);
        return res.status(401).json({ message: "メールアドレスまたはパスワードが正しくありません" });
      }
      
      console.log("👤 認証成功 - ユーザー:", user.name, "(ID:", user.id, ")");
      
      // ユーザーIDをセッションに保存
      console.log("📊 セッション保存前:");
      console.log("  - セッションID:", req.sessionID);
      console.log("  - セッション内容:", JSON.stringify(req.session, null, 2));
      
      req.session.userId = user.id;
      console.log("💾 セッションにユーザーID設定:", user.id);
      
      // セッション保存を明示的に実行
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error("💥 セッション保存エラー:", err);
            reject(err);
          } else {
            console.log("✅ セッション保存成功!");
            console.log("📊 セッション保存後:");
            console.log("  - セッションID:", req.sessionID);
            console.log("  - セッション内容:", JSON.stringify(req.session, null, 2));
            resolve(null);
          }
        });
      });
      
      const { password, ...userWithoutPassword } = user;
      console.log("🎉 ログイン処理完了 - レスポンス送信");
      
      return res.json({ message: "ログインに成功しました", user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return handleZodError(error, res);
      }
      console.error("💥 ログインエラー:", error);
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
          
          // 部署情報の設定（新形式対応）
          let department, department1, department2, department3, department4, department5, department6;
          
          // 新しいCSV形式（階層が分割済み）の場合
          if (employee.所属階層１ || employee.所属階層２ || employee.所属階層３ || employee.所属階層４ || employee.所属階層５) {
            department1 = employee.所属階層１ || null;
            department2 = employee.所属階層２ || null;
            department3 = employee.所属階層３ || null;
            department4 = employee.所属階層４ || null;
            department5 = employee.所属階層５ || null;
            department6 = null; // 新形式では6階層目はなし
            
            // 表示用の統合部署名を作成
            const parts = [department1, department2, department3, department4, department5].filter(Boolean);
            department = parts.join('/') || "その他";
          } else {
            // 従来形式（スラッシュ区切り）の場合
            department = employee.department || "その他";
            const departmentParts = department.split('/').map((part: string) => part.trim());
            department1 = departmentParts[0] || null;
            department2 = departmentParts[1] || null;
            department3 = departmentParts[2] || null;
            department4 = departmentParts[3] || null;
            department5 = departmentParts[4] || null;
            department6 = departmentParts[5] || null;
          }
          
          if (existingUser) {
            // 既存ユーザーの更新（パスワードは維持）
            await storage.updateUser(existingUser.id, {
              name: employee.name,
              displayName: employee.displayName || employee.職場氏名 || null,
              department,
              department1,
              department2,
              department3,
              department4,
              department5,
              department6,
              employeeId: employee.employeeId || employee.社員番号 || null,
            });
            results.updatedUsers++;
          } else {
            // 新規ユーザーの作成（パスワードなし）
            await storage.createUser({
              email: employee.email,
              name: employee.name,
              displayName: employee.displayName || employee.職場氏名 || null,
              department,
              department1,
              department2,
              department3,
              department4,
              department5,
              department6,
              employeeId: employee.employeeId || employee.社員番号 || null,
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

  // カードにいいねを追加するAPI
  app.post("/api/cards/like", authenticate, async (req, res) => {
    try {
      const { cardId, points = 2 } = req.body;
      const currentUser = (req as any).user;

      if (!cardId || points !== 2) {
        return res.status(400).json({ message: "無効なリクエストです" });
      }

      // カードの存在確認
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "カードが見つかりません" });
      }

      // 自分のカードにはいいねできない
      if (card.senderId === currentUser.id) {
        return res.status(400).json({ message: "自分のカードにはいいねできません" });
      }

      // ポイント残高チェック
      if (currentUser.weeklyPoints < points) {
        return res.status(400).json({ message: "ポイント残高が不足しています" });
      }

      // 現在のユーザーがこのカードにいいねした総ポイント数を計算
      const userLikePoints = card.likes
        .filter(like => like.user.id === currentUser.id)
        .reduce((total, like) => total + (like.points || 2), 0);

      // 最大30ptまでいいねできる
      if (userLikePoints >= 30) {
        return res.status(400).json({ message: "いいね上限に達しました（30pt）" });
      }

      // いいね作成
      const like = await storage.createLike({
        cardId,
        userId: currentUser.id,
        points
      });

      // いいねした人のポイント消費（2pt）
      await storage.updateUser(currentUser.id, {
        weeklyPoints: currentUser.weeklyPoints - points
      });

      // 送信者に1pt付与
      const sender = await storage.getUser(card.senderId);
      if (sender) {
        await storage.updateUser(sender.id, {
          totalPointsReceived: sender.totalPointsReceived + 1
        });
      }

      // 受信者に1pt付与
      if (card.recipientType === "user") {
        const recipient = await storage.getUser(card.recipientId);
        if (recipient) {
          await storage.updateUser(recipient.id, {
            totalPointsReceived: recipient.totalPointsReceived + 1
          });
        }
      }

      // 追加受信者がいる場合も1ptずつ付与
      if (card.additionalRecipientUsers && card.additionalRecipientUsers.length > 0) {
        for (const additionalRecipient of card.additionalRecipientUsers) {
          await storage.updateUser(additionalRecipient.id, {
            totalPointsReceived: additionalRecipient.totalPointsReceived + 1
          });
        }
      }

      return res.status(201).json({ 
        message: "いいねしました！", 
        like,
        pointsConsumed: points,
        pointsAwarded: card.additionalRecipientUsers ? 1 + card.additionalRecipientUsers.length + 1 : 2
      });
    } catch (error) {
      console.error("いいね作成エラー:", error);
      return res.status(500).json({ message: "いいねの作成に失敗しました" });
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