import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Profile from "@/pages/profile";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Settings from "@/pages/settings";
import AdminDashboard from "@/pages/admin";
import Landing from "@/pages/landing";
import Contact from "@/pages/contact";
import Demo from "@/pages/demo";
import MainLayout from "@/components/layout/main-layout";
import AuthLayout from "@/components/layout/auth-layout";
import { AuthProvider, useAuth } from "@/context/auth-context-new";
import { useEffect, useState } from "react";

function AppRoutes() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  // 初期認証処理とナビゲーション制御
  useEffect(() => {
    // 保護されたルートとパブリックルートの定義
    const publicRoutes = ['/landing', '/login', '/register', '/forgot-password', '/contact', '/demo'];
    
    // 認証状態によるリダイレクト処理
    if (!isLoading) {
      // パスワードリセット画面は特別扱い（reset-passwordから始まる場合は未認証でもアクセスを許可）
      if (location.startsWith('/reset-password')) {
        // リセット画面はリダイレクトしない
        return;
      }
      
      // 認証済みかつログイン関連ページにいる場合はホームへリダイレクト
      if (isAuthenticated && publicRoutes.includes(location)) {
        setLocation('/');
      } 
      // 未認証かつ保護されたページにいる場合はランディングページへリダイレクト
      else if (!isAuthenticated && !publicRoutes.includes(location)) {
        setLocation('/landing');
      }
    }
  }, [isAuthenticated, isLoading, location, setLocation]);
  
  // デバッグ用ログ
  useEffect(() => {
    console.log("アプリ状態:", { 
      認証済み: isAuthenticated, 
      ユーザー: user ? user.name : '未ログイン', 
      読込中: isLoading,
      現在のパス: location
    });
  }, [isAuthenticated, user, isLoading, location]);

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // 認証状態に基づいたルーティング
  if (isAuthenticated && user) {
    // 認証済み状態のルーティング
    return (
      <MainLayout>
        <Switch>
          <Route path="/profile">
            <Profile user={user} />
          </Route>
          <Route path="/settings">
            <Settings />
          </Route>
          <Route path="/admin">
            {user.isAdmin ? (
              <AdminDashboard />
            ) : (
              <Home user={user} />
            )}
          </Route>
          <Route path="/">
            <Home user={user} />
          </Route>
          <Route path="*">
            <Home user={user} />
          </Route>
        </Switch>
      </MainLayout>
    );
  } else {
    // 未認証状態のルーティング
    return (
      <Switch>
        <Route path="/login">
          <AuthLayout>
            <Login />
          </AuthLayout>
        </Route>
        <Route path="/register">
          <AuthLayout>
            <Register />
          </AuthLayout>
        </Route>
        <Route path="/forgot-password">
          <AuthLayout>
            <ForgotPassword />
          </AuthLayout>
        </Route>
        <Route path="/reset-password">
          <AuthLayout>
            <ResetPassword />
          </AuthLayout>
        </Route>
        <Route path="/reset-password/:token">
          <AuthLayout>
            <ResetPassword />
          </AuthLayout>
        </Route>
        <Route path="/contact">
          <Contact />
        </Route>
        <Route path="/demo">
          <Demo />
        </Route>
        <Route path="/landing">
          <Landing />
        </Route>
        <Route path="*">
          <Landing />
        </Route>
      </Switch>
    );
  }
}

function App() {
  // QueryClientProviderがルートレベルに配置され、すべてのコンポーネントにQueryClientを提供します
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
