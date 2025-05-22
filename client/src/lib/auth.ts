import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthResponse {
  user: User;
  token: string;
}

export const TOKEN_KEY = "levletter-auth-token";

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const data = await apiRequest<AuthResponse>("POST", "/api/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
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
    const token = getAuthToken();
    
    if (!token) {
      console.debug("トークンがないため認証スキップ");
      return null;
    }
    
    // APIリクエスト関数を使用
    try {
      const data = await apiRequest<{user: User}>("GET", "/api/auth/me");
      console.log("認証ユーザー情報取得成功:", data);
      // /api/auth/me エンドポイントはuser属性を含むことがある
      return data.user || data as unknown as User;
    } catch (error: any) {
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

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}