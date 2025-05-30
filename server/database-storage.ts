import {
  users, teams, cards, likes, teamMembers, departments, organizationHierarchy, userDepartments,
  cardReactions, cardComments,
  type User, type InsertUser,
  type Card, type InsertCard,
  type Like, type InsertLike,
  type Team, type InsertTeam,
  type TeamMember, type InsertTeamMember,
  type Department, type InsertDepartment,
  type OrganizationHierarchy, type InsertOrganization,
  type UserDepartment, type InsertUserDepartment,
  type CardWithRelations,
  type CardReaction, type InsertCardReaction,
  type CardComment, type InsertCardComment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lt, ne, or, not, inArray } from "drizzle-orm";
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
  private db = db;
  
  // ユーザー物理削除（開発用）
  async deleteUser(id: number): Promise<void> {
    try {
      console.log(`ユーザーID ${id} の削除を開始`);
      
      // 処理前にユーザーが存在するか確認
      const userExists = await db.select().from(users).where(eq(users.id, id));
      if (userExists.length === 0) {
        console.log(`ユーザーID ${id} は既に存在しません`);
        return; // ユーザーが存在しない場合は成功として扱う
      }
      
      console.log(`ユーザーID ${id} の関連データ削除開始: ${userExists[0].email}`);
      
      try {
        // まず、カード削除のために必要なクエリを実行
        
        // 1. このユーザーに関連する全てのカードIDを取得
        console.log(`  - ユーザーID ${id} に関連するカードIDを取得中...`);
        
        // 受信したカードのID
        const recipientCardIds = await db.select({ id: cards.id }).from(cards)
          .where(and(
            eq(cards.recipientId, id),
            eq(cards.recipientType, 'user')
          ));
          
        // 送信したカードのID
        const senderCardIds = await db.select({ id: cards.id }).from(cards)
          .where(eq(cards.senderId, id));
        
        // すべてのカードIDを結合
        const allCardIds = [
          ...recipientCardIds.map(c => c.id),
          ...senderCardIds.map(c => c.id)
        ];
        
        console.log(`  - 削除対象カード: ${allCardIds.length}件`);
        
        // 2. これらのカードに関連するいいねを一括削除
        if (allCardIds.length > 0) {
          console.log(`  - カードに関連するいいねを削除中...`);
          try {
            // SQLでIN句を使用して一括削除
            await db.delete(likes).where(sql`"card_id" IN (${allCardIds.join(',')})`);
            console.log(`  - カードに関連するいいねを削除完了`);
          } catch (likesError) {
            console.error(`  - カードいいね削除中のエラー:`, likesError);
          }
        }
        
        // 3. ユーザーが行ったいいねを削除
        console.log(`  - ユーザーID ${id} が行ったいいねを削除中...`);
        try {
          await db.delete(likes).where(eq(likes.userId, id));
          console.log(`  - ユーザーのいいねを削除完了`);
        } catch (userLikesError) {
          console.error(`  - ユーザーいいね削除中のエラー:`, userLikesError);
        }
        
        // 4. ユーザーが受信者のカードを削除
        console.log(`  - ユーザーが受信者のカードを削除中...`);
        try {
          await db.delete(cards)
            .where(and(
              eq(cards.recipientId, id),
              eq(cards.recipientType, 'user')
            ));
          console.log(`  - 受信カードの削除完了`);
        } catch (recipientCardsError) {
          console.error(`  - 受信カード削除中のエラー:`, recipientCardsError);
        }
        
        // 5. ユーザーが送信者のカードを削除
        console.log(`  - ユーザーが送信者のカードを削除中...`);
        try {
          await db.delete(cards).where(eq(cards.senderId, id));
          console.log(`  - 送信カードの削除完了`);
        } catch (senderCardsError) {
          console.error(`  - 送信カード削除中のエラー:`, senderCardsError);
        }
        
        // 6. チームメンバーシップを削除
        console.log(`  - チームメンバーシップを削除中...`);
        try {
          await db.delete(teamMembers).where(eq(teamMembers.userId, id));
          console.log(`  - チームメンバーシップの削除完了`);
        } catch (teamMembersError) {
          console.error(`  - チームメンバーシップ削除中のエラー:`, teamMembersError);
        }
        
        // 7. 最後にユーザー自体を削除
        console.log(`  - ユーザー ${id} を物理削除中...`);
        try {
          const deleteResult = await db.delete(users).where(eq(users.id, id));
          console.log(`  - ユーザー削除結果:`, deleteResult);
          console.log(`ユーザーID ${id} の削除が完了しました`);
        } catch (userDeleteError) {
          console.error(`  - ユーザー削除中のエラー:`, userDeleteError);
          throw userDeleteError; // ユーザー削除ができなかった場合はエラーを投げる
        }
      } catch (innerError) {
        console.error(`ユーザーID ${id} の関連データ削除中にエラー:`, innerError);
        throw innerError;
      }
    } catch (error) {
      console.error(`ユーザーID ${id} の削除中にエラーが発生:`, error);
      throw error;
    }
  }
  // ユーザー関連
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log(`🔍 メール検索: ${email}`);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    console.log(`📋 検索結果: ${user ? `ユーザー発見 ID:${user.id}` : 'ユーザーなし'}`);
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
    console.log(`📝 createUser開始 - メール: ${insertUser.email}`);
    console.log(`🔑 入力パスワード: "${insertUser.password}"`);
    
    // パスワード処理を完全に無効化（開発中）
    if (insertUser.password) {
      console.log(`🔐 パスワード処理前: "${insertUser.password}"`);
      // 開発中：ハッシュ化を完全に無効化
      console.log(`🔐 パスワード処理後: "${insertUser.password}"`);
    }

    // アバターカラーがない場合はランダムに設定
    if (!insertUser.avatarColor) {
      insertUser.avatarColor = getRandomAvatarColor();
    }

    // displayNameが設定されていない場合はnameを使用
    if (!insertUser.displayName) {
      insertUser.displayName = insertUser.name;
    }

    console.log(`💾 DB挿入直前の値:`, {
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name
    });

    // 挿入
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    console.log(`✅ DB挿入後の結果:`, {
      email: user.email,
      password: user.password,
      name: user.name
    });
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
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
    console.log(`🔍 認証試行 - メール: ${email}`);
    
    const user = await this.getUserByEmail(email);
    if (!user) {
      console.log(`❌ ユーザーが見つかりません: ${email}`);
      return null;
    }
    
    console.log(`✅ ユーザー取得成功 - ID: ${user.id}, メール: ${user.email}`);
    
    if (!user.password) {
      console.log(`❌ パスワードが設定されていません: ${email}`);
      return null;
    }
    
    console.log(`🔐 パスワード検証中...`);
    console.log(`📝 入力パスワード: "${password}"`);
    console.log(`💾 DB保存パスワード: "${user.password}"`);
    
    // 開発中：プレーンテキストで比較
    const isPasswordCorrect = user.password === password;
    
    console.log(`🔑 パスワード検証結果: ${isPasswordCorrect ? '成功' : '失敗'}`);
    
    return isPasswordCorrect ? user : null;
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

  // ダッシュボード統計用メソッド
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getCardsByUser(userId: number, limit?: number): Promise<Card[]> {
    const query = db.select().from(cards).where(eq(cards.senderId, userId));
    if (limit) {
      query.limit(limit);
    }
    return await query;
  }

  async getCardsToUser(userId: number, limit?: number): Promise<Card[]> {
    const query = db.select().from(cards).where(eq(cards.recipientId, userId));
    if (limit) {
      query.limit(limit);
    }
    return await query;
  }

  async getLikesByUser(userId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.userId, userId));
  }

  async getLikesToUserCards(userId: number): Promise<Like[]> {
    const result = await db
      .select({
        like: likes
      })
      .from(likes)
      .innerJoin(cards, eq(likes.cardId, cards.id))
      .where(eq(cards.recipientId, userId));
    
    return result.map(r => r.like);
  }

  async getTopCardSenders(limit: number = 10): Promise<Array<{ user: User; count: number }>> {
    const results = await db
      .select({
        user: users,
        count: sql<number>`count(${cards.id})`
      })
      .from(cards)
      .innerJoin(users, eq(cards.senderId, users.id))
      .groupBy(users.id)
      .orderBy(sql`count(${cards.id}) desc`)
      .limit(limit);
    
    return results;
  }

  async getTopCardReceivers(limit: number = 10): Promise<Array<{ user: User; count: number }>> {
    const results = await db
      .select({
        user: users,
        count: sql<number>`count(${cards.id})`
      })
      .from(cards)
      .innerJoin(users, eq(cards.recipientId, users.id))
      .groupBy(users.id)
      .orderBy(sql`count(${cards.id}) desc`)
      .limit(limit);
    
    return results;
  }

  // 最近1ヶ月のランキング取得（ポイント付与者）
  async getMonthlyPointGivers(limit: number = 10): Promise<Array<{ user: User; totalPoints: number }>> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const results = await db
      .select({
        user: users,
        totalPoints: sql<number>`sum(${likes.points})`
      })
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(sql`${likes.createdAt} >= ${oneMonthAgo}`)
      .groupBy(users.id)
      .orderBy(sql`sum(${likes.points}) desc`)
      .limit(limit);
    
    return results;
  }

  // 最近1ヶ月のランキング取得（ポイント受信者）
  async getMonthlyPointReceivers(limit: number = 10): Promise<Array<{ user: User; totalPoints: number }>> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const results = await db
      .select({
        user: users,
        totalPoints: sql<number>`sum(${likes.points})`
      })
      .from(likes)
      .innerJoin(cards, eq(likes.cardId, cards.id))
      .innerJoin(users, eq(cards.recipientId, users.id))
      .where(sql`${likes.createdAt} >= ${oneMonthAgo}`)
      .groupBy(users.id)
      .orderBy(sql`sum(${likes.points}) desc`)
      .limit(limit);
    
    return results;
  }

  // 最近1ヶ月のカード送信ランキング
  async getMonthlyCardSenders(limit: number = 10): Promise<Array<{ user: User; cardCount: number }>> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const results = await db
      .select({
        user: users,
        cardCount: sql<number>`count(${cards.id})`
      })
      .from(cards)
      .innerJoin(users, eq(cards.senderId, users.id))
      .where(sql`${cards.createdAt} >= ${oneMonthAgo}`)
      .groupBy(users.id)
      .orderBy(sql`count(${cards.id}) desc`)
      .limit(limit);
    
    return results;
  }

  // 最近1ヶ月のカード受信ランキング
  async getMonthlyCardReceivers(limit: number = 10): Promise<Array<{ user: User; cardCount: number }>> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const results = await db
      .select({
        user: users,
        cardCount: sql<number>`count(${cards.id})`
      })
      .from(cards)
      .innerJoin(users, eq(cards.recipientId, users.id))
      .where(sql`${cards.createdAt} >= ${oneMonthAgo}`)
      .groupBy(users.id)
      .orderBy(sql`count(${cards.id}) desc`)
      .limit(limit);
    
    return results;
  }

  // 最近1ヶ月の拍手送信ランキング
  async getMonthlyLikeSenders(limit: number = 10): Promise<Array<{ user: User; likeCount: number }>> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const results = await db
      .select({
        user: users,
        likeCount: sql<number>`count(${likes.id})`
      })
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(sql`${likes.createdAt} >= ${oneMonthAgo}`)
      .groupBy(users.id)
      .orderBy(sql`count(${likes.id}) desc`)
      .limit(limit);
    
    return results;
  }

  // 最近1ヶ月の拍手受信ランキング
  async getMonthlyLikeReceivers(limit: number = 10): Promise<Array<{ user: User; likeCount: number }>> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const results = await db
      .select({
        user: users,
        likeCount: sql<number>`count(${likes.id})`
      })
      .from(likes)
      .innerJoin(cards, eq(likes.cardId, cards.id))
      .innerJoin(users, eq(cards.recipientId, users.id))
      .where(sql`${likes.createdAt} >= ${oneMonthAgo}`)
      .groupBy(users.id)
      .orderBy(sql`count(${likes.id}) desc`)
      .limit(limit);
    
    return results;
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
    try {
      // 実際のデータベース構造に合わせてカラムを選択
      const depts = await db.select().from(departments).orderBy(asc(departments.name));
      
      return depts;
    } catch (error) {
      console.error("部署一覧取得エラー:", error);
      return []; // エラー時は空配列を返す
    }
  }

  async getDepartment(id: number): Promise<Department | undefined> {
    try {
      const [dept] = await db.select()
        .from(departments)
        .where(eq(departments.id, id));
      
      if (!dept) return undefined;
      
      // そのまま返す
      return dept;
    } catch (error) {
      console.error(`部署ID ${id} 取得エラー:`, error);
      return undefined;
    }
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    try {
      // 実際のDBにあるカラムのみを抽出
      const dbValues = {
        name: insertDepartment.name,
        description: insertDepartment.description
      };
      
      const [dept] = await db
        .insert(departments)
        .values(dbValues)
        .returning();
      
      return dept;
    } catch (error) {
      console.error("部署作成エラー:", error);
      throw error;
    }
  }

  async updateDepartment(id: number, updates: Partial<Department>): Promise<Department> {
    try {
      // 実際のDBにあるカラムのみを抽出
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.description) dbUpdates.description = updates.description;
      
      const [dept] = await db
        .update(departments)
        .set(dbUpdates)
        .where(eq(departments.id, id))
        .returning();
    
      if (!dept) {
        throw new Error(`部署が見つかりません: ${id}`);
      }
      
      return dept;
    } catch (error) {
      console.error(`部署ID ${id} の更新エラー:`, error);
      throw error;
    }
  }
  
  async deleteDepartment(id: number): Promise<void> {
    try {
      // 部署を削除
      await db
        .delete(departments)
        .where(eq(departments.id, id));
        
      console.log(`部署ID ${id} を削除しました`);
    } catch (error) {
      console.error(`部署ID ${id} の削除エラー:`, error);
      throw error;
    }
  }

  // カード関連
  async getCards(options: { limit?: number; offset?: number; senderId?: number; recipientId?: number; } = {}): Promise<CardWithRelations[]> {
    // ベースクエリから開始
    let query = db.select().from(cards);
    
    // 条件を順次適用
    if (options.senderId !== undefined) {
      query = query.where(eq(cards.senderId, options.senderId));
    }
    
    if (options.recipientId !== undefined) {
      if (options.senderId !== undefined) {
        query = query.where(and(eq(cards.senderId, options.senderId), eq(cards.recipientId, options.recipientId)));
      } else {
        query = query.where(eq(cards.recipientId, options.recipientId));
      }
    }
    
    // ソートとページネーション
    query = query.orderBy(desc(cards.createdAt));
    
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
          additionalRecipientUsers: additionalRecipientUsers || null,
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
      additionalRecipients: additionalRecipientUsers?.map(u => u.id) || null,
      likes: cardLikes,
      totalPoints
    };
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db
      .insert(cards)
      .values([insertCard])
      .returning();
    
    return card;
  }
  
  async updateCard(id: number, updates: Partial<Card>): Promise<Card> {
    try {
      const [updatedCard] = await db
        .update(cards)
        .set(updates)
        .where(eq(cards.id, id))
        .returning();
        
      if (!updatedCard) {
        throw new Error(`カードが見つかりません: ${id}`);
      }
      
      return updatedCard;
    } catch (error) {
      console.error(`カードID ${id} の更新エラー:`, error);
      throw error;
    }
  }

  async deleteCard(id: number): Promise<void> {
    // まず関連するリアクションを削除
    await db
      .delete(cardReactions)
      .where(eq(cardReactions.cardId, id));
    
    // 関連するコメントを削除
    await db
      .delete(cardComments)
      .where(eq(cardComments.cardId, id));
    
    // 関連するいいねを削除
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
    // カード情報を取得
    const card = await this.getCard(insertLike.cardId);
    if (!card) {
      throw new Error(`Card with ID ${insertLike.cardId} not found`);
    }

    // いいねクリックユーザーの情報を取得
    const user = await this.getUser(insertLike.userId);
    if (!user) {
      throw new Error(`User with ID ${insertLike.userId} not found`);
    }

    // ポイント不足チェック（2ポイント必要）
    if (user.weeklyPoints < 2) {
      throw new Error("ポイントが不足しています");
    }

    // カードの現在のいいね数をチェック（50回制限）
    const currentLikes = await db
      .select({ count: sql<number>`count(*)` })
      .from(likes)
      .where(eq(likes.cardId, insertLike.cardId));
    
    const likeCount = currentLikes[0]?.count || 0;
    if (likeCount >= 50) {
      throw new Error("このカードは最大いいね数に達しています");
    }

    // いいねを追加（2ポイント）
    const [like] = await db
      .insert(likes)
      .values({
        cardId: insertLike.cardId,
        userId: insertLike.userId,
        points: 2
      })
      .returning();

    // ユーザーから2ポイント消費
    await db
      .update(users)
      .set({
        weeklyPoints: user.weeklyPoints - 2
      })
      .where(eq(users.id, insertLike.userId));

    // 送信者に1ポイント追加
    const sender = await this.getUser(card.senderId);
    if (sender) {
      await db
        .update(users)
        .set({
          weeklyPoints: sender.weeklyPoints + 1
        })
        .where(eq(users.id, card.senderId));
    }

    // 受信者にポイント配分
    if (card.recipientType === "user") {
      // 単一受信者の場合：1ポイント
      const recipient = await this.getUser(card.recipientId);
      if (recipient) {
        await db
          .update(users)
          .set({
            totalPointsReceived: recipient.totalPointsReceived + 1
          })
          .where(eq(users.id, card.recipientId));
      }
    }

    // 受信者が複数の場合：1ポイントをランダムで1人に付与
    if (card.additionalRecipients && card.additionalRecipients.length > 0) {
      const allRecipients = card.recipientType === "user" 
        ? [card.recipientId, ...card.additionalRecipients]
        : card.additionalRecipients;
      
      // ランダムで1人選択
      const randomIndex = Math.floor(Math.random() * allRecipients.length);
      const selectedRecipientId = allRecipients[randomIndex];
      
      const selectedRecipient = await this.getUser(selectedRecipientId);
      if (selectedRecipient) {
        await db
          .update(users)
          .set({
            totalPointsReceived: selectedRecipient.totalPointsReceived + 1
          })
          .where(eq(users.id, selectedRecipientId));
      }
    }
    
    return like;
  }

  async deleteLike(id: number): Promise<void> {
    // シンプルにいいねレコードを削除するだけ
    await db
      .delete(likes)
      .where(eq(likes.id, id));
  }

  // ダッシュボード統計データ取得（シンプル版）
  async getDashboardStats(userId: number) {
    try {
      console.log('🔍 getDashboardStats開始 - ユーザーID:', userId);
      const user = await this.getUser(userId);
      if (!user) throw new Error('ユーザーが見つかりません');

      // 今月の期間計算
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      console.log('📅 今月の期間:', thisMonthStart, 'から', nextMonthStart);

      // 今月のカード受信数
      const monthlyReceivedCards = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(cards)
        .where(and(
          eq(cards.recipientId, userId),
          gte(cards.createdAt, thisMonthStart),
          lt(cards.createdAt, nextMonthStart)
        ));

      // 今月のカード送信数  
      const monthlySentCards = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(cards)
        .where(and(
          eq(cards.senderId, userId),
          gte(cards.createdAt, thisMonthStart),
          lt(cards.createdAt, nextMonthStart)
        ));

      // 今月の受信いいね数（自分のカードへのいいね）
      const monthlyReceivedLikes = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(likes)
        .innerJoin(cards, eq(likes.cardId, cards.id))
        .where(and(
          or(eq(cards.senderId, userId), eq(cards.recipientId, userId)),
          ne(likes.userId, userId),
          gte(likes.createdAt, thisMonthStart),
          lt(likes.createdAt, nextMonthStart)
        ));

      // 今月の送信いいね数
      const monthlySentLikes = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(likes)
        .where(and(
          eq(likes.userId, userId),
          gte(likes.createdAt, thisMonthStart),
          lt(likes.createdAt, nextMonthStart)
        ));

      // 全期間の累計
      const totalReceivedCards = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(cards)
        .where(eq(cards.recipientId, userId));

      const totalSentCards = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(cards)
        .where(eq(cards.senderId, userId));

      const totalReceivedLikes = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(likes)
        .innerJoin(cards, eq(likes.cardId, cards.id))
        .where(and(
          or(eq(cards.senderId, userId), eq(cards.recipientId, userId)),
          ne(likes.userId, userId)
        ));

      const totalSentLikes = await db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(likes)
        .where(eq(likes.userId, userId));

      // カード送信先TOP10
      const cardSentToData = await db
        .select({
          recipientId: cards.recipientId,
          count: sql<number>`count(*)`.as('count')
        })
        .from(cards)
        .where(eq(cards.senderId, userId))
        .groupBy(cards.recipientId)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      // カード受信元TOP10
      const cardReceivedFromData = await db
        .select({
          senderId: cards.senderId,
          count: sql<number>`count(*)`.as('count')
        })
        .from(cards)
        .where(eq(cards.recipientId, userId))
        .groupBy(cards.senderId)
        .orderBy(desc(sql`count(*)`))
        .limit(10);

      // ユーザー情報を取得
      const cardSentTo = await Promise.all(
        cardSentToData.map(async (item) => {
          const targetUser = await this.getUser(item.recipientId);
          return targetUser ? { user: targetUser, count: item.count } : null;
        })
      );

      const cardReceivedFrom = await Promise.all(
        cardReceivedFromData.map(async (item) => {
          const targetUser = await this.getUser(item.senderId);
          return targetUser ? { user: targetUser, count: item.count } : null;
        })
      );

      // 今月のポイント合計計算（カード送信 + いいね送信）
      const monthlySentPointsFromCards = monthlySentCards[0]?.count || 0;
      const monthlySentPointsFromLikes = (monthlySentLikes[0]?.count || 0) * 2; // いいね1回=2pt
      const totalMonthlySentPoints = monthlySentPointsFromCards + monthlySentPointsFromLikes;

      // 今月の受信ポイント計算（受信カード数 + 受信いいね数）
      const monthlyReceivedPointsFromCards = monthlyReceivedCards[0]?.count || 0;
      const monthlyReceivedPointsFromLikes = monthlyReceivedLikes[0]?.count || 0; // いいね受信=1pt
      const totalMonthlyReceivedPoints = monthlyReceivedPointsFromCards + monthlyReceivedPointsFromLikes;

      return {
        weekly: {
          currentPoints: user.weeklyPoints,
          maxPoints: 500,
          usedPoints: 500 - user.weeklyPoints
        },
        monthly: {
          received: {
            points: totalMonthlyReceivedPoints,
            cards: monthlyReceivedCards[0]?.count || 0,
            likes: monthlyReceivedLikes[0]?.count || 0
          },
          sent: {
            points: totalMonthlySentPoints,
            cards: monthlySentCards[0]?.count || 0,
            likes: monthlySentLikes[0]?.count || 0
          }
        },
        lifetime: {
          received: {
            points: user.totalPointsReceived,
            cards: totalReceivedCards[0]?.count || 0,
            likes: totalReceivedLikes[0]?.count || 0
          },
          sent: {
            points: totalSentCards[0]?.count + (totalSentLikes[0]?.count || 0) * 2,
            cards: totalSentCards[0]?.count || 0,
            likes: totalSentLikes[0]?.count || 0
          }
        },
        rankings: {
          cardSentTo: cardSentTo.filter(item => item !== null),
          cardReceivedFrom: cardReceivedFrom.filter(item => item !== null),
          likeSentTo: [], // 後で実装
          likeReceivedFrom: [] // 後で実装
        }
      };
    } catch (error) {
      console.error('getDashboardStats error:', error);
      // エラー時はデフォルト値を返す
      return {
        monthly: {
          pointConversionRate: 0,
          userCardRank: 0,
          userLikeRank: 0
        },
        personal: {
          sentCards: [],
          receivedCards: [],
          sentLikes: [],
          receivedLikes: []
        }
      };
    }
  }

  // 週次ポイントリセット機能（月曜日実行）
  async resetWeeklyPointsIfNeeded(): Promise<void> {
    try {
      const now = new Date();
      const monday = new Date(now);
      
      // 今週の月曜日を計算
      const dayOfWeek = now.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 日曜日の場合は6日前
      monday.setDate(now.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);

      console.log(`📅 週次ポイントリセット確認: 今週の月曜日 = ${monday.toISOString()}`);

      // まだリセットしていないユーザーを確認
      const usersToReset = await db
        .select()
        .from(users)
        .where(
          sql`${users.lastWeeklyPointsReset} IS NULL OR ${users.lastWeeklyPointsReset} < ${monday}`
        );

      if (usersToReset.length > 0) {
        console.log(`💰 ${usersToReset.length}人のユーザーの週次ポイントをリセット中...`);

        // バッチでポイントリセット
        await db
          .update(users)
          .set({
            weeklyPoints: 500,
            weeklyPointsReceived: 0,
            lastWeeklyPointsReset: now
          })
          .where(
            sql`${users.lastWeeklyPointsReset} IS NULL OR ${users.lastWeeklyPointsReset} < ${monday}`
          );

        console.log(`✅ 週次ポイントリセット完了: ${usersToReset.length}人`);
      } else {
        console.log(`ℹ️ 今週はすでにポイントリセット済み`);
      }
    } catch (error) {
      console.error("週次ポイントリセットエラー:", error);
      throw error;
    }
  }

  // 通知機能: 受信したカードを取得
  async getReceivedCards(userId: number, limit: number = 10) {
    console.log(`📨 getReceivedCards開始 - ユーザーID: ${userId}, 制限: ${limit}`);
    try {
      const receivedCards = await db
        .select({
          id: cards.id,
          message: cards.message,
          createdAt: cards.createdAt,
          senderId: cards.senderId,
          senderName: users.name,
          senderDisplayName: users.displayName
        })
        .from(cards)
        .leftJoin(users, eq(cards.senderId, users.id))
        .where(eq(cards.recipientId, userId))
        .orderBy(desc(cards.createdAt))
        .limit(limit);

      console.log(`📨 getReceivedCards完了 - ${receivedCards.length}件取得`);
      return receivedCards;
    } catch (error) {
      console.error('❌ getReceivedCards エラー:', error);
      throw error;
    }
  }

  // 通知機能: 受信したいいねを取得
  async getReceivedLikes(userId: number, limit: number = 10) {
    console.log(`❤️ getReceivedLikes開始 - ユーザーID: ${userId}, 制限: ${limit}`);
    try {
      const receivedLikes = await db
        .select({
          id: likes.id,
          createdAt: likes.createdAt,
          cardId: likes.cardId,
          userId: likes.userId,
          userName: users.name,
          userDisplayName: users.displayName,
          cardMessage: cards.message
        })
        .from(likes)
        .leftJoin(users, eq(likes.userId, users.id))
        .leftJoin(cards, eq(likes.cardId, cards.id))
        .where(eq(cards.recipientId, userId))
        .orderBy(desc(likes.createdAt))
        .limit(limit);

      console.log(`❤️ getReceivedLikes完了 - ${receivedLikes.length}件取得`);
      return receivedLikes;
    } catch (error) {
      console.error('❌ getReceivedLikes エラー:', error);
      throw error;
    }
  }

  // 組織階層管理メソッド
  async getAllOrganizations(): Promise<OrganizationHierarchy[]> {
    return await db.select().from(organizationHierarchy).orderBy(asc(organizationHierarchy.level), asc(organizationHierarchy.name));
  }

  async createOrganization(data: InsertOrganization): Promise<OrganizationHierarchy> {
    const [organization] = await db.insert(organizationHierarchy).values({
      ...data,
      updatedAt: new Date()
    }).returning();
    return organization;
  }

  async updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<OrganizationHierarchy | null> {
    const [organization] = await db.update(organizationHierarchy)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(organizationHierarchy.id, id))
      .returning();
    return organization || null;
  }

  async deleteOrganization(id: number): Promise<void> {
    await db.delete(organizationHierarchy).where(eq(organizationHierarchy.id, id));
  }

  async getOrganizationByNameAndLevel(name: string, level: number): Promise<OrganizationHierarchy | null> {
    const [organization] = await db.select().from(organizationHierarchy)
      .where(and(eq(organizationHierarchy.name, name), eq(organizationHierarchy.level, level)));
    return organization || null;
  }

  // ユーザー部署関連メソッド
  async getUserDepartments(userId: number): Promise<UserDepartment[]> {
    return await db.select().from(userDepartments).where(eq(userDepartments.userId, userId));
  }

  async assignUserToDepartment(data: InsertUserDepartment): Promise<UserDepartment> {
    const [userDepartment] = await db.insert(userDepartments).values(data).returning();
    return userDepartment;
  }

  async removeUserFromDepartment(userId: number, organizationId: number): Promise<void> {
    await db.delete(userDepartments)
      .where(and(eq(userDepartments.userId, userId), eq(userDepartments.organizationId, organizationId)));
  }

  // 従業員インポート用の組織階層検索・作成メソッド
  async findOrganizationByNameAndParent(name: string, parentId: number | null): Promise<OrganizationHierarchy | null> {
    const condition = parentId 
      ? and(eq(organizationHierarchy.name, name), eq(organizationHierarchy.parentId, parentId))
      : and(eq(organizationHierarchy.name, name), isNull(organizationHierarchy.parentId));
    
    const [organization] = await db.select().from(organizationHierarchy).where(condition);
    return organization || null;
  }

  // 組織階層取得（実際のユーザーデータから動的に取得）
  async getOrganizationHierarchy(): Promise<any[]> {
    try {
      // 実際のユーザーデータから組織階層を動的に生成
      const result = await db.select({
        organizationLevel1: users.organizationLevel1,
        organizationLevel2: users.organizationLevel2,
        organizationLevel3: users.organizationLevel3,
        organizationLevel4: users.organizationLevel4,
        organizationLevel5: users.organizationLevel5
      }).from(users).where(ne(users.organizationLevel1, null));

      // 階層データを構造化
      const hierarchyMap = new Map();
      
      for (const row of result) {
        const levels = [
          row.organizationLevel1,
          row.organizationLevel2,
          row.organizationLevel3,
          row.organizationLevel4,
          row.organizationLevel5
        ].filter(Boolean);

        // 各階層を順番に処理
        let currentPath = '';
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const fullPath = currentPath ? `${currentPath} > ${level}` : level;
          
          if (!hierarchyMap.has(fullPath)) {
            hierarchyMap.set(fullPath, {
              id: fullPath,
              name: level,
              fullPath: fullPath,
              level: i + 1,
              parent: currentPath || null
            });
          }
          currentPath = fullPath;
        }
      }

      return Array.from(hierarchyMap.values()).sort((a, b) => a.fullPath.localeCompare(b.fullPath));
    } catch (error) {
      console.error("組織階層取得エラー:", error);
      return [];
    }
  }

  // リアクション関連メソッド
  async getReactionsForCard(cardId: number): Promise<Array<CardReaction & { user: User }>> {
    try {
      // シンプルなクエリで既存のリアクションデータを取得
      const reactionsQuery = `
        SELECT 
          cr.id, cr.card_id, cr.user_id, cr.emoji, cr.created_at,
          u.id as user_id, u.email, u.name, u.display_name, u.department,
          u.organization_level1, u.organization_level2, u.organization_level3,
          u.organization_level4, u.organization_level5, u.weekly_points,
          u.total_points_received, u.is_admin, u.avatar_color, u.custom_avatar_url,
          u.password IS NOT NULL as has_password, u.google_id, u.cognito_sub,
          u.is_active, u.created_at as user_created_at, u.updated_at as user_updated_at
        FROM card_reactions cr
        JOIN users u ON cr.user_id = u.id
        WHERE cr.card_id = ${cardId}
        ORDER BY cr.created_at
      `;
      
      const reactionsData = await this.db.execute(reactionsQuery);

      return reactionsData.rows.map((row: any) => ({
        id: row.id,
        cardId: row.card_id,
        userId: row.user_id,
        emoji: row.emoji,
        createdAt: new Date(row.created_at),
        user: {
          id: row.user_id,
          email: row.email,
          name: row.name,
          displayName: row.display_name,
          department: row.department,
          organizationLevel1: row.organization_level1,
          organizationLevel2: row.organization_level2,
          organizationLevel3: row.organization_level3,
          organizationLevel4: row.organization_level4,
          organizationLevel5: row.organization_level5,
          weeklyPoints: row.weekly_points,
          totalPointsReceived: row.total_points_received,
          isAdmin: row.is_admin,
          avatarColor: row.avatar_color,
          customAvatarUrl: row.custom_avatar_url,
          hasPassword: row.has_password,
          googleId: row.google_id,
          cognitoSub: row.cognito_sub,
          isActive: row.is_active,
          createdAt: new Date(row.user_created_at),
          updatedAt: new Date(row.user_updated_at)
        }
      }));
    } catch (error) {
      console.error("リアクション取得エラー:", error);
      return [];
    }
  }

  async getReactionsForCards(cardIds: number[]): Promise<Record<number, Array<CardReaction & { user: User }>>> {
    try {
      if (cardIds.length === 0) {
        return {};
      }

      // Drizzle ORMを使用した一括取得
      const reactionsData = await db
        .select({
          reaction: cardReactions,
          user: users
        })
        .from(cardReactions)
        .innerJoin(users, eq(cardReactions.userId, users.id))
        .where(inArray(cardReactions.cardId, cardIds))
        .orderBy(cardReactions.cardId, cardReactions.createdAt);

      // グループ化してレスポンス形式を作成
      const result: Record<number, Array<CardReaction & { user: User }>> = {};
      
      // 全てのカードIDを初期化
      cardIds.forEach(cardId => {
        result[cardId] = [];
      });

      reactionsData.forEach((row) => {
        const reaction = {
          ...row.reaction,
          user: row.user
        };
        result[reaction.cardId].push(reaction);
      });

      return result;
    } catch (error) {
      console.error("リアクション一括取得エラー:", error);
      return {};
    }
  }

  async createReaction(reaction: InsertCardReaction): Promise<CardReaction> {
    try {
      const [newReaction] = await this.db
        .insert(cardReactions)
        .values({
          cardId: reaction.cardId,
          userId: reaction.userId,
          emoji: reaction.emoji,
          createdAt: new Date()
        })
        .returning();

      return newReaction;
    } catch (error) {
      console.error("リアクション作成エラー:", error);
      throw new Error("リアクションの作成に失敗しました");
    }
  }

  async deleteReaction(cardId: number, userId: number): Promise<void> {
    try {
      await this.db
        .delete(cardReactions)
        .where(and(
          eq(cardReactions.cardId, cardId),
          eq(cardReactions.userId, userId)
        ));
    } catch (error) {
      console.error("リアクション削除エラー:", error);
      throw new Error("リアクションの削除に失敗しました");
    }
  }

  // コメント関連メソッド
  async getCommentsForCard(cardId: number): Promise<Array<CardComment & { user: User }>> {
    try {
      const result = await this.db
        .select({
          id: cardComments.id,
          cardId: cardComments.cardId,
          userId: cardComments.userId,
          message: cardComments.message,
          createdAt: cardComments.createdAt,
          updatedAt: cardComments.updatedAt,
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
            displayName: users.displayName,
            department: users.department,
            organizationLevel1: users.organizationLevel1,
            organizationLevel2: users.organizationLevel2,
            organizationLevel3: users.organizationLevel3,
            organizationLevel4: users.organizationLevel4,
            organizationLevel5: users.organizationLevel5,
            weeklyPoints: users.weeklyPoints,
            totalPointsReceived: users.totalPointsReceived,
            isAdmin: users.isAdmin,
            avatarColor: users.avatarColor,
            customAvatarUrl: users.customAvatarUrl,
            hasPassword: users.hasPassword,
            googleId: users.googleId,
            cognitoSub: users.cognitoSub,
            isActive: users.isActive,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
          }
        })
        .from(cardComments)
        .innerJoin(users, eq(cardComments.userId, users.id))
        .where(eq(cardComments.cardId, cardId))
        .orderBy(cardComments.createdAt);

      return result.map(row => ({
        id: row.id,
        cardId: row.cardId,
        userId: row.userId,
        message: row.message,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: row.user
      }));
    } catch (error) {
      console.error("コメント取得エラー:", error);
      return [];
    }
  }

  async createComment(comment: InsertCardComment): Promise<CardComment> {
    try {
      const now = new Date();
      const [newComment] = await this.db
        .insert(cardComments)
        .values({
          cardId: comment.cardId,
          userId: comment.userId,
          message: comment.message,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      return newComment;
    } catch (error) {
      console.error("コメント作成エラー:", error);
      throw new Error("コメントの作成に失敗しました");
    }
  }

  async updateComment(id: number, updates: Partial<CardComment>): Promise<CardComment> {
    try {
      const [updatedComment] = await this.db
        .update(cardComments)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(cardComments.id, id))
        .returning();

      if (!updatedComment) {
        throw new Error("コメントが見つかりません");
      }

      return updatedComment;
    } catch (error) {
      console.error("コメント更新エラー:", error);
      throw new Error("コメントの更新に失敗しました");
    }
  }

  async deleteComment(id: number): Promise<void> {
    try {
      await this.db
        .delete(cardComments)
        .where(eq(cardComments.id, id));
    } catch (error) {
      console.error("コメント削除エラー:", error);
      throw new Error("コメントの削除に失敗しました");
    }
  }
}