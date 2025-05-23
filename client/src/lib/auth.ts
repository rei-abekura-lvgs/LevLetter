import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthResponse {
  user: User;
  token: string;
}

export const TOKEN_KEY = "levletter-auth-token";

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const data = await apiRequest<{message: string, user: User}>("POST", "/api/auth/login", { email, password });
    // セッション方式なのでトークンは不要
    return {
      user: data.user,
      token: "" // セッション方式のため空文字
    };
  } catch (error: any) {
    console.error("ログインエラー:", error);
    throw new Error(error.message || "ログインに失敗しました");
  }
}

export async function register(formData: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  try {
    const data = await apiRequest<AuthResponse>("POST", "/api/auth/register", formData);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (error: any) {
    console.error("登録エラー:", error);
    throw new Error(error.message || "登録に失敗しました");
  }
}

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    console.log("🔍 認証ユーザー情報取得開始...");
    // セッション方式なのでトークンチェックは不要
    try {
      const data = await apiRequest<User>("GET", "/api/auth/me");
      console.log("✅ 認証ユーザー情報取得成功:", data);
      return data;
    } catch (error: any) {
      console.error("❌ 認証ユーザー情報取得エラー:", error);
      // 401エラーの場合は静かに処理
      if (error.message && error.message.includes("401")) {
        console.debug("認証エラー: ユーザーは未ログイン状態");
        // ログアウト処理は呼び出さない（不要なリダイレクトを防ぐ）
      } else {
        console.error("ユーザー認証エラー:", error);
      }
      return null;
    }
  } catch (error) {
    console.error("ユーザー情報の取得に失敗しました:", error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    // サーバー側のセッションを削除
    await apiRequest("POST", "/api/auth/logout");
  } catch (error) {
    console.error("ログアウトAPIエラー:", error);
    // APIエラーがあってもローカルの処理は続行
  }
  // ローカルストレージからトークンを削除（念のため）
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}