import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Add Replit domain to the list of domains to check for authentication
const replitDomain = window.location.hostname;
console.log("Current domain for authentication:", replitDomain);

// For debugging
console.log("Firebase config (without sensitive data):", {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // Add scopes for the Google provider
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    // Set custom parameters for better UX
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use redirect method instead of popup
    await signInWithRedirect(auth, googleProvider);
    
    // This won't be reached immediately because the page will redirect
    return {
      success: true
    };
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    console.error("Google sign-in error details:", error);
    
    // Provide more detailed error information
    let errorMessage = "Failed to start Google authentication";
    
    return {
      user: null,
      success: false,
      error: {
        code: error.code || 'unknown-error',
        message: errorMessage
      },
    };
  }
};

// This function needs to be called when the app loads to handle the redirect result
export const handleAuthRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    
    if (result) {
      console.log("Successfully signed in with Google:", result.user.displayName);
      return {
        user: result.user,
        success: true,
      };
    }
    
    return {
      user: null,
      success: true,
      noRedirect: true
    };
  } catch (error: any) {
    console.error("Error handling Google redirect", error);
    
    let errorMessage = "Failed to complete Google authentication";
    if (error.code === 'auth/unauthorized-domain') {
      errorMessage = "The domain is not authorized for Google authentication in Firebase console";
    }
    
    return {
      user: null,
      success: false,
      error: {
        code: error.code || 'unknown-error',
        message: errorMessage
      },
    };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Error signing out", error);
    return {
      success: false,
      error: {
        code: error.code || 'unknown-error',
        message: error.message || 'An error occurred during sign out'
      },
    };
  }
};

export { auth };