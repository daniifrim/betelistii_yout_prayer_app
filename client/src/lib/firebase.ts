import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

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
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Successfully signed in with Google:", result.user.displayName);
    return {
      user: result.user,
      success: true,
    };
  } catch (error) {
    console.error("Error signing in with Google", error);
    // Provide more detailed error information
    let errorMessage = "Unknown error occurred";
    if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = "Authentication cancelled by user";
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = "Popup was blocked by the browser";
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = "Popup was closed before authentication completed";
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = "The domain is not authorized for Google authentication in Firebase console";
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = "Google sign-in is not properly configured. Please check Firebase console settings.";
    }
    
    return {
      user: null,
      success: false,
      error: {
        ...error,
        message: errorMessage
      },
    };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error signing out", error);
    return {
      success: false,
      error,
    };
  }
};

export { auth };