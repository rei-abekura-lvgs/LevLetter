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
import { AuthProvider, useAuth, AuthContext } from "@/context/auth-context";
import { useEffect, useContext } from "react";

function Router() {
  const context = useContext(AuthContext);
  const [location, setLocation] = useLocation();

  // コンテキストがnullの場合は早期リターン
  if (!context) {
    console.error("AuthContextが見つかりません");
    return null;
  }

  const { user, loading, fetchUser } = context;

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ユーザーがロード中の場合はローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-primary-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // ログインしていない場合、認証ページに限定
  if (!user) {
    // 現在の場所が認証ページでなければ、ログインページへリダイレクト
    if (location !== "/login" && location !== "/register") {
      setLocation("/login");
    }

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

  // ログイン済みユーザー向けルート
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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
