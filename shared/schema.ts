import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ユーザーテーブル
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  department: text("department"),
  avatarColor: text("avatar_color").notNull().default("primary-500"),
  weeklyPoints: integer("weekly_points").notNull().default(500),
  totalPointsReceived: integer("total_points_received").notNull().default(0),
  lastWeeklyPointsReset: timestamp("last_weekly_points_reset"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  password: text("password"),
  cognitoSub: text("cognito_sub").unique(),
  googleId: text("google_id").unique(),
  employeeId: text("employee_id").unique(), // 従業員番号（既存ユーザーはnull許容）
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// サンクスカードテーブル
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id), // 主要な受信者
  recipientType: text("recipient_type").notNull().default("user"), // "user" or "team"
  message: text("message").notNull(),
  points: integer("points").notNull().default(0), // 送信ポイント（0-140）
  createdAt: timestamp("created_at").defaultNow().notNull(),
  public: boolean("public").notNull().default(true),
  // 複数の受信者を保存するためのJSON形式のリスト (ID のみ)
  additionalRecipients: jsonb("additional_recipients").$type<number[]>()
});

// いいねテーブル
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cards.id),
  userId: integer("user_id").notNull().references(() => users.id),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// 部署テーブル用IDの型を定義
const departmentId = serial("id").primaryKey();

// 部署テーブル
export const departments = pgTable("departments", {
  id: departmentId,
  code: text("code").notNull().unique(), // 部署コード (例: "IT" など)
  name: text("name").notNull().unique(), // 正式名称 (例: "情報システム部")
  level1: text("level1").notNull().default(""), // 第1階層 (例: "全社")
  level2: text("level2").notNull().default(""), // 第2階層 (例: "技術本部")
  level3: text("level3").notNull().default(""), // 第3階層 (例: "システム統括部")
  level4: text("level4").notNull().default(""), // 第4階層 (例: "情報システム部")
  level5: text("level5").notNull().default(""), // 第5階層 (例: "インフラチーム")
  fullPath: text("full_path").notNull().default(""), // 完全パス (例: "全社/技術本部/システム統括部/情報システム部/インフラチーム")
  parentId: integer("parent_id"), // 親部署のID
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// チームテーブル
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// チームメンバーシップテーブル
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isLeader: boolean("is_leader").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Zodスキーマ
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastWeeklyPointsReset: true,
  createdAt: true
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true
});

export const insertLikeSchema = createInsertSchema(likes).omit({
  id: true,
  createdAt: true
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true
});

// カスタムスキーマ
export const loginSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください" })
});

export const registerSchema = insertUserSchema.pick({
  email: true,
  name: true,
  password: true,
  department: true
}).extend({
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください" })
});

export const cardFormSchema = z.object({
  recipientId: z.number().or(z.string()),
  recipientType: z.enum(["user", "team"]),
  message: z.string().min(1, { message: "メッセージを入力してください" }).max(140, { message: "メッセージは140文字以内で入力してください" }),
  points: z.number().min(0).max(140).default(0),
  additionalRecipients: z.array(z.number()).optional()
});

export const likeFormSchema = z.object({
  cardId: z.number(),
  points: z.number().min(0).max(100)
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, { message: "表示名を入力してください" }),
  department: z.string().nullable().optional()
});

// 型定義
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

// カスタム型
export type CardWithRelations = Card & {
  sender: User;
  recipient: User | Team;
  additionalRecipientUsers?: User[]; // 追加の受信者
  likes: Array<Like & { user: User }>;
  totalPoints: number;
};

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ProfileUpdateRequest = z.infer<typeof profileUpdateSchema>;
export type CardFormRequest = z.infer<typeof cardFormSchema>;
export type LikeFormRequest = z.infer<typeof likeFormSchema>;
