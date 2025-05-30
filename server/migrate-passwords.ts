import bcrypt from "bcrypt";
import { storage } from "./storage";

// 既存のプレーンテキストパスワードをbcryptハッシュに変換
async function migratePasswords() {
  console.log("🔄 パスワード移行開始");
  
  try {
    // プレーンテキストパスワードのユーザーを取得
    const users = await storage.getUsers();
    const usersToMigrate = users.filter(user => 
      user.password && 
      user.password.length < 20 && // プレーンテキストの可能性が高い
      !user.password.startsWith('$2b$') // bcryptハッシュではない
    );

    console.log(`📋 移行対象ユーザー: ${usersToMigrate.length}人`);

    for (const user of usersToMigrate) {
      console.log(`🔐 ${user.email} のパスワードをハッシュ化中...`);
      
      // bcryptでハッシュ化
      const hashedPassword = await bcrypt.hash(user.password!, 12);
      
      // データベース更新
      await storage.updateUser(user.id, { password: hashedPassword });
      
      console.log(`✅ ${user.email} 完了`);
    }

    console.log("🎉 パスワード移行完了");
  } catch (error) {
    console.error("❌ パスワード移行エラー:", error);
  }
}

// 実行
migratePasswords();