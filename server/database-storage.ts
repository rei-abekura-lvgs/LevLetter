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
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import * as crypto from "crypto";

const DEFAULT_AVATAR_COLORS = [
  "primary-500", "secondary-500", "green-500", "yellow-500", 
  "blue-500", "indigo-500", "purple-500", "pink-500", "red-500"
];

function getRandomAvatarColor(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_AVATAR_COLORS.length);
  return DEFAULT_AVATAR_COLORS[randomIndex];
}

import { IStorage, hashPassword } from "./storage";

export class DatabaseStorage implements IStorage {
  // ユーザー関連
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async getUserByCognitoSub(cognitoSub: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.cognitoSub, cognitoSub));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // パスワードがある場合はハッシュ化
    if (insertUser.password) {
      insertUser.password = hashPassword(insertUser.password);
    }

    // アバターカラーがない場合はランダムに設定
    if (!insertUser.avatarColor) {
      insertUser.avatarColor = getRandomAvatarColor();
    }

    // displayNameが設定されていない場合はnameを使用
    if (!insertUser.displayName) {
      insertUser.displayName = insertUser.name;
    }

    // 挿入
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    // パスワードの更新がある場合はハッシュ化
    if (updates.password) {
      updates.password = hashPassword(updates.password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${id} not found`);
    }
    
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
    await db
      .update(users)
      .set({
        weeklyPoints: 500,
        lastWeeklyPointsReset: now
      });
  }

  // チーム関連
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamWithMembers(id: number): Promise<(Team & { members: User[] }) | undefined> {
    const team = await this.getTeam(id);
    if (!team) {
      return undefined;
    }

    const membershipsWithUsers = await db
      .select({
        teamMember: teamMembers,
        user: users
      })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, id))
      .innerJoin(users, eq(teamMembers.userId, users.id));

    return {
      ...team,
      members: membershipsWithUsers.map(item => item.user)
    };
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db
      .insert(teams)
      .values(insertTeam)
      .returning();
    
    return team;
  }

  async updateTeam(id: number, updates: Partial<Team>): Promise<Team> {
    const [updatedTeam] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();
    
    if (!updatedTeam) {
      throw new Error(`Team with ID ${id} not found`);
    }
    
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    // まず関連するチームメンバーを削除
    await db
      .delete(teamMembers)
      .where(eq(teamMembers.teamId, id));
    
    // チームを削除
    await db
      .delete(teams)
      .where(eq(teams.id, id));
  }

  // チームメンバー関連
  async getTeamMembers(teamId: number): Promise<Array<TeamMember & { user: User }>> {
    const results = await db
      .select({
        teamMember: teamMembers,
        user: users
      })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .innerJoin(users, eq(teamMembers.userId, users.id));
    
    return results.map(item => ({
      ...item.teamMember,
      user: item.user
    }));
  }

  async addTeamMember(insertTeamMember: InsertTeamMember): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamMembers)
      .values(insertTeamMember)
      .returning();
    
    return teamMember;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<void> {
    await db
      .delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
  }

  // 部署管理機能
  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(asc(departments.name));
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));
    
    return department;
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values(insertDepartment)
      .returning();
    
    return department;
  }

  async updateDepartment(id: number, updates: Partial<Department>): Promise<Department> {
    const [department] = await db
      .update(departments)
      .set(updates)
      .where(eq(departments.id, id))
      .returning();
    
    if (!department) {
      throw new Error(`部署が見つかりません: ${id}`);
    }
    
    return department;
  }

  async deleteDepartment(id: number): Promise<void> {
    const result = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning({ id: departments.id });
    
    if (result.length === 0) {
      throw new Error(`部署が見つかりません: ${id}`);
    }
  }

  // カード関連
  async getCards(options: { limit?: number; offset?: number; senderId?: number; recipientId?: number; } = {}): Promise<CardWithRelations[]> {
    // カードの基本情報を取得
    let query = db.select().from(cards);
    
    // フィルター適用
    if (options.senderId !== undefined) {
      query = query.where(eq(cards.senderId, options.senderId));
    }
    
    if (options.recipientId !== undefined) {
      query = query.where(eq(cards.recipientId, options.recipientId));
    }
    
    // 新しい順にソート
    query = query.orderBy(desc(cards.createdAt));
    
    // ページネーション
    if (options.offset !== undefined) {
      query = query.offset(options.offset);
    }
    
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    const cardsList = await query;
    
    // 関連データを取得して結合
    const result = await Promise.all(
      cardsList.map(async (card) => {
        const [sender] = await db
          .select()
          .from(users)
          .where(eq(users.id, card.senderId));
        
        let recipient;
        if (card.recipientType === "team") {
          [recipient] = await db
            .select()
            .from(teams)
            .where(eq(teams.id, card.recipientId));
        } else {
          [recipient] = await db
            .select()
            .from(users)
            .where(eq(users.id, card.recipientId));
        }
        
        const likesWithUsers = await db
          .select({
            like: likes,
            user: users
          })
          .from(likes)
          .where(eq(likes.cardId, card.id))
          .innerJoin(users, eq(likes.userId, users.id));
        
        const cardLikes = likesWithUsers.map(item => ({
          ...item.like,
          user: item.user
        }));
        
        const totalPoints = cardLikes.reduce((sum, like) => sum + like.points, 0);
        
        // 追加の受信者がいる場合はそのユーザー情報も取得
        let additionalRecipientUsers = null;
        if (card.additionalRecipients && card.additionalRecipients.length > 0) {
          additionalRecipientUsers = await Promise.all(
            card.additionalRecipients.map(async (userId) => {
              const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, userId));
              return user;
            })
          );
        }

        return {
          ...card,
          sender: sender!,
          recipient: recipient!,
          additionalRecipientUsers,
          likes: cardLikes,
          totalPoints
        };
      })
    );
    
    return result;
  }

  async getCard(id: number): Promise<CardWithRelations | undefined> {
    const [card] = await db
      .select()
      .from(cards)
      .where(eq(cards.id, id));
    
    if (!card) {
      return undefined;
    }
    
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, card.senderId));
    
    let recipient;
    if (card.recipientType === "team") {
      [recipient] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, card.recipientId));
    } else {
      [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.id, card.recipientId));
    }
    
    const likesWithUsers = await db
      .select({
        like: likes,
        user: users
      })
      .from(likes)
      .where(eq(likes.cardId, card.id))
      .innerJoin(users, eq(likes.userId, users.id));
    
    const cardLikes = likesWithUsers.map(item => ({
      ...item.like,
      user: item.user
    }));
    
    const totalPoints = cardLikes.reduce((sum, like) => sum + like.points, 0);
    
    // 追加の受信者がいる場合はそのユーザー情報も取得
    let additionalRecipientUsers = null;
    if (card.additionalRecipients && card.additionalRecipients.length > 0) {
      additionalRecipientUsers = await Promise.all(
        card.additionalRecipients.map(async (userId) => {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, userId));
          return user;
        })
      );
    }

    return {
      ...card,
      sender: sender!,
      recipient: recipient!,
      additionalRecipientUsers,
      likes: cardLikes,
      totalPoints
    };
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db
      .insert(cards)
      .values(insertCard)
      .returning();
    
    return card;
  }

  async deleteCard(id: number): Promise<void> {
    // まず関連するいいねを削除
    await db
      .delete(likes)
      .where(eq(likes.cardId, id));
    
    // カードを削除
    await db
      .delete(cards)
      .where(eq(cards.id, id));
  }

  // いいね関連
  async getLikesForCard(cardId: number): Promise<Array<Like & { user: User }>> {
    const results = await db
      .select({
        like: likes,
        user: users
      })
      .from(likes)
      .where(eq(likes.cardId, cardId))
      .innerJoin(users, eq(likes.userId, users.id));
    
    return results.map(item => ({
      ...item.like,
      user: item.user
    }));
  }

  async getLike(cardId: number, userId: number): Promise<Like | undefined> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.cardId, cardId),
          eq(likes.userId, userId)
        )
      );
    
    return like;
  }

  async createLike(insertLike: InsertLike): Promise<Like> {
    // 既存のいいねを確認
    const existingLike = await this.getLike(insertLike.cardId, insertLike.userId);
    if (existingLike) {
      throw new Error(`User ${insertLike.userId} has already liked card ${insertLike.cardId}`);
    }
    
    // いいねを追加
    const [like] = await db
      .insert(likes)
      .values(insertLike)
      .returning();
    
    // カードの受信者にポイント追加
    const card = await this.getCard(insertLike.cardId);
    if (card && card.recipientType === "user") {
      const recipient = await this.getUser(card.recipientId);
      if (recipient) {
        await db
          .update(users)
          .set({
            totalPointsReceived: recipient.totalPointsReceived + insertLike.points
          })
          .where(eq(users.id, card.recipientId));
      }
    }
    
    // 送信者のポイント残高を減らす
    const sender = await this.getUser(insertLike.userId);
    if (sender) {
      await db
        .update(users)
        .set({
          weeklyPoints: sender.weeklyPoints - insertLike.points
        })
        .where(eq(users.id, insertLike.userId));
    }
    
    return like;
  }

  async deleteLike(id: number): Promise<void> {
    const [like] = await db
      .select()
      .from(likes)
      .where(eq(likes.id, id));
    
    if (!like) {
      throw new Error(`Like with ID ${id} not found`);
    }
    
    // カードの受信者からポイントを差し引く
    const card = await this.getCard(like.cardId);
    if (card && card.recipientType === "user") {
      await db
        .update(users)
        .set({
          totalPointsReceived: users.totalPointsReceived - like.points
        })
        .where(eq(users.id, card.recipientId));
    }
    
    // 送信者のポイント残高を増やす
    await db
      .update(users)
      .set({
        weeklyPoints: users.weeklyPoints + like.points
      })
      .where(eq(users.id, like.userId));
    
    // いいねを削除
    await db
      .delete(likes)
      .where(eq(likes.id, id));
  }
}