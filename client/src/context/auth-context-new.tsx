import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// 認証コンテキストの作成
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーのプロパティ
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // セッションからユーザー情報を取得
  const fetchUserFromSession = async (): Promise<User | null> => {
    try {
      console.log("🔍 セッションからユーザー情報を取得中...");
      
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // セッションクッキーを含める
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ セッション認証成功:", userData.name);
        return userData;
      } else if (response.status === 401) {
        console.log("🔒 未認証状態");
        return null;
      } else {
        console.error("❌ セッション確認エラー:", response.status);
        return null;
      }
    } catch (error) {
      console.error("❌ セッション確認例外:", error);
      return null;
    }
  };

  // ログイン処理
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔐 ログイン処理開始:", email);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include", // セッションクッキーを含める
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ ログイン成功:", data.user.name);
        setUser(data.user);
        setLocation("/"); // ホーム画面に遷移
        return true;
      } else {
        const errorData = await response.json();
        console.error("❌ ログイン失敗:", errorData.message);
        setError(errorData.message || "ログインに失敗しました");
        return false;
      }
    } catch (error: any) {
      console.error("❌ ログイン例外:", error);
      setError("ログイン処理中にエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const logout = () => {
    console.log("🚪 ログアウト処理開始");
    setUser(null);
    setError(null);
    // セッション破棄はサーバー側で行う
    setLocation("/login");
  };

  // ユーザー情報の再取得
  const refreshUser = async () => {
    console.log("🔄 ユーザー情報再取得開始");
    const userData = await fetchUserFromSession();
    setUser(userData);
  };

  // 初期化時にセッション状態を確認
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log("🚀 認証初期化開始");
      
      try {
        const userData = await fetchUserFromSession();
        
        if (isMounted) {
          setUser(userData);
          console.log("🎯 認証初期化完了:", userData ? userData.name : "未ログイン");
        }
      } catch (error) {
        console.error("❌ 認証初期化エラー:", error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // デバッグ用のログ出力
  useEffect(() => {
    console.log("📊 認証状態更新:", {
      認証済み: !!user,
      ユーザー: user?.name || "未ログイン",
      読込中: isLoading,
      エラー: error
    });
  }, [user, isLoading, error]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// 認証コンテキストを使用するためのカスタムフック
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth は AuthProvider 内で使用する必要があります");
  }
  return context;
}