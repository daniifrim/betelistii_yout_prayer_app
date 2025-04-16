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
        console.log("Checking for Google sign-in redirect result...");
        const result = await handleAuthRedirect();
        
        if (!result.success) {
          console.error("Redirect result error:", result.error);
          toast({
            title: "Authentication Error",
            description: result.error?.message || "Failed to complete Google authentication",
            variant: "destructive",
          });
        } else if (result.user) {
          // Successfully signed in after redirect
          console.log("Got successful redirect result with user:", result.user.displayName);
          
          try {
            // Send the token to our backend to complete authentication
            const idToken = await result.user.getIdToken();
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ idToken }),
            });
            
            if (res.ok) {
              const userData = await res.json();
              console.log("Backend authentication successful:", userData);
              
              // Update the auth state with the user data
              // Using imported queryClient instead of accessing through useAuth
              queryClient.setQueryData(["/api/user"], userData);
              
              toast({
                title: "Sign in Successful",
                description: `Welcome, ${userData.name || result.user.displayName || "user"}!`,
              });
            } else {
              console.error("Backend authentication failed:", await res.text());
              toast({
                title: "Authentication Error",
                description: "Failed to complete authentication with the server",
                variant: "destructive",
              });
            }
          } catch (backendError) {
            console.error("Error communicating with backend:", backendError);
            toast({
              title: "Authentication Error",
              description: "Server error during authentication",
              variant: "destructive",
            });
          }
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
