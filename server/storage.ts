import {
  users, teams, cards, likes, teamMembers, departments,
  type User, type InsertUser,
  type Card, type InsertCard,
  type Like, type InsertLike,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type Department, type InsertDepartment,
  type CardWithRelations
} from "@shared/schema";
import * as crypto from "crypto";

const DEFAULT_AVATAR_COLORS = [
  "primary-500", "secondary-500", "green-500", "yellow-500", 
  "blue-500", "indigo-500", "purple-500", "pink-500", "red-500"
];

function getRandomAvatarColor(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length);
  return DEFAULT_AVATAR_COLORS[randomIndex];
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface IStorage {
  // ユーザー
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCognitoSub(cognitoSub: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  authenticateUser(email: string, password: string): Promise<User | null>;
  resetUserWeeklyPoints(): Promise<void>;
  deleteUser(id: number): Promise<void>; // 開発用：ユーザー物理削除
  deleteUser(id: number): Promise<void>; // 開発用：ユーザー物理削除

  // チーム
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  getTeamWithMembers(id: number): Promise<(Team & { members: User[] }) | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<Team>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // チームメンバー
  getTeamMembers(teamId: number): Promise<Array<TeamMember & { user: User }>>;
  addTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<void>;

  // 部署
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department>;
  deleteDepartment(id: number): Promise<void>;

  // カード
  getCards(options?: { limit?: number; offset?: number; senderId?: number; recipientId?: number; }): Promise<CardWithRelations[]>;
  getCard(id: number): Promise<CardWithRelations | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  deleteCard(id: number): Promise<void>;

  // いいね
  getLikesForCard(cardId: number): Promise<Array<Like & { user: User }>>;
  getLike(cardId: number, userId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private departments: Map<number, Department>;
  private cards: Map<number, Card>;
  private likes: Map<number, Like>;
  
  private userIdCounter: number;
  private teamIdCounter: number;
  private teamMemberIdCounter: number;
  private departmentIdCounter: number;
  private cardIdCounter: number;
  private likeIdCounter: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.departments = new Map();
    this.cards = new Map();
    this.likes = new Map();

    this.userIdCounter = 1;
    this.teamIdCounter = 1;
    this.teamMemberIdCounter = 1;
    this.departmentIdCounter = 1;
    this.cardIdCounter = 1;
    this.likeIdCounter = 1;

    // サンプルデータを追加
    this.initSampleData();
  }

  private initSampleData() {
    // サンプル部署
    const dept1 = this.createDepartment({
      name: "マーケティング部",
      description: "マーケティング戦略の立案と実行を担当"
    });

    const dept2 = this.createDepartment({
      name: "営業部",
      description: "顧客対応と販売促進活動を担当"
    });

    const dept3 = this.createDepartment({
      name: "人事部",
      description: "採用活動と社員教育を担当"
    });

    const dept4 = this.createDepartment({
      name: "開発部",
      description: "製品・サービスの開発と改善を担当"
    });

    const dept5 = this.createDepartment({
      name: "デザイン部",
      description: "UI/UXデザインとブランドイメージの維持を担当"
    });

    // サンプルユーザー
    const user1 = this.createUser({
      email: "yamada@example.com",
      name: "山田 太郎",
      displayName: "山田 太郎",
      department: dept1.name,
      password: "password123",
      avatarColor: "primary-500",
      weeklyPoints: 350,
      totalPointsReceived: 2450
    });

    const user2 = this.createUser({
      email: "satou@example.com",
      name: "佐藤 聡",
      displayName: "佐藤 聡",
      department: dept2.name,
      password: "password123",
      avatarColor: "secondary-500",
      weeklyPoints: 400,
      totalPointsReceived: 1850
    });

    const user3 = this.createUser({
      email: "suzuki@example.com",
      name: "鈴木 花子",
      displayName: "鈴木 花子",
      department: dept3.name,
      password: "password123",
      avatarColor: "green-500",
      weeklyPoints: 450,
      totalPointsReceived: 1200
    });

    const user4 = this.createUser({
      email: "tanaka@example.com",
      name: "田中 雄一",
      displayName: "田中 雄一",
      department: dept4.name,
      password: "password123",
      avatarColor: "blue-500",
      weeklyPoints: 500,
      totalPointsReceived: 980
    });

    // サンプルチーム
    const team1 = this.createTeam({
      name: "デザインチーム",
      description: "UI/UXデザインチーム"
    });

    // チームメンバー
    this.addTeamMember({
      teamId: team1.id,
      userId: user1.id,
      isLeader: true
    });

    this.addTeamMember({
      teamId: team1.id,
      userId: user3.id,
      isLeader: false
    });

    // サンプルカード
    const card1 = this.createCard({
      senderId: user2.id,
      recipientId: user1.id,
      recipientType: "user",
      message: "先日のプロジェクトミーティングでは的確なアドバイスをいただき、問題が迅速に解決しました。チームの皆さんも大変助かったと言っていました。ありがとうございました！",
      public: true
    });

    const card2 = this.createCard({
      senderId: user4.id,
      recipientId: team1.id,
      recipientType: "team",
      message: "急なデザイン変更にも迅速に対応していただき、プロジェクトの納期に間に合いました。クライアントからも高評価をいただいています。素晴らしいチームワークに感謝します！",
      public: true
    });

    const card3 = this.createCard({
      senderId: user3.id,
      recipientId: user2.id,
      recipientType: "user",
      message: "先日の会議で私の意見をしっかり聞いてくださり、建設的なフィードバックをいただいたおかげで、アイデアをさらに発展させることができました。聡さんのサポートに感謝しています。",
      public: true
    });

    // サンプルいいね
    this.createLike({
      cardId: card1.id,
      userId: user3.id,
      points: 100
    });

    this.createLike({
      cardId: card1.id,
      userId: user4.id,
      points: 80
    });

    this.createLike({
      cardId: card2.id,
      userId: user1.id,
      points: 100
    });

    this.createLike({
      cardId: card2.id,
      userId: user2.id,
      points: 75
    });

    this.createLike({
      cardId: card3.id,
      userId: user1.id,
      points: 90
    });

    this.createLike({
      cardId: card3.id,
      userId: user4.id,
      points: 68
    });
  }

  // ユーザー関連
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async getUserByCognitoSub(cognitoSub: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.cognitoSub === cognitoSub);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();

    // パスワードがある場合はハッシュ化
    let hashedPassword = undefined;
    if (insertUser.password) {
      hashedPassword = hashPassword(insertUser.password);
    }

    // アバターカラーがない場合はランダムに設定
    const avatarColor = insertUser.avatarColor || getRandomAvatarColor();

    const user: User = {
      id,
      email: insertUser.email,
      name: insertUser.name,
      displayName: insertUser.displayName || insertUser.name,
      department: insertUser.department || null,
      avatarColor,
      weeklyPoints: insertUser.weeklyPoints !== undefined ? insertUser.weeklyPoints : 500,
      totalPointsReceived: insertUser.totalPointsReceived || 0,
      lastWeeklyPointsReset: now,
      password: hashedPassword,
      cognitoSub: insertUser.cognitoSub || null,
      googleId: insertUser.googleId || null,
      createdAt: now
    };

    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    // パスワードの更新がある場合はハッシュ化
    if (updates.password) {
      updates.password = hashPassword(updates.password);
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const hashedPassword = hashPassword(password);
    return user.password === hashedPassword ? user : null;
  }

  async resetUserWeeklyPoints(): Promise<void> {
    const now = new Date();
    for (const [id, user] of this.users.entries()) {
      this.users.set(id, {
        ...user,
        weeklyPoints: 500,
        lastWeeklyPointsReset: now
      });
    }
  }

  // チーム関連
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamWithMembers(id: number): Promise<(Team & { members: User[] }) | undefined> {
    const team = await this.getTeam(id);
    if (!team) {
      return undefined;
    }

    const teamMemberships = Array.from(this.teamMembers.values())
      .filter(tm => tm.teamId === id);
    
    const members = await Promise.all(
      teamMemberships.map(async tm => {
        const user = await this.getUser(tm.userId);
        return user!;
      })
    );

    return {
      ...team,
      members
    };
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const now = new Date();

    const team: Team = {
      id,
      name: insertTeam.name,
      description: insertTeam.description || null,
      createdAt: now
    };

    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team> {
    const team = await this.getTeam(id);
    if (!team) {
      throw new Error(`Team with ID ${id} not found`);
    }

    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    if (!this.teams.has(id)) {
      throw new Error(`Team with ID ${id} not found`);
    }

    // チームメンバーシップも削除
    for (const [tmId, tm] of this.teamMembers.entries()) {
      if (tm.teamId === id) {
        this.teamMembers.delete(tmId);
      }
    }

    this.teams.delete(id);
  }

  // チームメンバー関連
  async getTeamMembers(teamId: number): Promise<Array<TeamMember & { user: User }>> {
    const members = Array.from(this.teamMembers.values())
      .filter(tm => tm.teamId === teamId);
    
    const result = await Promise.all(
      members.map(async member => {
        const user = await this.getUser(member.userId);
        return {
          ...member,
          user: user!
        };
      })
    );

    return result;
  }

  async addTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const id = this.teamMemberIdCounter++;
    const now = new Date();

    const teamMember: TeamMember = {
      id,
      teamId: insertTeamMember.teamId,
      userId: insertTeamMember.userId,
      isLeader: insertTeamMember.isLeader || false,
      createdAt: now
    };

    this.teamMembers.set(id, teamMember);
    return teamMember;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    for (const [id, tm] of this.teamMembers.entries()) {
      if (tm.teamId === teamId && tm.userId === userId) {
        this.teamMembers.delete(id);
        return;
      }
    }

    throw new Error(`Team member with teamId ${teamId} and userId ${userId} not found`);
  }

  // 部署管理機能
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.departmentIdCounter++;
    const now = new Date();
    
    const department: Department = {
      id,
      name: insertDepartment.name,
      description: insertDepartment.description || null,
      createdAt: now
    };

    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, updates: Partial<Department>): Promise<Department> {
    const department = this.departments.get(id);
    if (!department) {
      throw new Error(`部署が見つかりません: ${id}`);
    }
    
    const updatedDepartment = { ...department, ...updates };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<void> {
    if (!this.departments.delete(id)) {
      throw new Error(`部署が見つかりません: ${id}`);
    }
  }

  // カード関連
  async getCards(options: { limit?: number; offset?: number; senderId?: number; recipientId?: number; } = {}): Promise<CardWithRelations[]> {
    let cards = Array.from(this.cards.values());
    
    // フィルター適用
    if (options.senderId !== undefined) {
      cards = cards.filter(card => card.senderId === options.senderId);
    }
    
    if (options.recipientId !== undefined) {
      cards = cards.filter(card => card.recipientId === options.recipientId);
    }
    
    // 新しい順にソート
    cards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // ページネーション
    if (options.offset !== undefined) {
      cards = cards.slice(options.offset);
    }
    
    if (options.limit !== undefined) {
      cards = cards.slice(0, options.limit);
    }

    // 関連データを取得
    const result = await Promise.all(
      cards.map(async (card) => {
        const sender = await this.getUser(card.senderId);
        let recipient;
        
        if (card.recipientType === "team") {
          recipient = await this.getTeam(card.recipientId);
        } else {
          recipient = await this.getUser(card.recipientId);
        }

        // 追加の受信者情報がある場合、それらを取得
        let additionalRecipientUsers: User[] = [];
        if (card.additionalRecipients && card.additionalRecipients.length > 0) {
          additionalRecipientUsers = await Promise.all(
            card.additionalRecipients.map(id => this.getUser(id))
          ).then(users => users.filter(Boolean) as User[]);
        }

        const likes = await this.getLikesForCard(card.id);
        const totalPoints = likes.reduce((sum, like) => sum + like.points, 0);

        return {
          ...card,
          sender: sender!,
          recipient: recipient!,
          additionalRecipientUsers,
          likes,
          totalPoints
        };
      })
    );

    return result;
  }

  async getCard(id: number): Promise<CardWithRelations | undefined> {
    const card = this.cards.get(id);
    if (!card) {
      return undefined;
    }

    const sender = await this.getUser(card.senderId);
    let recipient;
    
    if (card.recipientType === "team") {
      recipient = await this.getTeam(card.recipientId);
    } else {
      recipient = await this.getUser(card.recipientId);
    }

    const likes = await this.getLikesForCard(card.id);
    const totalPoints = likes.reduce((sum, like) => sum + like.points, 0);

    // 追加の受信者情報がある場合、それらを取得
    let additionalRecipientUsers: User[] = [];
    if (card.additionalRecipients && card.additionalRecipients.length > 0) {
      additionalRecipientUsers = await Promise.all(
        card.additionalRecipients.map(id => this.getUser(id))
      ).then(users => users.filter(Boolean) as User[]);
    }

    return {
      ...card,
      sender: sender!,
      recipient: recipient!,
      additionalRecipientUsers,
      likes,
      totalPoints
    };
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = this.cardIdCounter++;
    const now = new Date();

    const card: Card = {
      id,
      senderId: insertCard.senderId,
      recipientId: insertCard.recipientId,
      recipientType: insertCard.recipientType || "user",
      message: insertCard.message,
      points: insertCard.points || 0, // ポイントを保存
      public: insertCard.public !== undefined ? insertCard.public : true,
      additionalRecipients: insertCard.additionalRecipients || null,
      createdAt: now
    };

    this.cards.set(id, card);
    return card;
  }

  async deleteCard(id: number): Promise<void> {
    if (!this.cards.has(id)) {
      throw new Error(`Card with ID ${id} not found`);
    }

    // カードに関連するいいねも削除
    for (const [likeId, like] of this.likes.entries()) {
      if (like.cardId === id) {
        this.likes.delete(likeId);
      }
    }

    this.cards.delete(id);
  }

  // いいね関連
  async getLikesForCard(cardId: number): Promise<Array<Like & { user: User }>> {
    const likes = Array.from(this.likes.values())
      .filter(like => like.cardId === cardId);

    const result = await Promise.all(
      likes.map(async like => {
        const user = await this.getUser(like.userId);
        return {
          ...like,
          user: user!
        };
      })
    );

    return result;
  }

  async getLike(cardId: number, userId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values())
      .find(like => like.cardId === cardId && like.userId === userId);
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    // 既存のいいねを確認
    const existingLike = await this.getLike(insertLike.cardId, insertLike.userId);
    if (existingLike) {
      throw new Error(`User ${insertLike.userId} has already liked card ${insertLike.cardId}`);
    }

    const id = this.likeIdCounter++;
    const now = new Date();

    const like: Like = {
      id,
      cardId: insertLike.cardId,
      userId: insertLike.userId,
      points: insertLike.points,
      createdAt: now
    };

    this.likes.set(id, like);

    // カードの受信者にポイント追加
    const card = await this.getCard(insertLike.cardId);
    if (card && card.recipientType === "user") {
      const recipient = await this.getUser(card.recipientId);
      if (recipient) {
        await this.updateUser(recipient.id, {
          totalPointsReceived: recipient.totalPointsReceived + insertLike.points
        });
      }
    } else if (card && card.recipientType === "team") {
      // チームの場合、全メンバーにポイントを分配
      const teamMembers = await this.getTeamMembers(card.recipientId);
      for (const member of teamMembers) {
        await this.updateUser(member.userId, {
          totalPointsReceived: member.user.totalPointsReceived + Math.floor(insertLike.points / teamMembers.length)
        });
      }
    }

    // 送信者のポイント残高を減らす
    const user = await this.getUser(insertLike.userId);
    if (user) {
      await this.updateUser(user.id, {
        weeklyPoints: Math.max(0, user.weeklyPoints - insertLike.points)
      });
    }

    return like;
  }

  async deleteLike(id: number): Promise<void> {
    if (!this.likes.has(id)) {
      throw new Error(`Like with ID ${id} not found`);
    }

    this.likes.delete(id);
  }
  
  // ユーザー物理削除（開発用）
  async deleteUser(id: number): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    console.log(`ユーザーID ${id} の削除を開始`);
    
    // 1. ユーザーに紐づくカードといいねを削除
    const userCardsToDelete: number[] = [];
    this.cards.forEach((card, cardId) => {
      if (card.senderId === id || card.recipientId === id) {
        userCardsToDelete.push(cardId);
      }
    });
    
    // カードに紐づくいいねを削除し、カード自体も削除
    for (const cardId of userCardsToDelete) {
      const cardLikesToDelete: number[] = [];
      this.likes.forEach((like, likeId) => {
        if (like.cardId === cardId) {
          cardLikesToDelete.push(likeId);
        }
      });
      
      // いいねを削除
      for (const likeId of cardLikesToDelete) {
        this.likes.delete(likeId);
      }
      
      // カードを削除
      this.cards.delete(cardId);
    }
    
    // 2. ユーザーが行ったいいねを削除
    const userLikesToDelete: number[] = [];
    this.likes.forEach((like, likeId) => {
      if (like.userId === id) {
        userLikesToDelete.push(likeId);
      }
    });
    
    for (const likeId of userLikesToDelete) {
      this.likes.delete(likeId);
    }
    
    // 3. チームメンバーシップを削除
    const teamMembershipsToDelete: number[] = [];
    this.teamMembers.forEach((member, memberId) => {
      if (member.userId === id) {
        teamMembershipsToDelete.push(memberId);
      }
    });
    
    for (const memberId of teamMembershipsToDelete) {
      this.teamMembers.delete(memberId);
    }
    
    // 4. ユーザーを削除
    this.users.delete(id);
    
    console.log(`ユーザーID ${id} の削除が完了しました`);
  }
}

// PostgreSQLデータベースを使用するストレージへ切り替え
import { DatabaseStorage } from "./database-storage";

// データベースストレージを使用（永続的ストレージ）
export const storage = new DatabaseStorage();
