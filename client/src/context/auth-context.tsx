import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { User } from "@shared/schema";

// デフォルト値
const defaultAuthContext = {
  user: null as User | null,
  loading: false,
  isAuthenticated: false,
  logout: () => {},
  fetchUser: async () => null as User | null,
  authError: null as string | null,
};

// コンテキスト型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<User | null>;
  logout: () => void;
  authError: string | null;
}

// コンテキスト作成
export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // 状態管理
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 認証状態を確認する関数
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAuthError(null);
        return userData;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("認証確認エラー:", error);
      setUser(null);
      setAuthError("認証の確認に失敗しました");
      return null;
    }
  }, []);

  // ログアウト処理
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include'
      });
      setUser(null);
      setAuthError(null);
    } catch (error) {
      console.error("ログアウトエラー:", error);
      setAuthError("ログアウトに失敗しました");
    }
  }, []);

  // 初期認証チェック
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      setLoading(true);
      try {
        await fetchUser();
      } catch (error) {
        console.error("初期認証チェックエラー:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [fetchUser]);

  const isAuthenticated = !!user;

  const contextValue: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    fetchUser,
    logout,
    authError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth カスタムフック
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}