import { createContext, useContext, ReactNode, useState, useCallback } from "react";
import { User } from "@shared/schema";
import { getAuthenticatedUser } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getAuthenticatedUser();
      setUser(user);
    } catch (error) {
      console.error("認証エラー:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    loading,
    setUser,
    fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}