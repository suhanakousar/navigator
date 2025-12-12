import type { RequestHandler } from "express";
import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // For local development without service account, we'll skip verification
    // In production, you should use a service account JSON file
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "navigator-4fc34",
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Local development: initialize with minimal config
      // Token verification will be skipped in development
      admin.initializeApp({
        projectId: "navigator-4fc34",
      });
    }
  } catch (error) {
    console.warn("Firebase Admin initialization warning:", error);
  }
}

export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  // Skip auth in local development if REPL_ID is not set
  if (!process.env.REPL_ID && process.env.NODE_ENV === "development") {
    // Create a mock user for local development
    (req as any).user = {
      uid: "local-dev-user",
      email: "dev@localhost",
      displayName: "Local Developer",
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Verify the token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    // In development, allow requests even if token verification fails
    if (process.env.NODE_ENV === "development" && !process.env.REPL_ID) {
      (req as any).user = {
        uid: "local-dev-user",
        email: "dev@localhost",
        displayName: "Local Developer",
      };
      return next();
    }
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};

export const isAuthenticated: RequestHandler = verifyFirebaseToken;

