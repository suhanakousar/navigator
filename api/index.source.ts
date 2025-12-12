// Vercel serverless function handler
// This file is used by Vercel to handle all API routes

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();

// Middleware
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// CORS middleware for Vercel
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      console.log(logLine);
    }
  });

  next();
});

// Initialize routes - do this once
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initialize() {
  if (initialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      console.log("🔄 Initializing routes...");
      console.log("📋 Environment check:", {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET,
      });
      
      const httpServer = createServer(app);
      await registerRoutes(httpServer, app);

      // Error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error("Express error:", err);
        if (!res.headersSent) {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          res.status(status).json({ 
            message,
            ...(process.env.NODE_ENV === "development" && { error: err.stack })
          });
        }
      });

      initialized = true;
      console.log("✅ Routes initialized successfully");
    } catch (error: any) {
      console.error("❌ Failed to initialize routes:", error);
      console.error("❌ Error stack:", error?.stack);
      throw error;
    }
  })();
  
  return initPromise;
}

// Export handler for Vercel
// Vercel expects a default export that handles the request
export default async function handler(req: Request, res: Response) {
  try {
    await initialize();
    
    // Process the request through Express
    // Wrap in a promise to ensure we wait for the response
    return new Promise<void>((resolve) => {
      // Track when response is finished
      const cleanup = () => {
        res.removeListener('finish', onFinish);
        res.removeListener('close', onClose);
        resolve();
      };
      
      const onFinish = () => cleanup();
      const onClose = () => cleanup();
      
      res.once('finish', onFinish);
      res.once('close', onClose);
      
      // Call Express app with error handler
      app(req, res, (err: any) => {
        if (err) {
          console.error("Express middleware error:", err);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: "Internal Server Error", 
              message: err?.message || "Failed to process request"
            });
          }
          cleanup();
        }
      });
    });
  } catch (error: any) {
    console.error("Handler error:", error);
    console.error("Handler error stack:", error?.stack);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal Server Error", 
        message: error?.message || "Failed to process request",
        ...(process.env.NODE_ENV === "development" && { stack: error?.stack })
      });
    }
    throw error;
  }
}

