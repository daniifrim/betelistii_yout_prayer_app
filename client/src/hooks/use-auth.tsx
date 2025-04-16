import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, auth, handleAuthRedirect } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  googleSignInMutation: UseMutationResult<SelectUser | null, Error, void>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      // Call Firebase to handle Google sign-in (tries popup first, then redirect)
      const result = await signInWithGoogle();
      
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to sign in with Google");
      }
      
      // If we have a user (from popup auth), authenticate with our backend
      if (result.user) {
        const idToken = await result.user.getIdToken();
        const res = await apiRequest("POST", "/api/auth/google", { idToken });
        return await res.json();
      }
      
      // For redirect flow, this function completes but the page will reload,
      // so we don't need to return anything meaningful
      return null;
    },
    onSuccess: (user: SelectUser | null) => {
      if (user) {
        queryClient.setQueryData(["/api/user"], user);
        toast({
          title: "Sign in successful",
          description: `Welcome, ${user.name}!`,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Google sign-in error:", error);
      
      toast({
        title: "Google sign-in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    },
  });
  
  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in with Firebase, now authenticate with our backend
          const idToken = await firebaseUser.getIdToken();
          
          try {
            const res = await apiRequest("POST", "/api/auth/google", { idToken });
            const userData = await res.json();
            
            // Set the user data in the query cache
            queryClient.setQueryData(["/api/user"], userData);
            
            toast({
              title: "Google sign-in successful",
              description: `Welcome, ${userData.name || firebaseUser.displayName}!`,
            });
          } catch (err: any) {
            console.error("Backend authentication error:", err);
            toast({
              title: "Authentication error",
              description: "Failed to authenticate with the server",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      }
    });
    
    return () => unsubscribe();
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        googleSignInMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
