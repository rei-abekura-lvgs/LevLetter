import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import MyCards from "@/pages/my-cards";
import Profile from "@/pages/profile";
import MainLayout from "@/components/layout/main-layout";
import AuthLayout from "@/components/layout/auth-layout";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";

function AppRoutes() {
  const { user, loading, isAuthenticated, fetchUser } = useAuth();
  const [location, setLocation] = useLocation();
  const [directHomeActivated, setDirectHomeActivated] = useState(false);
  
  // 初期認証処理
  useEffect(() => {
    console.log("アプリの初期化 - 現在のパス:", location);
    
    // ユーザー情報の取得を試行
    fetchUser().then(userData => {
      if (userData) {
        console.log("認証成功", userData.name);
        
        // ホームページにいて認証済みの場合、Homeコンポーネントの強制表示を検討
        if (location === '/' && !directHomeActivated) {
          console.log("ホームページ表示条件を満たしています - 直接表示の準備");
          setTimeout(() => {
            setDirectHomeActivated(true);
          }, 100);
        }
      } else {
        console.log("認証されていないか、情報の取得に失敗しました");
      }
    }).catch(err => {
      console.error("認証処理中にエラーが発生しました:", err);
    });
  }, [fetchUser, location]);
  
  // デバッグログ - 状態変更の追跡
  useEffect(() => {
    console.log("アプリ状態更新:", { 
      認証済み: isAuthenticated, 
      ユーザー: user ? user.name : '未ログイン', 
      ID: user?.id,
      読込中: loading,
      現在のパス: location,
      直接表示: directHomeActivated
    });
  }, [isAuthenticated, user, loading, location, directHomeActivated]);

  // ページアクセス制御
  useEffect(() => {
    // 認証済みで保護されたルートにアクセス可能
    if (isAuthenticated && user) {
      console.log("認証済みユーザー:", user.name, "- アクセス許可");
    } 
    // 認証情報の読み込みが完了し、認証されていない場合のリダイレクト
    else if (!loading && !isAuthenticated) {
      const authRoutes = ['/login', '/register'];
      if (!authRoutes.includes(location)) {
        console.log("未認証状態でのアクセス制限 - ログインへリダイレクト");
        setLocation("/login");
      }
    }
  }, [isAuthenticated, loading, location, setLocation, user]);

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // 特殊条件: 認証済みだが画面遷移が正常に動作しない場合の直接レンダリング
  if (user && location === '/' && directHomeActivated) {
    console.log("直接ホーム画面表示モードを実行");
    return (
      <MainLayout>
        <Home user={user} />
      </MainLayout>
    );
  }

  // 未認証状態 - 認証関連ページのみアクセス可能
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route component={Login} />
        </Switch>
      </AuthLayout>
    );
  }

  // 認証済み状態 - 通常のルーティング
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={() => <Home user={user} />} />
        <Route path="/my-cards" component={() => <MyCards user={user} />} />
        <Route path="/profile" component={() => <Profile user={user} />} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
