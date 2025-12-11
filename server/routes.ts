import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertProjectSchema,
  insertAssetSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertMemorySchema,
  insertJobSchema,
  insertWorkflowSchema,
  insertVoiceModelSchema,
} from "@shared/schema";
import OpenAI from "openai";

// OpenAI client (optional - will gracefully degrade if not configured)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Setup authentication
  await setupAuth(app);

  // ===== Projects =====
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== req.user!.id) return res.status(404).json({ error: "Project not found" });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const data = insertProjectSchema.parse({ ...req.body, userId: req.user!.id });
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== req.user!.id) return res.status(404).json({ error: "Project not found" });
      const updated = await storage.updateProject(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== req.user!.id) return res.status(404).json({ error: "Project not found" });
      await storage.deleteProject(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ===== Assets =====
  app.get("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const projectId = req.query.projectId as string | undefined;
      const assets = await storage.getAssets(req.user!.id, projectId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const data = insertAssetSchema.parse({ ...req.body, userId: req.user!.id });
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
      if (asset.userId !== req.user!.id) return res.status(404).json({ error: "Asset not found" });
      await storage.deleteAsset(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // ===== Conversations =====
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations = await storage.getConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const data = insertConversationSchema.parse({ ...req.body, userId: req.user!.id });
      const conversation = await storage.createConversation(data);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(400).json({ error: "Invalid conversation data" });
    }
  });

  app.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.userId !== req.user!.id) return res.status(404).json({ error: "Conversation not found" });
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
      if (conversation.userId !== req.user!.id) return res.status(404).json({ error: "Conversation not found" });
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
      if (conversation.userId !== req.user!.id) return res.status(404).json({ error: "Conversation not found" });
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

      if (!openai) {
        return res.status(503).json({
          error: "OpenAI not configured",
          message: "Please add your OpenAI API key to enable AI features.",
          fallbackResponse: "I'm currently unavailable. Please configure the OpenAI API key to enable AI chat features."
        });
      }

      // Get conversation history if conversationId provided
      let conversationHistory: any[] = [];
      if (conversationId) {
        const messages = await storage.getMessages(conversationId);
        conversationHistory = messages.map(m => ({
          role: m.role,
          content: m.content,
        }));
      }

      // Add system message
      const systemMessage = {
        role: "system" as const,
        content: "You are LifeNavigator, a premium AI assistant specializing in creative tasks including voice generation, image creation, video production, document analysis, and workflow automation. Be helpful, concise, and maintain a professional yet friendly tone. When discussing your capabilities, emphasize the creative and productivity features you can help with."
      };

      // Create chat completion
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          systemMessage,
          ...conversationHistory,
          { role: "user", content: message }
        ],
        max_tokens: 1000,
      });

      const assistantMessage = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

      res.json({
        message: assistantMessage,
        usage: completion.usage,
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate response", details: error.message });
    }
  });

  // ===== Image Generation =====
  app.post("/api/images/generate", isAuthenticated, async (req, res) => {
    try {
      const { prompt, style, size = "1024x1024", n = 1 } = req.body;

      if (!openai) {
        return res.status(503).json({
          error: "OpenAI not configured",
          message: "Please add your OpenAI API key to enable image generation."
        });
      }

      // Enhance prompt with style
      const styledPrompt = style ? `${prompt}, in ${style} style` : prompt;

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: styledPrompt,
        n: Math.min(n, 1), // DALL-E 3 only supports n=1
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
        quality: "standard",
      });

      // Save as asset
      const imageUrl = response.data[0]?.url;
      if (imageUrl) {
        await storage.createAsset({
          userId: req.user!.id,
          type: "image",
          name: prompt.slice(0, 50),
          url: imageUrl,
          metadata: { prompt, style, size },
        });
      }

      res.json({
        images: response.data.map(img => ({
          url: img.url,
          revisedPrompt: img.revised_prompt,
        })),
      });
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: "Failed to generate image", details: error.message });
    }
  });

  // ===== Memory =====
  app.get("/api/memories", isAuthenticated, async (req, res) => {
    try {
      const memories = await storage.getMemories(req.user!.id);
      res.json(memories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });

  app.post("/api/memories", isAuthenticated, async (req, res) => {
    try {
      const data = insertMemorySchema.parse({ ...req.body, userId: req.user!.id });
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
      if (memory.userId !== req.user!.id) return res.status(404).json({ error: "Memory not found" });
      await storage.deleteMemory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete memory" });
    }
  });

  app.delete("/api/memories", isAuthenticated, async (req, res) => {
    try {
      await storage.clearMemories(req.user!.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear memories" });
    }
  });

  // ===== Jobs =====
  app.get("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getJobs(req.user!.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.userId !== req.user!.id) return res.status(404).json({ error: "Job not found" });
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const data = insertJobSchema.parse({ ...req.body, userId: req.user!.id });
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ error: "Invalid job data" });
    }
  });

  // ===== Workflows =====
  app.get("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      const workflows = await storage.getWorkflows(req.user!.id);
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.post("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      const data = insertWorkflowSchema.parse({ ...req.body, userId: req.user!.id });
      const workflow = await storage.createWorkflow(data);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ error: "Invalid workflow data" });
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== req.user!.id) return res.status(404).json({ error: "Workflow not found" });
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
      if (workflow.userId !== req.user!.id) return res.status(404).json({ error: "Workflow not found" });
      await storage.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  });

  // ===== Voice Models =====
  app.get("/api/voice-models", isAuthenticated, async (req, res) => {
    try {
      const models = await storage.getVoiceModels(req.user!.id);
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice models" });
    }
  });

  app.post("/api/voice-models", isAuthenticated, async (req, res) => {
    try {
      const data = insertVoiceModelSchema.parse({ ...req.body, userId: req.user!.id });
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
      if (model.userId !== req.user!.id) return res.status(404).json({ error: "Voice model not found" });
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
        id: req.user!.id,
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
