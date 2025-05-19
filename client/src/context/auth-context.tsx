import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User } from "@shared/schema";
import { getAuthenticatedUser, getAuthToken } from "@/lib/auth";
import { useLocation } from "wouter";

// デフォルト値を提供して、コンテキストが初期化されていない場合のエラーを防ぐ
const defaultAuthContext = {
  user: null as User | null,
  loading: false,
  isAuthenticated: false,
  setUser: () => {},
  fetchUser: async () => {},
  logout: () => {}
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<User | null>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCounter, setRetryCounter] = useState(0);
  const [, setLocation] = useLocation();

  // ユーザーデータを取得する関数
  const fetchUser = useCallback(async (): Promise<User | null> => {
    console.log("認証情報取得を開始...");
    setLoading(true);
    
    // 認証トークンの存在確認
    const token = getAuthToken();
    if (!token) {
      console.log("認証トークンがありません");
      setLoading(false);
      return null;
    }

    try {
      console.log("APIからユーザー情報を取得中...");
      const userData = await getAuthenticatedUser();
      
      if (userData) {
        console.log("ユーザー情報取得成功:", userData.name, "(ID:", userData.id, ")");
        setUser(userData);
        return userData;
      } else {
        console.warn("APIからのレスポンスが空です");
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗しました:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ログアウト関数
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('levletter-auth-token');
    setLocation("/login");
  }, [setLocation]);

  // 初回とリトライの認証処理
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      // すでにユーザーが取得できている場合は再取得しない
      if (user) return;
      
      const result = await fetchUser();
      
      // コンポーネントがアンマウントされていたら状態更新しない
      if (!isMounted) return;
      
      // 認証に失敗した場合でトークンが存在する場合、数回リトライ
      if (!result && getAuthToken() && retryCounter < 3) {
        console.log(`認証リトライ (${retryCounter + 1}/3)...`);
        setTimeout(() => {
          if (isMounted) {
            setRetryCounter(prev => prev + 1);
          }
        }, 1000);
      }
    };

    initAuth();
    
    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, [retryCounter, user]);

  // 認証状態の判定
  const isAuthenticated = !!user;

  // コンテキスト値
  const value = {
    user,
    loading,
    isAuthenticated,
    setUser,
    fetchUser,
    logout
  };

  // デバッグ用ログ
  useEffect(() => {
    console.log("認証状態変更:", { 
      isAuthenticated, 
      userId: user?.id,
      userName: user?.name,
      loading 
    });
  }, [isAuthenticated, user, loading]);

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