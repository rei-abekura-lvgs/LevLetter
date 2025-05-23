import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { simpleLogin, simpleGetUser, simpleLogout } from "@/lib/simple-auth";

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | null>(null);

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchUser = async () => {
    try {
      const userData = await simpleGetUser();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const userData = await simpleLogin(email, password);
    setUser(userData);
  };

  const logout = async () => {
    await simpleLogout();
    setUser(null);
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const value: SimpleAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refetchUser,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error("useSimpleAuth must be used within SimpleAuthProvider");
  }
  return context;
}