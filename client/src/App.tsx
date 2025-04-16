import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PrayersPage from "@/pages/prayers-page";
import StatsPage from "@/pages/stats-page";
import AdminPage from "@/pages/admin-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useEffect } from "react";
import { handleAuthRedirect } from "./lib/firebase";
import { useToast } from "@/hooks/use-toast";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/prayers" component={PrayersPage} />
      <ProtectedRoute path="/stats" component={StatsPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthHandler() {
  const { toast } = useToast();

  useEffect(() => {
    // Handle the authentication redirect when the app loads
    async function handleRedirectResult() {
      try {
        const result = await handleAuthRedirect();
        
        if (!result.success) {
          toast({
            title: "Authentication Error",
            description: result.error?.message || "Failed to complete Google authentication",
            variant: "destructive",
          });
        } else if (result.user) {
          // Successfully signed in after redirect
          toast({
            title: "Sign in Successful",
            description: `Welcome, ${result.user.displayName || "user"}!`,
          });
          
          // The auth provider will handle the rest of the login process
        }
      } catch (error) {
        console.error("Error handling redirect:", error);
      }
    }
    
    handleRedirectResult();
  }, [toast]);
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthHandler />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
