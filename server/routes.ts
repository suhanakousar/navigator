import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { isAuthenticated } from "./firebaseAuth";
import { generateImageWithBytez, generateVideoWithBytez, generateVideoWithGoogle } from "./bytezService";
import { analyzeDocument } from "./documentService";
import { generateSuggestedActions } from "./reasonerService";
import { generateSpeechWithMurf, getMurfVoices } from "./murfService";
import { generateTextWithGemini, isGeminiAvailable } from "./geminiService";
// Import services that were dynamically imported - now static for bundling
import { isSambaNovaAvailable, generateChatCompletion } from "./sambanovaService";
import { executeWorkflow, getWorkflowStats } from "./workflowService";
import { getTemporaryFile, deleteTemporaryFile } from "./storageHelper";
import { prepareDataForStorage } from "./utils/sanitize";
import {
  insertProjectSchema,
  insertAssetSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertMemorySchema,
  insertJobSchema,
  insertWorkflowSchema,
  insertVoiceModelSchema,
  users,
} from "@shared/schema";
import OpenAI from "openai";

// OpenAI client (optional - will gracefully degrade if not configured)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Helper to get user ID from request
function getUserId(req: any): string {
  const user = req.user;
  // Firebase Admin SDK decoded tokens have 'uid'
  // JWT payload may have 'user_id' 
  // Also check 'sub' (subject) which is standard in JWT
  const userId = user?.uid || user?.user_id || user?.sub || user?.id;
  if (!userId) {
    console.warn("⚠️ No user ID found in token, using fallback:", JSON.stringify({ 
      hasUser: !!user, 
      userKeys: user ? Object.keys(user) : [] 
    }));
    return "local-dev-user";
  }
  return userId;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // ===== Health Check / Diagnostics =====
  app.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasSessionSecret: !!process.env.SESSION_SECRET,
          hasOpenaiKey: !!process.env.OPENAI_API_KEY,
          vercel: !!process.env.VERCEL,
        },
        // Test database connection
        database: "unknown" as string,
      };
      
      // Try to connect to database
      try {
        const { db } = await import("./db");
        await db.select().from(users).limit(1);
        health.database = "connected";
      } catch (dbError: any) {
        health.database = `error: ${dbError.message}`;
      }
      
      res.json(health);
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });

  // ===== Projects =====
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("📋 Fetching projects for user:", userId);
      
      // Ensure user exists in database
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user as any;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null,
        });
        console.log("✅ Created user:", userId);
      }
      
      const projects = await storage.getProjects(userId);
      console.log("✅ Found", projects.length, "projects");
      res.json(projects);
    } catch (error: any) {
      console.error("❌ Failed to fetch projects:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch projects", message: error.message });
    }
  });

  // Public project route (no auth required for public projects)
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      
      // If project is public, allow access without auth
      // If project is private, require auth and ownership
      if (!project.isPublic) {
        // Try to get user ID (may be undefined if not authenticated)
        try {
          const userId = getUserId(req);
          if (!userId || project.userId !== userId) {
            return res.status(404).json({ error: "Project not found" });
          }
        } catch {
          // Not authenticated, return 404 for private projects
          return res.status(404).json({ error: "Project not found" });
        }
      }
      
      // Fetch assets for this project
      const assets = await storage.getAssets(project.userId, project.id);
      
      res.json({
        ...project,
        assets,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Ensure user exists in database
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user as any;
        console.log("📋 Creating user from token:", JSON.stringify({ uid: userInfo?.uid, email: userInfo?.email, name: userInfo?.name }, null, 2));
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null,
        });
        console.log("✅ Created user:", userId);
      }
      
      // Validate and prepare data
      const title = req.body.title?.trim();
      const description = req.body.description?.trim() || null;
      
      if (!title || title.length === 0) {
        return res.status(400).json({ error: "Project title is required" });
      }

      // Ensure booleans are actual booleans, not strings
      const isPublic = req.body.isPublic === true || req.body.isPublic === "true" || false;
      const isStarred = req.body.isStarred === true || req.body.isStarred === "true" || false;

      const projectData = {
        userId,
        title,
        description: description && description.length > 0 ? description : null,
        isPublic,
        isStarred,
      };

      console.log("📋 Project creation request:", JSON.stringify(projectData, null, 2));

      // Validate with schema
      const data = insertProjectSchema.parse(projectData);
      console.log("✅ Validated project data:", JSON.stringify(data, null, 2));
      
      const project = await storage.createProject(data);
      console.log("✅ Project created:", project.id);
      res.status(201).json(project);
    } catch (error: any) {
      console.error("❌ Project creation error:", error);
      console.error("❌ Error stack:", error.stack);
      console.error("❌ Request body:", JSON.stringify(req.body, null, 2));
      console.error("❌ User ID extracted:", getUserId(req));
      if (error.issues) {
        console.error("❌ Zod validation errors:", JSON.stringify(error.issues, null, 2));
        const errorDetails = error.issues.map((issue: any) => ({
          path: issue.path?.join?.(".") || String(issue.path),
          message: issue.message,
          code: issue.code,
          received: issue.received,
        }));
        res.status(400).json({ 
          error: "Invalid project data", 
          details: errorDetails,
          message: error.message,
          received: req.body,
        });
      } else {
        res.status(400).json({ 
          error: "Invalid project data", 
          message: error.message,
          type: error.constructor?.name,
        });
      }
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== getUserId(req)) return res.status(404).json({ error: "Project not found" });
      
      const updated = await storage.updateProject(req.params.id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("❌ Project update error:", error);
      res.status(500).json({ error: "Failed to update project", message: error.message });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== getUserId(req)) return res.status(404).json({ error: "Project not found" });
      
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found or already deleted" });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error("❌ Failed to delete project:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ 
        error: "Failed to delete project", 
        message: error.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      });
    }
  });

  // ===== Assets =====
  app.get("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("📦 Fetching assets for user:", userId);
      
      // Ensure user exists in database
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user as any;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null,
        });
        console.log("✅ Created user:", userId);
      }
      
      const projectId = req.query.projectId as string | undefined;
      const assets = await storage.getAssets(userId, projectId);
      console.log("✅ Found", assets.length, "assets");
      res.json(assets);
    } catch (error: any) {
      console.error("❌ Failed to fetch assets:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch assets", message: error.message });
    }
  });

  app.post("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const data = insertAssetSchema.parse({ ...req.body, userId: getUserId(req) });
      const asset = await storage.createAsset(data);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ error: "Invalid asset data" });
    }
  });

  app.delete("/api/assets/:id", isAuthenticated, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) return res.status(404).json({ error: "Asset not found" });
      if (asset.userId !== getUserId(req)) return res.status(404).json({ error: "Asset not found" });
      await storage.deleteAsset(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // ===== Conversations =====
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations = await storage.getConversations(getUserId(req));
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Ensure user exists
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user as any;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null,
        });
      }
      
      const data = insertConversationSchema.parse({ ...req.body, userId });
      const conversation = await storage.createConversation(data);
      res.status(201).json(conversation);
    } catch (error: any) {
      console.error("❌ Conversation creation error:", error);
      if (error.issues) {
        res.status(400).json({ error: "Invalid conversation data", details: error.issues });
      } else {
        res.status(400).json({ error: "Invalid conversation data", message: error.message });
      }
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.userId !== getUserId(req)) return res.status(404).json({ error: "Conversation not found" });
      await storage.deleteConversation(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // ===== Messages =====
  app.get("/api/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.userId !== getUserId(req)) return res.status(404).json({ error: "Conversation not found" });
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.userId !== getUserId(req)) return res.status(404).json({ error: "Conversation not found" });
      const data = insertMessageSchema.parse({
        ...req.body,
        conversationId: req.params.conversationId,
      });
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  // ===== Chat Completion =====
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, conversationId } = req.body;

      // Get conversation history if conversationId provided
      let conversationHistory: any[] = [];
      if (conversationId) {
        const messages = await storage.getMessages(conversationId);
        conversationHistory = messages.map(m => ({
          role: m.role,
          content: m.content,
        }));
      }

      const systemPrompt = "You are LifeNavigator, a helpful AI assistant. Answer the user's questions directly and accurately. Be concise, clear, and helpful. If the user asks about a topic, provide a direct answer rather than introducing yourself again.";

      let assistantMessage = "";
      let usage: any = null;

      // Try SambaNova first (preferred for voice assistant)
      if (isSambaNovaAvailable()) {
        try {
          console.log("🤖 Using SambaNova AI for chat");
          console.log("🤖 User message:", message);
          console.log("🤖 Conversation history length:", conversationHistory.length);
          
          const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((msg: any) => ({
              role: (msg.role === "user" ? "user" : msg.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
              content: msg.content,
            })),
            { role: "user" as const, content: message },
          ];

          console.log("🤖 SambaNova messages being sent:", JSON.stringify(messages.map(m => ({ role: m.role, content: m.content.substring(0, 100) })), null, 2));

          const sambanovaResult = await generateChatCompletion({
            messages,
            model: "ALLaM-7B-Instruct-preview",
            stream: false,
            temperature: 0.8, // Increased for more varied responses
            max_tokens: 2000, // Increased token limit
          });

          if (sambanovaResult.error) {
            throw new Error(sambanovaResult.error);
          }

          assistantMessage = sambanovaResult.message || "I apologize, but I couldn't generate a response.";
          usage = sambanovaResult.usage;
          console.log("✅ SambaNova chat response generated");
        } catch (sambanovaError: any) {
          console.warn("⚠️ SambaNova chat failed, trying Gemini fallback:", sambanovaError.message);
        }
      }

      // Fallback to Gemini if SambaNova failed or not available
      if (!assistantMessage && isGeminiAvailable()) {
        try {
          console.log("🔮 Using Gemini AI for chat");
          // Build conversation context
          let fullPrompt = systemPrompt + "\n\n";
          if (conversationHistory.length > 0) {
            fullPrompt += "Previous conversation:\n";
            conversationHistory.forEach((msg, idx) => {
              fullPrompt += `${msg.role}: ${msg.content}\n`;
            });
          }
          fullPrompt += `\nUser: ${message}\nAssistant:`;

          const geminiResult = await generateTextWithGemini(fullPrompt, "gemini-1.5-flash");
          
          if (geminiResult.error) {
            throw new Error(geminiResult.error);
          }

          assistantMessage = geminiResult.text || "I apologize, but I couldn't generate a response.";
          console.log("✅ Gemini chat response generated");
        } catch (geminiError: any) {
          console.warn("⚠️ Gemini chat failed, trying OpenAI fallback:", geminiError.message);
        }
      }

      // Fallback to OpenAI if Gemini failed or not available
      if (!assistantMessage && openai) {
        try {
          console.log("🔄 Using OpenAI for chat (fallback)");
          const systemMessage = {
            role: "system" as const,
            content: systemPrompt,
          };

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              systemMessage,
              ...conversationHistory,
              { role: "user", content: message }
            ],
            max_tokens: 1000,
          });

          assistantMessage = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
          usage = completion.usage;
          console.log("✅ OpenAI chat response generated");
        } catch (openaiError: any) {
          console.error("❌ OpenAI chat also failed:", openaiError.message);
        }
      }

      // If all failed
      if (!assistantMessage) {
        return res.status(503).json({
          error: "AI not configured",
          message: "Please add your SAMBANOVA_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to enable AI features.",
          fallbackResponse: "I'm currently unavailable. Please configure the SAMBANOVA_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to enable AI chat features."
        });
      }

      res.json({
        message: assistantMessage,
        usage: usage,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate response", details: error.message });
    }
  });

  // ===== Image Generation =====
  app.post("/api/images/generate", isAuthenticated, async (req, res) => {
    try {
      const { prompt, style, size = "1024x1024", n = 1, provider = "bytez", projectId } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      let images: Array<{ url: string; revisedPrompt?: string }> = [];

      // Use Bytez.js by default, fallback to OpenAI if specified
      if (provider === "bytez" || !openai) {
        console.log("🖼️  Image Generation: Using Bytez.js");
        const bytezResult = await generateImageWithBytez({ prompt, style, size });

        if (bytezResult.error) {
          console.error("❌ Bytez failed:", bytezResult.error);
          console.log("📋 Bytez raw output:", JSON.stringify(bytezResult.raw, null, 2));
          
          // If Bytez fails and OpenAI is available, try OpenAI as fallback
          if (openai) {
            console.log("🔄 Bytez failed, falling back to OpenAI");
            try {
              const styledPrompt = style ? `${prompt}, in ${style} style` : prompt;
              const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: styledPrompt,
                n: Math.min(n, 1),
                size: size as "1024x1024" | "1792x1024" | "1024x1792",
                quality: "standard",
              });

              images = (response.data || []).map(img => ({
                url: img.url || "",
                revisedPrompt: img.revised_prompt,
              })).filter(img => img.url);
              console.log("✅ OpenAI fallback succeeded");
            } catch (openaiError: any) {
              console.error("❌ OpenAI fallback also failed:", openaiError.message);
              return res.status(503).json({
                error: "Image generation failed",
                message: `Bytez: ${bytezResult.error}. OpenAI fallback also failed: ${openaiError.message}`,
                fallbackResponse: "Image generation is currently unavailable. Please check your API keys."
              });
            }
          } else {
            console.error("❌ No fallback available - returning 503");
            return res.status(503).json({
              error: "Image generation failed",
              message: bytezResult.error || "Please configure BYTEZ_API_KEY or OPENAI_API_KEY",
              fallbackResponse: "Image generation is currently unavailable. Please check your API keys.",
              details: bytezResult.raw ? JSON.stringify(bytezResult.raw) : undefined
            });
          }
        } else {
          // Bytez succeeded
          const urls = bytezResult.urls || (bytezResult.url ? [bytezResult.url] : []);
          if (urls.length === 0) {
            console.error("❌ Bytez returned success but no URLs found");
            return res.status(503).json({
              error: "No images returned",
              message: "Image generation completed but no image URLs were returned",
              fallbackResponse: "Image generation failed. Please try again.",
              details: JSON.stringify(bytezResult.raw)
            });
          }
          console.log("✅ Bytez succeeded, returning", urls.length, "image(s)");
          images = urls.map(url => ({
            url,
            revisedPrompt: prompt,
          }));
        }
      } else if (provider === "openai" && openai) {
        // Use OpenAI explicitly
        const styledPrompt = style ? `${prompt}, in ${style} style` : prompt;
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: styledPrompt,
          n: Math.min(n, 1),
          size: size as "1024x1024" | "1792x1024" | "1024x1792",
          quality: "standard",
        });

        images = (response.data || []).map(img => ({
          url: img.url || "",
          revisedPrompt: img.revised_prompt,
        })).filter(img => img.url);
      } else {
        return res.status(503).json({
          error: "No image provider available",
          message: "Please configure BYTEZ_API_KEY or OPENAI_API_KEY",
        });
      }

      // Save all generated images as assets
      const userId = getUserId(req);
      const savedAssets: any[] = [];
      for (const img of images) {
        try {
          const asset = await storage.createAsset({
            userId,
            type: "image",
            name: prompt.slice(0, 50),
            url: img.url,
            projectId: projectId || null,
            metadata: {
              prompt,
              revisedPrompt: img.revisedPrompt || prompt,
              style,
              size,
              provider: provider || "bytez",
            },
          });
          savedAssets.push(asset);
        } catch (assetError) {
          console.error("Failed to save asset:", assetError);
          // Continue even if asset saving fails
        }
      }

      // Include asset IDs in response
      const imagesWithAssets = images.map((img, index) => ({
        ...img,
        assetId: savedAssets[index]?.id,
      }));

      res.json({
        images: imagesWithAssets,
        provider: provider || "bytez",
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate image", 
        details: error.message,
        fallbackResponse: "Image generation failed. Please try again or check your API configuration."
      });
    }
  });

  // ===== Video Generation =====
  app.post("/api/videos/generate", isAuthenticated, async (req, res) => {
    try {
      const { prompt, duration, projectId } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const userId = getUserId(req);
      console.log("🎬 Video Generation: Starting with prompt:", prompt);

      // Create a job for async video generation
      const job = await storage.createJob({
        userId,
        type: "video_generation",
        status: "pending",
        input: { prompt, duration, projectId },
      });

      console.log("✅ Video generation job created:", job.id);

      // Return immediately with job ID
      res.status(202).json({
        jobId: job.id,
        status: "pending",
        message: "Video generation started. Poll /api/jobs/:id for status.",
        pollUrl: `/api/jobs/${job.id}`,
      });

      // Process video generation in background (don't await - let it run)
      (async () => {
        try {
          // Update job status to processing
          await storage.updateJob(job.id, { status: "processing" });
          console.log("🎬 Video Generation: Processing job", job.id);

          // Try Google Veo first, fallback to Bytez
          let videoResult;
          let provider = "unknown";
          
          try {
            videoResult = await generateVideoWithGoogle({ prompt, duration });
            provider = "google-veo";
            if (videoResult.error) {
              console.log("⚠️ Google Veo failed, trying Bytez fallback...");
              videoResult = await generateVideoWithBytez({ prompt, duration });
              provider = "bytez";
            }
          } catch (googleError: any) {
            console.warn("⚠️ Google Veo error, trying Bytez fallback:", googleError.message);
            videoResult = await generateVideoWithBytez({ prompt, duration });
            provider = "bytez";
          }

          if (videoResult.error) {
            console.error("❌ Video generation failed:", videoResult.error);
            await storage.updateJob(job.id, {
              status: "failed",
              errorMessage: videoResult.error,
              completedAt: new Date(),
            });
            return;
          }

          // Get video URLs
          const urls = videoResult.urls || (videoResult.url ? [videoResult.url] : []);
          
          if (urls.length === 0) {
            console.error("❌ Video generation returned success but no video URLs found");
            await storage.updateJob(job.id, {
              status: "failed",
              errorMessage: "No video URLs returned",
              completedAt: new Date(),
            });
            return;
          }

          console.log("✅ Video generation succeeded, saving", urls.length, "video(s)");

          // Save generated videos as assets
          const savedVideos = [];
          
          for (const url of urls) {
            try {
              const asset = await storage.createAsset({
                userId,
                type: "video",
                name: prompt.slice(0, 50),
                url: url,
                projectId: projectId || null,
                metadata: { prompt, duration, provider },
              });
              savedVideos.push({
                id: asset.id,
                url: asset.url,
                prompt: prompt,
              });
            } catch (assetError) {
              console.error("Failed to save video asset:", assetError);
              // Continue even if asset saving fails
              savedVideos.push({
                id: `temp-${Date.now()}`,
                url: url,
                prompt: prompt,
              });
            }
          }

          // Update job with results
          await storage.updateJob(job.id, {
            status: "completed",
            result: {
              videos: savedVideos,
              provider,
            },
            resultUrl: savedVideos[0]?.url,
            completedAt: new Date(),
          });

          console.log("✅ Video generation job completed:", job.id);
        } catch (error: any) {
          console.error("❌ Video generation job error:", error);
          await storage.updateJob(job.id, {
            status: "failed",
            errorMessage: error.message || "Video generation failed",
            completedAt: new Date(),
          });
        }
      })(); // Don't await - let it run in background

    } catch (error: any) {
      console.error("Video generation request error:", error);
      res.status(500).json({ 
        error: "Failed to start video generation", 
        details: error.message,
      });
    }
  });

  // ===== Document Actions =====
  // Execute autofill (simulation - requires user consent)
  app.post("/api/documents/actions/autofill", isAuthenticated, async (req, res) => {
    try {
      const { mapping, targetUrl, consent } = req.body;

      if (!consent) {
        return res.status(400).json({ error: "User consent required for autofill" });
      }

      // For now, return simulation result
      // In production, you'd use Puppeteer to actually fill the form
      console.log("🔐 Autofill simulation requested for:", targetUrl);
      console.log("📋 Mapping:", mapping);

      res.json({
        success: true,
        status: "simulated",
        message: "Autofill simulation completed. In production, this would fill the form.",
        mapping: mapping,
      });
    } catch (error: any) {
      console.error("Autofill error:", error);
      res.status(500).json({ error: "Failed to execute autofill", details: error.message });
    }
  });

  // Send draft email (requires user consent)
  app.post("/api/documents/actions/email", isAuthenticated, async (req, res) => {
    try {
      const { to, subject, body, consent } = req.body;

      if (!consent) {
        return res.status(400).json({ error: "User consent required to send email" });
      }

      // For now, return draft (in production, send via SMTP/SendGrid)
      console.log("📧 Email draft prepared:", { to, subject });

      // Save email as memory/asset
      const userId = getUserId(req);
      try {
        await storage.createMemory({
          userId,
          key: `email_draft_${Date.now()}`,
          value: JSON.stringify({ to, subject, body }),
          consent: true,
        });
      } catch (memoryError) {
        console.error("Failed to save email draft:", memoryError);
      }

      res.json({
        success: true,
        message: "Email draft saved. In production, this would send the email.",
        email: { to, subject, body },
      });
    } catch (error: any) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to process email", details: error.message });
    }
  });

  // Create tasks from document
  app.post("/api/documents/actions/tasks", isAuthenticated, async (req, res) => {
    try {
      const { tasks } = req.body;

      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: "Tasks array is required" });
      }

      const userId = getUserId(req);
      const createdTasks = [];

      // Save tasks as jobs or in a tasks table
      for (const task of tasks) {
        try {
          const job = await storage.createJob({
            userId,
            type: "task",
            status: "pending",
            input: {
              title: task.title,
              description: task.description,
              due_date: task.due_date,
              priority: task.priority,
              estimated_time: task.estimated_time_minutes,
            },
          });
          createdTasks.push(job);
        } catch (jobError) {
          console.error("Failed to create task:", jobError);
        }
      }

      res.json({
        success: true,
        tasks: createdTasks,
        message: `Created ${createdTasks.length} task(s)`,
      });
    } catch (error: any) {
      console.error("Tasks error:", error);
      res.status(500).json({ error: "Failed to create tasks", details: error.message });
    }
  });

  // ===== Memory =====
  app.get("/api/memories", isAuthenticated, async (req, res) => {
    try {
      const memories = await storage.getMemories(getUserId(req));
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", isAuthenticated, async (req, res) => {
    try {
      const data = insertMemorySchema.parse({ ...req.body, userId: getUserId(req) });
      const memory = await storage.createMemory(data);
      res.status(201).json(memory);
    } catch (error) {
      res.status(400).json({ error: "Invalid memory data" });
    }
  });

  app.delete("/api/memories/:id", isAuthenticated, async (req, res) => {
    try {
      const memory = await storage.getMemory(req.params.id);
      if (!memory) return res.status(404).json({ error: "Memory not found" });
      if (memory.userId !== getUserId(req)) return res.status(404).json({ error: "Memory not found" });
      await storage.deleteMemory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete memory" });
    }
  });

  app.delete("/api/memories", isAuthenticated, async (req, res) => {
    try {
      await storage.clearMemories(getUserId(req));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear memories" });
    }
  });

  // ===== Jobs =====
  app.get("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getJobs(getUserId(req));
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.userId !== getUserId(req)) return res.status(404).json({ error: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const data = insertJobSchema.parse({ ...req.body, userId: getUserId(req) });
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ error: "Invalid job data" });
    }
  });

  // ===== Workflows =====
  app.get("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      const workflows = await storage.getWorkflows(getUserId(req));
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      console.log("📋 Creating workflow with data:", JSON.stringify(req.body, null, 2));
      const userId = getUserId(req);
      console.log("📋 User ID:", userId);
      
      // Ensure user exists in database (upsert if needed)
      let user = await storage.getUser(userId);
      if (!user) {
        console.log("👤 User not found, creating user:", userId);
        const userInfo = req.user as any;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null,
        });
        console.log("✅ User created/updated:", user.id);
      }
      
      // Prepare workflow data - Drizzle uses camelCase for TypeScript types
      const workflowData: any = {
        userId,
        name: req.body.name?.trim(),
        description: req.body.description?.trim() || null,
        nodes: Array.isArray(req.body.nodes) ? req.body.nodes : [],
        edges: Array.isArray(req.body.edges) ? req.body.edges : [],
        isActive: req.body.isActive ?? false,
      };
      
      // Validate required fields
      if (!workflowData.name || workflowData.name.length === 0) {
        return res.status(400).json({ error: "Workflow name is required" });
      }
      
      console.log("📋 Transformed data:", JSON.stringify(workflowData, null, 2));
      
      // Parse with Zod schema (now with lenient JSONB validation)
      const data = insertWorkflowSchema.parse(workflowData);
      console.log("📋 Parsed data:", JSON.stringify(data, null, 2));
      
      const workflow = await storage.createWorkflow(data);
      console.log("✅ Workflow created:", workflow.id);
      res.status(201).json(workflow);
    } catch (error: any) {
      console.error("❌ Workflow creation error:", error);
      console.error("❌ Error stack:", error.stack);
      
      if (error.issues) {
        // Zod validation errors
        console.error("❌ Zod validation errors:", JSON.stringify(error.issues, null, 2));
        const errorDetails = error.issues.map((issue: any) => ({
          path: issue.path?.join?.(".") || String(issue.path),
          message: issue.message,
          code: issue.code,
        }));
        res.status(400).json({ 
          error: "Invalid workflow data", 
          details: errorDetails,
          fullError: error.issues, // Include full error for debugging
        });
      } else if (error.errors) {
        console.error("❌ Validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid workflow data", details: error.errors });
      } else {
        console.error("❌ Unknown error type:", typeof error, error);
        res.status(400).json({ 
          error: "Invalid workflow data", 
          message: error.message || String(error),
          errorType: error.constructor?.name,
        });
      }
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== getUserId(req)) return res.status(404).json({ error: "Workflow not found" });
      const updated = await storage.updateWorkflow(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update workflow" });
    }
  });

  app.delete("/api/workflows/:id", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== getUserId(req)) return res.status(404).json({ error: "Workflow not found" });
      await storage.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  // Run a workflow
  app.post("/api/workflows/:id/run", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== getUserId(req)) return res.status(404).json({ error: "Workflow not found" });

      const run = await executeWorkflow(workflow, getUserId(req));
      res.json(run);
    } catch (error: any) {
      console.error("Workflow execution error:", error);
      res.status(500).json({ error: "Failed to execute workflow", message: error.message });
    }
  });

  // Get workflow runs
  app.get("/api/workflows/:id/runs", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== getUserId(req)) return res.status(404).json({ error: "Workflow not found" });

      const runs = await storage.getWorkflowRuns(req.params.id);
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow runs" });
    }
  });

  // Get workflow statistics
  app.get("/api/workflows/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== getUserId(req)) return res.status(404).json({ error: "Workflow not found" });

      const stats = await getWorkflowStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow stats" });
    }
  });

  // ===== Temporary File Storage (for ApyHub summarization) =====
  app.get("/api/temp-files/:fileId", async (req, res) => {
    try {
      const file = getTemporaryFile(req.params.fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="temp.txt"`);
      res.send(file.buffer);
      
      // Clean up after serving (optional - can keep for a while)
      // deleteTemporaryFile(req.params.fileId);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // ===== Document Analysis =====
  app.post("/api/documents/analyze", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const file = req.file;
      console.log("📄 Document upload:", {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });

      // Analyze the document
      const result = await analyzeDocument(file.buffer, file.originalname, file.mimetype);

      if (result.error) {
        return res.status(503).json({
          error: "Document analysis failed",
          message: result.error,
          fallbackResponse: result.error,
        });
      }

      // Generate suggested actions using reasoner (works with Bytez for summaries, OpenAI optional for other features)
      let suggestions = null;
      if (result.extractedData) {
        try {
          console.log("🤖 Generating suggested actions...");
          suggestions = await generateSuggestedActions(result.extractedData, result.summary);
          console.log("✅ Suggested actions generated");
        } catch (suggestionError: any) {
          console.error("❌ Failed to generate suggestions:", suggestionError);
          // Continue without suggestions
        }
      }

      // Save document as asset
      const userId = getUserId(req);
      let assetId: string | undefined;
      try {
        // Prepare metadata with sanitized and limited data
        const sanitizedExtractedData = prepareDataForStorage(result.extractedData, 3000);
        const sanitizedOcrText = result.ocrText 
          ? prepareDataForStorage({ ocrText: result.ocrText }, 3000).ocrText 
          : undefined;
        
        const asset = await storage.createAsset({
          userId,
          type: "document",
          name: file.originalname,
          url: `data:${file.mimetype};base64,${file.buffer.toString("base64").substring(0, 100)}`, // Truncated for storage
          metadata: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            extractedFields: result.fields || [],
            extractedData: sanitizedExtractedData,
            ocrText: sanitizedOcrText,
            ocrConfidence: result.ocrConfidence,
            suggestions: suggestions || null,
            analysisDate: new Date().toISOString(),
          },
        });
        assetId = asset.id;
        console.log("✅ Document asset saved successfully:", asset.id);
      } catch (assetError: any) {
        console.error("❌ Failed to save document asset:", assetError);
        // Continue even if asset saving fails - analysis still succeeded
      }

      // Prepare response with user-friendly error messages
      const response: any = {
        fields: result.fields || [],
        extractedData: result.extractedData,
        summary: result.summary || "",
        suggestions: suggestions || null,
        assetId: assetId,
        ocrText: result.ocrText,
        ocrConfidence: result.ocrConfidence,
      };

      // Add helpful messages for empty results
      if ((!result.fields || result.fields.length === 0) && !result.error) {
        response.message = "No structured data extracted. This may be because:\n" +
          "• Document is image-only and OCR failed (try a clearer scan)\n" +
          "• Document format is not fully supported\n" +
          "• Document is encrypted or corrupted\n\n" +
          "You can still view the extracted text in the OCR preview.";
        response.warning = true;
      }

      // Add message if Bytez plan error occurred (check suggestions summary)
      if (suggestions?.summary?.summary && 
          (suggestions.summary.summary.includes("plan") || 
           suggestions.summary.summary.includes("quota"))) {
        response.bytezWarning = "Premium summarization unavailable (model quota). Using fallback summary.";
      }

      res.json(response);
    } catch (error: any) {
      console.error("Document analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze document",
        details: error.message,
        fallbackResponse: "Document analysis failed. Please try again or check your API configuration.",
      });
    }
  });

  // ===== Document Actions =====
  // Form autofill simulation
  app.post("/api/documents/:assetId/autofill", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const { formSchema } = req.body;
      const userId = getUserId(req);

      // Get the document asset
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== userId) {
        return res.status(404).json({ error: "Document not found" });
      }

      const extractedData = (asset.metadata as any)?.extractedData || {};
      
      // Use reasoner service to generate form mapping
      if (!openai) {
        return res.status(503).json({
          error: "OpenAI not configured",
          message: "Form autofill requires OpenAI API key",
        });
      }

      const suggestions = await generateSuggestedActions(extractedData);
      
      // Log the action
      await storage.createDocumentActionLog({
        assetId,
        userId,
        actionType: "autofill",
        status: "success",
        dataUsed: { extractedData, formSchema },
        result: suggestions.autofill,
        confidenceScore: Math.round((suggestions.autofill.confidence || 0) * 100),
      });

      res.json({
        formMapping: suggestions.autofill.form_mapping,
        confidence: suggestions.autofill.confidence,
        missingFields: suggestions.autofill.missing_fields,
      });
    } catch (error: any) {
      console.error("Autofill error:", error);
      res.status(500).json({ error: "Failed to generate autofill mapping", details: error.message });
    }
  });

  // Get document action logs
  app.get("/api/documents/:assetId/logs", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const userId = getUserId(req);

      // Verify asset belongs to user
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== userId) {
        return res.status(404).json({ error: "Document not found" });
      }

      const logs = await storage.getDocumentActionLogs(assetId, userId);
      res.json({ logs });
    } catch (error: any) {
      console.error("Failed to fetch logs:", error);
      res.status(500).json({ error: "Failed to fetch action logs", details: error.message });
    }
  });

  // Execute document action (email, task, etc.)
  app.post("/api/documents/:assetId/actions", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const { actionType, actionData } = req.body;
      const userId = getUserId(req);

      // Get the document asset
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== userId) {
        return res.status(404).json({ error: "Document not found" });
      }

      const extractedData = (asset.metadata as any)?.extractedData || {};
      let result: any = {};
      let status: "success" | "failed" = "success";

      try {
        if (actionType === "email") {
          // Email action - return draft email
          const suggestions = await generateSuggestedActions(extractedData);
          result = suggestions.email;
        } else if (actionType === "task") {
          // Task action - return tasks
          const suggestions = await generateSuggestedActions(extractedData);
          result = suggestions.tasks;
        } else if (actionType === "summary") {
          // Summary action
          const suggestions = await generateSuggestedActions(extractedData);
          result = suggestions.summary;
        }

        // Log the action
        await storage.createDocumentActionLog({
          assetId,
          userId,
          actionType: actionType as any,
          status,
          dataUsed: { extractedData, actionData },
          result,
        });
      } catch (actionError: any) {
        status = "failed";
        await storage.createDocumentActionLog({
          assetId,
          userId,
          actionType: actionType as any,
          status: "failed",
          dataUsed: { extractedData, actionData },
          errorMessage: actionError.message,
        });
        throw actionError;
      }

      res.json({ result, status });
    } catch (error: any) {
      console.error("Action execution error:", error);
      res.status(500).json({ error: "Failed to execute action", details: error.message });
    }
  });

  // ===== Voice Generation =====
  app.post("/api/voice/generate", isAuthenticated, async (req, res) => {
    try {
      const { text, voiceId, speed, pitch, sampleRate, format, projectId } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }

      console.log("🎤 Voice Generation: Starting with text:", text.substring(0, 50));

      const result = await generateSpeechWithMurf({
        text: text.trim(),
        voiceId,
        speed,
        pitch,
        sampleRate,
        format,
      });

      if (result.error) {
        return res.status(503).json({
          error: "Voice generation failed",
          message: result.error,
          fallbackResponse: "Voice generation is currently unavailable. Please check your API configuration.",
        });
      }

      // Save audio as asset
      const userId = getUserId(req);
      if (result.audioUrl) {
        try {
          await storage.createAsset({
            userId,
            type: "voice",
            name: text.slice(0, 50),
            url: result.audioUrl,
            projectId: projectId || null,
            metadata: {
              text: text,
              voiceId: voiceId || "default",
              speed,
              pitch,
              provider: "murf",
            },
          });
        } catch (assetError) {
          console.error("Failed to save audio asset:", assetError);
          // Continue even if asset saving fails
        }
      }

      res.json({
        audioUrl: result.audioUrl,
        provider: "murf",
      });
    } catch (error: any) {
      console.error("Voice generation error:", error);
      res.status(500).json({
        error: "Failed to generate voice",
        details: error.message,
        fallbackResponse: "Voice generation failed. Please try again or check your API configuration.",
      });
    }
  });

  // Get available voices from Murf.ai
  app.get("/api/voice/voices", isAuthenticated, async (req, res) => {
    try {
      console.log("📞 /api/voice/voices endpoint called");
      const result = await getMurfVoices();
      
      console.log("📞 getMurfVoices result:", JSON.stringify({
        hasVoices: !!result.voices,
        voicesCount: result.voices?.length || 0,
        hasError: !!result.error,
        error: result.error
      }, null, 2));
      
      if (result.error) {
        console.error("❌ Error fetching voices:", result.error);
        return res.status(503).json({
          error: "Failed to fetch voices",
          message: result.error,
        });
      }

      const response = {
        voices: result.voices || [],
        provider: "murf",
      };
      
      console.log("📞 Sending response with", response.voices.length, "voices");
      console.log("📞 First voice sample:", response.voices.length > 0 ? JSON.stringify(response.voices[0], null, 2) : "none");
      
      res.json(response);
    } catch (error: any) {
      console.error("❌ Failed to fetch voices:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to fetch voices",
        details: error.message,
      });
    }
  });

  // ===== Voice Models =====
  app.get("/api/voice-models", isAuthenticated, async (req, res) => {
    try {
      const models = await storage.getVoiceModels(getUserId(req));
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice models" });
    }
  });

  app.post("/api/voice-models", isAuthenticated, async (req, res) => {
    try {
      const data = insertVoiceModelSchema.parse({ ...req.body, userId: getUserId(req) });
      const model = await storage.createVoiceModel(data);
      res.status(201).json(model);
    } catch (error) {
      res.status(400).json({ error: "Invalid voice model data" });
    }
  });

  app.delete("/api/voice-models/:id", isAuthenticated, async (req, res) => {
    try {
      const model = await storage.getVoiceModel(req.params.id);
      if (!model) return res.status(404).json({ error: "Voice model not found" });
      if (model.userId !== getUserId(req)) return res.status(404).json({ error: "Voice model not found" });
      await storage.deleteVoiceModel(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete voice model" });
    }
  });

  // ===== User Profile Update =====
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, preferences } = req.body;
      const user = await storage.upsertUser({
        id: getUserId(req),
        firstName,
        lastName,
        preferences,
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // WebSocket setup for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types
        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          case "subscribe":
            // Handle subscriptions for real-time updates
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
}
