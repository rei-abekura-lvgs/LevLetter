import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router } from "wouter";
import Home from "@/pages/home";
import Profile from "@/pages/profile";
import MyCards from "@/pages/my-cards";
import UserManagement from "@/pages/admin/user-management";
import DepartmentManagement from "@/pages/admin/department-management";
import EmployeeImport from "@/pages/admin/employee-import";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import { Toaster } from "@/components/ui/toaster";

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
  // 🎯 認証をスキップして直接メイン画面を表示
  const mockUser = {
    id: 1,
    name: "テストユーザー",
    email: "test@example.com",
    department: "開発部",
    isAdmin: true,
    totalPoints: 500,
    totalPointsReceived: 300,
    weeklyPointsRemaining: 140
  };

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={() => <Home user={mockUser} />} />
        <Route path="/profile" component={() => <Profile user={mockUser} />} />
        <Route path="/my-cards" component={() => <MyCards user={mockUser} />} />
        <Route path="/admin/user-management" component={() => <UserManagement />} />
        <Route path="/admin/department-management" component={() => <DepartmentManagement />} />
        <Route path="/admin/employee-import" component={() => <EmployeeImport />} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;