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
  updateUser: (updatedUser: User) => void;
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
    console.log("🔍 セッションからユーザー情報を取得中...");
    
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ セッション認証成功:", userData.name);
        return userData;
      } else {
        console.log("🔒 未認証状態");
        return null;
      }
    } catch (error) {
      console.error("❌ 認証ユーザー情報取得エラー:", error);
      throw error;
    }
  };

  // ログイン機能
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.message || "ログインに失敗しました");
        return false;
      }
    } catch (error) {
      setError("ネットワークエラーが発生しました");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト機能
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("ログアウトエラー:", error);
    } finally {
      setUser(null);
      setLocation("/landing");
    }
  };

  // ユーザー情報更新
  const refreshUser = async () => {
    try {
      const userData = await fetchUserFromSession();
      setUser(userData);
    } catch (error) {
      console.error("ユーザー情報更新エラー:", error);
      setUser(null);
    }
  };

  // 初期化時にセッションをチェック
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

  // ユーザー情報を更新する関数
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    console.log('🔄 ユーザー情報更新:', updatedUser.name, 'ポイント:', updatedUser.weeklyPoints);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}