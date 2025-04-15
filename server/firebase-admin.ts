import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize the Firebase Admin SDK
const app = initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const auth = getAuth(app);

export { auth };