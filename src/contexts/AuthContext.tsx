import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, type UserProfile, type LoginData, type SignupData } from "@/services/auth.service";
import { ApiClient } from "@/services/api.client";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<UserProfile>;
  signup: (data: SignupData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => authService.getUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const verifyInitialSession = async () => {
      const token = ApiClient.getToken();
      if (token) {
        try {
          const profile = await authService.me();
          if (isMounted && profile) {
            setUser(profile);
          }
        } catch {
          if (isMounted) {
            setUser(authService.getUser());
          }
        }
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setIsLoading(false);
    };

    verifyInitialSession();

    // Listen for 401 unauthorized events from ApiClient
    const handleUnauthorized = () => {
      authService.logout();
      if (isMounted) setUser(null);
    };

    window.addEventListener("foceye:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("foceye:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (data: LoginData): Promise<UserProfile> => {
    const res = await authService.login(data);
    const loggedUser = res.user || authService.getUser()!;
    setUser(loggedUser);
    return loggedUser;
  };

  const signup = async (data: SignupData): Promise<UserProfile> => {
    const res = await authService.signup(data);
    const signedUser = res.user || authService.getUser()!;
    setUser(signedUser);
    return signedUser;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async (): Promise<void> => {
    const profile = await authService.me();
    setUser(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && ApiClient.getToken()),
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
