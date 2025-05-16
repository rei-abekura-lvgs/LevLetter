import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

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

  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  }
  
  throw new Error(data.message || "ログインに失敗しました");
}

export async function register(formData: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  const response = await apiRequest("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  const data = await response.json();
  
  if (response.ok) {
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  }
  
  throw new Error(data.message || "登録に失敗しました");
}

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      return null;
    }
    
    const response = await apiRequest("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return null;
      }
      throw new Error("認証に失敗しました");
    }
    
    const data = await response.json();
    return data.user;
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