import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

interface AuthResponse {
  user: User;
  token: string;
}

export const TOKEN_KEY = "levletter-auth-token";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "ログインに失敗しました");
  }

  const data = await response.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function register(formData: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await apiRequest("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "アカウント登録に失敗しました");
  }

  const data = await response.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await apiRequest("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return null;
      }
      const error = await response.json();
      throw new Error(error.message || "認証情報の取得に失敗しました");
    }

    return await response.json();
  } catch (error) {
    console.error("認証エラー:", error);
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