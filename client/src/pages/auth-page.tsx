import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { Pause } from "lucide-react";

export default function AuthPage() {
  const { user, googleSignInMutation } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Prayer Tracker</CardTitle>
              <CardDescription className="text-lg mt-2">
                Sign in to track your prayers and connect with your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="flex flex-col items-center justify-center space-y-3">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/2038/2038898.png" 
                  alt="Prayer Illustration" 
                  className="w-32 h-32 opacity-80"
                />
                <p className="text-center text-gray-600">
                  Track your daily prayers, see your progress, and stay connected with your youth group
                </p>
              </div>
              
              <Button 
                type="button"
                size="lg"
                className="w-full py-6 text-lg"
                onClick={() => googleSignInMutation.mutate()}
                disabled={googleSignInMutation.isPending}
              >
                {googleSignInMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    width="24px"
                    height="24px"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    />
                  </svg>
                )}
                Sign in with Google
              </Button>
            </CardContent>
            <CardFooter className="justify-center text-sm text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="flex-1 bg-primary p-12 text-white flex flex-col justify-center items-center hidden md:flex">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <Pause className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Prayer Tracker</h1>
          <p className="text-lg mb-6">
            Welcome to our prayer tracking application. Track your daily prayers, see your progress, and 
            stay connected with your prayer community.
          </p>
          <p className="text-lg">
            Together, we can support our youth group through consistent prayer and accountability.
          </p>
        </div>
      </div>
    </div>
  );
}