import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCefIR87KBVgS37OpyVWkUIeboi5eubCG8",
  authDomain: "navigator-4fc34.firebaseapp.com",
  projectId: "navigator-4fc34",
  storageBucket: "navigator-4fc34.firebasestorage.app",
  messagingSenderId: "1083834216354",
  appId: "1:1083834216354:web:c618d56255f41d88df8cfb",
  measurementId: "G-S7WZ494RJ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Initialize Auth
export const auth = getAuth(app);

export default app;

