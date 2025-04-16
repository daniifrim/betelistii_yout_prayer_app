import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

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
const currentUrl = window.location.origin;
console.log("Current domain for authentication:", replitDomain);
console.log("Current URL:", currentUrl);

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
  // Add scopes for the Google provider
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  
  // Set custom parameters for better UX
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  // First try popup method, if it fails, fall back to redirect
  try {
    console.log("Attempting Google sign-in with popup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in with Google popup:", result.user.displayName);
    
    return {
      user: result.user,
      success: true
    };
  } catch (popupError: any) {
    console.error("Popup method failed, error:", popupError);
    
    // If popup fails for specific reasons, try redirect instead
    if (
      popupError.code === 'auth/popup-blocked' || 
      popupError.code === 'auth/popup-closed-by-user' ||
      popupError.code === 'auth/cancelled-popup-request'
    ) {
      try {
        console.log("Attempting Google sign-in with redirect instead...");
        await signInWithRedirect(auth, googleProvider);
        // If redirect succeeds, the page will reload so we won't reach this point
        return { success: true };
      } catch (redirectError: any) {
        console.error("Redirect method also failed, error:", redirectError);
        return {
          user: null,
          success: false,
          error: {
            code: redirectError.code || 'unknown-error',
            message: `Redirect sign-in failed: ${redirectError.message}`
          }
        };
      }
    }
    
    // If it's an unauthorized domain error, provide a clear message
    if (popupError.code === 'auth/unauthorized-domain') {
      const errorMessage = `The domain "${window.location.origin}" is not authorized for Google authentication. Please add "${window.location.hostname}" to your Firebase console's authorized domains list.`;
      
      console.error(errorMessage);
      return {
        user: null,
        success: false,
        error: {
          code: popupError.code,
          message: errorMessage
        }
      };
    }
    
    // For other errors, return the details
    return {
      user: null,
      success: false,
      error: {
        code: popupError.code || 'unknown-error',
        message: popupError.message || "Failed to authenticate with Google"
      }
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
      errorMessage = `The domain "${window.location.origin}" is not authorized for Google authentication. Please add "${window.location.hostname}" to your Firebase console's authorized domains list.`;
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