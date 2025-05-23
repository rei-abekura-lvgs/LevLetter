import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from "react";
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
  authError: null as string | null,
};

// コンテキスト型
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  fetchUser: () => Promise<User | null>;
  logout: () => Promise<void>;
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
  const [, setLocation] = useLocation();

  // 認証状態
  const isAuthenticated = !!user;

  // リクエスト中かどうかを追跡
  const [isRequesting, setIsRequesting] = useState(false);
  
  // 認証試行回数を追跡
  const authAttemptCount = useRef(0);
  const maxAuthAttempts = 3;
  
  // 最後の認証時刻を追跡
  const lastAuthAttempt = useRef<number>(0);
  const authCooldown = 5000; // 5秒のクールダウン
  
  // ユーザー情報の取得 - セッションベース認証対応
  const fetchUser = useCallback(async (): Promise<User | null> => {
    // すでにリクエスト中の場合は中止
    if (isRequesting) {
      return user;
    }
    
    // リクエスト状態の更新
    setIsRequesting(true);
    setLoading(true);
    
    try {
      // デバッグログ
      console.log("アプリ状態:", {
        "認証済み": isAuthenticated,
        "ユーザー": user && typeof user === 'object' ? (user.name || "名前なし") : "未ログイン",
        "読込中": loading,
        "現在のパス": window.location.pathname
      });
      
      // セッションベース認証：常にAPIからユーザー情報取得を試行
      const userData = await getAuthenticatedUser();
      
      if (userData) {
        setUser(userData);
        setAuthError(null);
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
  }, [isRequesting, loading, isAuthenticated]);
  
  // ログアウト処理（セッションベース認証対応）
  const logout = useCallback(async () => {
    try {
      // サーバーサイドのログアウト処理
      await logoutUtil();
      // ユーザー情報をクリア
      setUser(null);
      setAuthError(null);
      // ログインページへリダイレクト
      setLocation("/login");
    } catch (error) {
      console.error("ログアウトエラー:", error);
      // エラーが発生してもローカル状態はクリア
      setUser(null);
      setAuthError(null);
      setLocation("/login");
    }
  }, [setLocation]);

  // 初回マウント時に認証情報を取得（セッションベース認証）
  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        // セッションベース認証：常にユーザー情報の取得を試行
        if (!user && isMounted) {
          await fetchUser();
        }
      } catch (error) {
        console.error("初期認証エラー:", error);
        if (isMounted) {
          setAuthError("認証の初期化に失敗しました");
          setLoading(false);
        }
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
    logout,
    authError
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