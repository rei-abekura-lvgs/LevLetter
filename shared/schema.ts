import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ユーザーテーブル
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  department: text("department"), // 旧形式の部署情報（後方互換性のため保持）
  // 6段階組織階層情報
  organizationLevel1: text("organization_level1"), // レベル1: 会社
  organizationLevel2: text("organization_level2"), // レベル2: 本部
  organizationLevel3: text("organization_level3"), // レベル3: 部
  organizationLevel4: text("organization_level4"), // レベル4: グループ
  organizationLevel5: text("organization_level5"), // レベル5: チーム
  organizationLevel6: text("organization_level6"), // レベル6: ユニット
  avatarColor: text("avatar_color").notNull().default("primary-500"),
  customAvatarUrl: text("custom_avatar_url"), // カスタムアバター画像のURL
  weeklyPoints: integer("weekly_points").notNull().default(500), // 今週の利用可能ポイント
  totalPointsReceived: integer("total_points_received").notNull().default(0), // 累計獲得ポイント
  weeklyPointsReceived: integer("weekly_points_received").notNull().default(0), // 今週の獲得ポイント
  lastWeeklyPointsReset: timestamp("last_weekly_points_reset"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  password: text("password"),
  passwordInitialized: boolean("password_initialized").notNull().default(false),
  cognitoSub: text("cognito_sub").unique(),
  googleId: text("google_id").unique(),
  employeeId: text("employee_id"), // 従業員番号（既存ユーザーはnull許容）
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
  hidden: boolean("hidden").notNull().default(false), // 管理者による非表示設定
  // 複数の受信者を保存するためのJSON形式のリスト (ID のみ)
  additionalRecipients: jsonb("additional_recipients").$type<number[]>()
});

// いいねテーブル
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cards.id),
  userId: integer("user_id").notNull().references(() => users.id),
  points: integer("points").notNull().default(0), // デフォルト値を0に設定
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// 6階層組織構造テーブル（会社・本部・部・グループ・チーム・ユニット）
export const organizationHierarchy = pgTable("organization_hierarchy", {
  id: serial("id").primaryKey(),
  level: integer("level").notNull(), // 1:会社, 2:本部, 3:部, 4:グループ, 5:チーム, 6:ユニット
  name: text("name").notNull(),
  code: text("code"), // 組織コード
  parentId: integer("parent_id").references(() => organizationHierarchy.id), // 親組織への参照
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// ユーザー部署関連テーブル（複数部署対応）
export const userDepartments = pgTable("user_departments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizationHierarchy.id),
  isPrimary: boolean("is_primary").notNull().default(false), // 主たる所属部署
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// 部署テーブル（後方互換性のため残す）
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 正式名称 (例: "情報システム部")
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

// カードリアクションテーブル
export const cardReactions = pgTable("card_reactions", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cards.id),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(), // 絵文字（👍, ❤️, 😊, 🎉, 👏など）
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// カードコメントテーブル
export const cardComments = pgTable("card_comments", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => cards.id),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
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

export const insertOrganizationSchema = createInsertSchema(organizationHierarchy).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertUserDepartmentSchema = createInsertSchema(userDepartments).omit({
  id: true,
  createdAt: true
});

export const insertCardReactionSchema = createInsertSchema(cardReactions).omit({
  id: true,
  createdAt: true
});

export const insertCardCommentSchema = createInsertSchema(cardComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// カスタムスキーマ
export const loginSchema = z.object({
  email: z.string().email({ message: "有効なメールアドレスを入力してください" }),
  password: z.string().min(6, { message: "パスワードは6文字以上で入力してください" })
});

export const registerSchema = insertUserSchema.pick({
  email: true,
  password: true
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

export const reactionFormSchema = z.object({
  cardId: z.number(),
  emoji: z.string().min(1, { message: "絵文字を選択してください" })
});

export const commentFormSchema = z.object({
  cardId: z.number(),
  message: z.string().min(1, { message: "コメントを入力してください" }).max(500, { message: "コメントは500文字以内で入力してください" })
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(1, { message: "表示名を入力してください" }),
  department: z.string().nullable().optional(),
  customAvatarUrl: z.string().nullable().optional()
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
export type OrganizationHierarchy = typeof organizationHierarchy.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UserDepartment = typeof userDepartments.$inferSelect;
export type InsertUserDepartment = z.infer<typeof insertUserDepartmentSchema>;
export type CardReaction = typeof cardReactions.$inferSelect;
export type InsertCardReaction = z.infer<typeof insertCardReactionSchema>;
export type CardComment = typeof cardComments.$inferSelect;
export type InsertCardComment = z.infer<typeof insertCardCommentSchema>;

// カスタム型
export type CardWithRelations = Card & {
  sender: User;
  recipient: User | Team;
  additionalRecipientUsers?: User[]; // 追加の受信者
  likes: Array<Like & { user: User }>;
  reactions?: Array<CardReaction & { user: User }>; // リアクション追加
  comments?: Array<CardComment & { user: User }>; // コメント追加
  totalPoints: number;
  tags?: string[]; // タグ配列を追加
};

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type ProfileUpdateRequest = z.infer<typeof profileUpdateSchema>;
export type CardFormRequest = z.infer<typeof cardFormSchema>;
export type LikeFormRequest = z.infer<typeof likeFormSchema>;
