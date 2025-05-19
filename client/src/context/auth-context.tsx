import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { User } from "@shared/schema";
import { getAuthenticatedUser, getAuthToken, logout as logoutUtil } from "@/lib/auth";
import { useLocation } from "wouter";

// デフォルト値
const defaultAuthContext = {
  user: null as User | null,
  loading: false,
  isAuthenticated: false,
  logout: () => {},
  fetchUser: async () => null as User | null,
};

// コンテキスト型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<User | null>;
  logout: () => void;
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
  const [, setLocation] = useLocation();

  // 認証状態
  const isAuthenticated = !!user;

  // リクエスト中かどうかを追跡するためのref
  const [isRequesting, setIsRequesting] = useState(false);
  
  // ユーザー情報の取得 - シンプルな実装に変更
  const fetchUser = useCallback(async (): Promise<User | null> => {
    // すでにリクエスト中の場合や認証済みの場合は再取得しない
    if (isRequesting) {
      return user;
    }
    
    if (user) {
      return user;
    }
    
    // リクエスト状態の更新
    setIsRequesting(true);
    setLoading(true);
    
    try {
      // トークンの存在確認
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        return null;
      }
      
      // APIからユーザー情報取得
      const userData = await getAuthenticatedUser();
      
      if (userData) {
        setUser(userData);
        return userData;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("認証エラー:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
      setIsRequesting(false);
    }
  }, [user, isRequesting]);
  
  // ログアウト処理
  const logout = useCallback(() => {
    // ユーザー情報をクリア
    setUser(null);
    // ローカルストレージからトークン削除
    logoutUtil();
    // ログインページへリダイレクト
    setLocation("/login");
  }, [setLocation]);

  // 初回マウント時に認証情報を取得
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        if (!user && isMounted) {
          await fetchUser();
        }
      } catch (error) {
        console.error("初期認証エラー:", error);
      }
    };
    
    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, [fetchUser, user]);

  // コンテキスト値
  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    fetchUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthはAuthProviderの中で使用する必要があります");
  }
  return context;
}