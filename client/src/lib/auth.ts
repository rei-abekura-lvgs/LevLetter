import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

interface AuthResponse {
  user: User;
  token: string;
}

export const TOKEN_KEY = "levletter-auth-token";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/api/auth/login", { email, password });
  const data = await res.json();
  
  // トークンをローカルストレージに保存
  localStorage.setItem(TOKEN_KEY, data.token);
  
  return data;
}

export async function register(formData: {
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  department?: string;
}): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/api/auth/register", formData);
  const data = await res.json();
  
  // トークンをローカルストレージに保存
  localStorage.setItem(TOKEN_KEY, data.token);
  
  return data;
}

export async function getAuthenticatedUser(): Promise<User | null> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    const res = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      credentials: "include"
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      throw new Error("認証エラー");
    }
    
    return await res.json();
  } catch (error) {
    console.error("認証情報の取得に失敗しました:", error);
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/login";
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
