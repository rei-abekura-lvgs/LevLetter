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
import MainLayout from "@/components/layout/main-layout";
import AuthLayout from "@/components/layout/auth-layout";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";

function AppRoutes() {
  const { user, loading, isAuthenticated, fetchUser } = useAuth();
  const [location, setLocation] = useLocation();
  
  // 初期認証処理とナビゲーション制御
  useEffect(() => {
    // 認証情報を取得
    const checkAuth = async () => {
      try {
        console.log("認証情報を確認中...");
        const userData = await fetchUser();
        
        // 認証済みの場合
        if (userData) {
          console.log("認証成功:", userData.name);
          
          // 認証済みユーザーがログインページにアクセスした場合はホームへリダイレクト
          if (location === '/login' || location === '/register') {
            console.log("認証済みユーザーをホームへリダイレクト");
            setLocation('/');
          }
        } 
        // 未認証の場合
        else {
          console.log("未認証状態");
          // 保護されたルートへのアクセスを制限
          const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
          if (!authRoutes.includes(location)) {
            console.log("未認証ユーザーをログインページへリダイレクト");
            setLocation('/login');
          }
        }
      } catch (err) {
        console.error("認証確認中にエラー:", err);
      }
    };
    
    // 認証状態が変更されたら再確認
    checkAuth();
  }, [fetchUser, location, setLocation]);
  
  // デバッグ用ログ
  useEffect(() => {
    console.log("アプリ状態:", { 
      認証済み: isAuthenticated, 
      ユーザー: user ? user.name : '未ログイン', 
      読込中: loading,
      現在のパス: location
    });
  }, [isAuthenticated, user, loading, location]);

  // ローディング表示
  if (loading) {
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
          <Route path="/">
            <Home user={user} />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </MainLayout>
    );
  } else {
    // 未認証状態のルーティング
    return (
      <AuthLayout>
        <Switch>
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/forgot-password">
            <ForgotPassword />
          </Route>
          <Route path="/reset-password">
            <ResetPassword />
          </Route>
          <Route>
            <Login />
          </Route>
        </Switch>
      </AuthLayout>
    );
  }
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
