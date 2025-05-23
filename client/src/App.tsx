import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router } from "wouter";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import MyCards from "@/pages/my-cards";
import Login from "@/pages/login";
import Register from "@/pages/register";
import UserManagement from "@/pages/admin/user-management";
import DepartmentManagement from "@/pages/admin/department-management";
import EmployeeImport from "@/pages/admin/employee-import";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import AuthLayout from "@/components/layout/auth-layout";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useLocation } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string);
        if (!res.ok) {
          throw new Error(`Failed to fetch ${queryKey[0]}`);
        }
        return res.json();
      },
    },
  },
});

function AppRoutes() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  // 認証状態によるリダイレクト処理
  useEffect(() => {
    const publicRoutes = ['/login', '/register'];
    
    if (!loading) {
      // 認証済みかつログイン関連ページにいる場合はホームへリダイレクト
      if (isAuthenticated && publicRoutes.includes(location)) {
        setLocation('/');
      }
      // 未認証かつ保護されたページにいる場合はログインへリダイレクト
      else if (!isAuthenticated && !publicRoutes.includes(location)) {
        setLocation('/login');
      }
    }
  }, [isAuthenticated, loading, location, setLocation]);

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <Switch>
      {/* 認証されていない場合のルート */}
      {!isAuthenticated ? (
        <>
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
          {/* デフォルトはログインページにリダイレクト */}
          <Route>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </Route>
        </>
      ) : (
        /* 認証されている場合のルート */
        <MainLayout>
          <Switch>
            <Route path="/" component={() => <Home user={user!} />} />
            <Route path="/profile" component={() => <Profile user={user!} />} />
            <Route path="/my-cards" component={() => <MyCards user={user!} />} />
            {user?.isAdmin && (
              <>
                <Route path="/admin/user-management" component={() => <UserManagement />} />
                <Route path="/admin/department-management" component={() => <DepartmentManagement />} />
                <Route path="/admin/employee-import" component={() => <EmployeeImport />} />
              </>
            )}
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;