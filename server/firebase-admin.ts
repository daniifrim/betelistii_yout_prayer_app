import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize the Firebase Admin SDK with proper configuration
// Note: Firebase Admin SDK auto-detects Google Cloud credentials in environment
// and doesn't need the same config as the client side
const app = initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
}, 'prayer-tracker-admin');

// Get the Auth service for the default app
const auth = getAuth(app);

console.log("Firebase Admin SDK initialized with projectId:", process.env.VITE_FIREBASE_PROJECT_ID);

export { auth };