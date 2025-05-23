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
  
  // ユーザー情報の取得 - 改善版
  const fetchUser = useCallback(async (): Promise<User | null> => {
    // すでにリクエスト中の場合は中止
    if (isRequesting) {
      return user;
    }
    
    // ユーザーが既に認証済みの場合
    if (user) {
      return user;
    }
    
    // セッションベース認証なので、トークンチェックは不要
    
    // 試行回数が上限に達しているかチェック
    if (authAttemptCount.current >= maxAuthAttempts) {
      // 最後の試行から十分な時間が経過しているか確認
      const now = Date.now();
      if (now - lastAuthAttempt.current < authCooldown) {
        return user; // クールダウン中は何もしない
      }
      
      // クールダウン後はカウンターをリセット
      authAttemptCount.current = 0;
    }
    
    // リクエスト状態の更新
    setIsRequesting(true);
    setLoading(true);
    
    try {
      // 試行回数を増加
      authAttemptCount.current++;
      lastAuthAttempt.current = Date.now();
      
      // デバッグログ
      console.log("アプリ状態:", {
        "認証済み": isAuthenticated,
        "ユーザー": user && typeof user === 'object' ? (user.name || "名前なし") : "未ログイン",
        "読込中": loading,
        "現在のパス": window.location.pathname
      });
      
      // セッションベースでユーザー情報を取得
      console.log("セッション認証チェック中...");
      const userData = await getAuthenticatedUser();
      
      if (userData) {
        console.log("認証成功:", userData.name);
        setUser(userData);
        setAuthError(null);
        authAttemptCount.current = 0;
        return userData;
      } else {
        console.log("未認証状態");
        setUser(null);
        setAuthError(null); // 未認証は正常な状態なのでエラーメッセージなし
        return null;
      }
    } catch (error) {
      console.error("認証チェックエラー:", error);
      setUser(null);
      
      // 401/403は正常な未認証状態
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        setAuthError(null); // 未認証は正常状態
      } else {
        setAuthError("システムエラーが発生しました");
      }
      return null;
    } finally {
      setLoading(false);
      setIsRequesting(false);
    }
  }, [user, isRequesting, loading, isAuthenticated]);
  
  // ログアウト処理
  const logout = useCallback(() => {
    // ユーザー情報をクリア
    setUser(null);
    setAuthError(null);
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
        // 認証情報の初期化
        const token = getAuthToken();
        if (!token) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
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