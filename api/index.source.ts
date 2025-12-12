// Vercel serverless function handler
// This file is used by Vercel to handle all API routes

import express from "express";
import { createServer } from "http";

const app = express();

// Lazy import to catch any import-time errors
let registerRoutes: any = null;
async function loadRoutes() {
  if (!registerRoutes) {
    try {
      const routesModule = await import("../server/routes");
      registerRoutes = routesModule.registerRoutes;
    } catch (error: any) {
      console.error("❌ Failed to import routes:", error);
      console.error("❌ Routes import error stack:", error?.stack);
      throw new Error(`Failed to load routes module: ${error.message}`);
    }
  }
  return registerRoutes;
}

// Simple test endpoint that doesn't require database - register early
if (app && app.get) {
  app.get("/api/test", (req: any, res: any) => {
    try {
      res.json({ 
        status: "ok", 
        message: "API function is working",
        timestamp: new Date().toISOString(),
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasSessionSecret: !!process.env.SESSION_SECRET,
          nodeEnv: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL,
        }
      });
    } catch (error: any) {
      console.error("Test endpoint error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Test endpoint failed", message: error.message });
      }
    }
  });
}

// Middleware - only if app is properly initialized
if (app && typeof app.use === 'function') {
  app.use(
    express.json({
      verify: (req: any, _res: any, buf: any) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));
}

// CORS middleware for Vercel
if (app && typeof app.use === 'function') {
  app.use((req: any, res: any, next: any) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}

// Logging middleware
if (app && typeof app.use === 'function') {
  app.use((req: any, res: any, next: any) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson: any, ...args: any[]) {
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
}

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
        vercelEnv: process.env.VERCEL ? "yes" : "no",
      });
      
      // Validate required environment variables
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is required but not set");
      }
      
      // Load routes module (lazy import to catch import errors)
      const routesFn = await loadRoutes();
      
      const httpServer = createServer(app);
      await routesFn(httpServer, app);

      // Error handler
      app.use((err: any, _req: any, res: any, _next: any) => {
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
export default async function handler(req: any, res: any) {
  // Log that handler was called
  console.log("📥 Handler called:", req.method, req.url);
  
  // Wrap everything in try-catch to prevent unhandled errors
  try {
    // If app failed to initialize, return error immediately
    if (!app) {
      console.error("❌ Express app not initialized");
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Server Initialization Error",
          message: "Failed to initialize Express application"
        });
      }
      return;
    }
    // Check for required environment variables first
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL is not set");
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: "Server Configuration Error",
          message: "DATABASE_URL environment variable is not set. Please configure it in Vercel project settings.",
          hint: "Go to Vercel Dashboard → Settings → Environment Variables → Add DATABASE_URL"
        });
      }
      return;
    }

    await initialize();
    
    // Process the request through Express
    // Wrap in a promise to ensure we wait for the response
    return new Promise<void>((resolve, reject) => {
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
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({ 
            error: "Request Timeout",
            message: "The request took too long to process"
          });
        }
        cleanup();
      }, 25000); // 25 seconds (before Vercel's 30s limit)
      
      // Call Express app with error handler
      app(req, res, (err: any) => {
        clearTimeout(timeout);
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
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    
    if (!res.headersSent) {
      // Check for specific error types
      if (error?.message?.includes("DATABASE_URL")) {
        res.status(500).json({ 
          error: "Database Configuration Error",
          message: "Database connection is not configured. Please set DATABASE_URL in Vercel environment variables.",
          hint: "Use a serverless-compatible database like Neon.tech (https://neon.tech)"
        });
      } else if (error?.message?.includes("SESSION_SECRET")) {
        res.status(500).json({ 
          error: "Session Configuration Error",
          message: "SESSION_SECRET environment variable is not set. Please configure it in Vercel project settings."
        });
      } else {
        res.status(500).json({ 
          error: "Internal Server Error", 
          message: error?.message || "Failed to process request",
          ...(process.env.NODE_ENV === "development" && { stack: error?.stack })
        });
      }
    }
    // Don't throw - we've already sent a response
    return;
  }
}

