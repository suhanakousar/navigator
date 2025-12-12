// @ts-nocheck

var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  assetTypeEnum: () => assetTypeEnum,
  assets: () => assets,
  conversations: () => conversations,
  documentActionLogs: () => documentActionLogs,
  documentActionStatusEnum: () => documentActionStatusEnum,
  documentActionTypeEnum: () => documentActionTypeEnum,
  insertAssetSchema: () => insertAssetSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertDocumentActionLogSchema: () => insertDocumentActionLogSchema,
  insertJobSchema: () => insertJobSchema,
  insertMemorySchema: () => insertMemorySchema,
  insertMessageSchema: () => insertMessageSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertUserSchema: () => insertUserSchema,
  insertVoiceModelSchema: () => insertVoiceModelSchema,
  insertWorkflowRunSchema: () => insertWorkflowRunSchema,
  insertWorkflowSchema: () => insertWorkflowSchema,
  jobStatusEnum: () => jobStatusEnum,
  jobs: () => jobs,
  memories: () => memories,
  messageRoleEnum: () => messageRoleEnum,
  messages: () => messages,
  projects: () => projects,
  sessions: () => sessions,
  users: () => users,
  voiceModels: () => voiceModels,
  workflowRuns: () => workflowRuns,
  workflows: () => workflows
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var assetTypeEnum, jobStatusEnum, messageRoleEnum, documentActionTypeEnum, documentActionStatusEnum, sessions, users, projects, assets, conversations, messages, memories, jobs, workflows, workflowRuns, voiceModels, documentActionLogs, insertUserSchema, insertProjectSchema, insertAssetSchema, insertConversationSchema, insertMessageSchema, insertMemorySchema, insertJobSchema, insertWorkflowSchema, insertWorkflowRunSchema, insertVoiceModelSchema, insertDocumentActionLogSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    assetTypeEnum = pgEnum("asset_type", ["voice", "image", "video", "document"]);
    jobStatusEnum = pgEnum("job_status", ["pending", "processing", "completed", "failed"]);
    messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);
    documentActionTypeEnum = pgEnum("document_action_type", ["autofill", "email", "task", "summary", "extract"]);
    documentActionStatusEnum = pgEnum("document_action_status", ["success", "failed", "pending", "needs_input"]);
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      onboardingCompleted: boolean("onboarding_completed").default(false),
      preferences: jsonb("preferences").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    projects = pgTable("projects", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      title: varchar("title").notNull(),
      description: text("description"),
      isPublic: boolean("is_public").default(false),
      isStarred: boolean("is_starred").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    assets = pgTable("assets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      projectId: varchar("project_id").references(() => projects.id),
      userId: varchar("user_id").notNull().references(() => users.id),
      type: assetTypeEnum("type").notNull(),
      name: varchar("name").notNull(),
      url: varchar("url"),
      thumbnailUrl: varchar("thumbnail_url"),
      metadata: jsonb("metadata").default({}),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    conversations = pgTable("conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      title: varchar("title").default("New Conversation"),
      projectId: varchar("project_id").references(() => projects.id),
      isPinned: boolean("is_pinned").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
      role: messageRoleEnum("role").notNull(),
      content: text("content").notNull(),
      audioUrl: varchar("audio_url"),
      createdAt: timestamp("created_at").defaultNow()
    });
    memories = pgTable("memories", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      key: varchar("key").notNull(),
      value: text("value").notNull(),
      consent: boolean("consent").default(true),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    jobs = pgTable("jobs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      type: varchar("type").notNull(),
      status: jobStatusEnum("status").default("pending"),
      input: jsonb("input").default({}),
      result: jsonb("result"),
      resultUrl: varchar("result_url"),
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    workflows = pgTable("workflows", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      name: varchar("name").notNull(),
      description: text("description"),
      nodes: jsonb("nodes").default([]),
      edges: jsonb("edges").default([]),
      isActive: boolean("is_active").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    workflowRuns = pgTable("workflow_runs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      workflowId: varchar("workflow_id").notNull().references(() => workflows.id),
      userId: varchar("user_id").notNull().references(() => users.id),
      status: jobStatusEnum("status").default("pending"),
      logs: jsonb("logs").default([]),
      createdAt: timestamp("created_at").defaultNow(),
      completedAt: timestamp("completed_at")
    });
    voiceModels = pgTable("voice_models", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      name: varchar("name").notNull(),
      isPreset: boolean("is_preset").default(false),
      voiceId: varchar("voice_id"),
      settings: jsonb("settings").default({}),
      createdAt: timestamp("created_at").defaultNow()
    });
    documentActionLogs = pgTable("document_action_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      assetId: varchar("asset_id").references(() => assets.id),
      userId: varchar("user_id").notNull().references(() => users.id),
      actionType: documentActionTypeEnum("action_type").notNull(),
      status: documentActionStatusEnum("status").default("pending"),
      dataUsed: jsonb("data_used").default({}),
      result: jsonb("result"),
      confidenceScore: integer("confidence_score"),
      errorMessage: text("error_message"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
    insertProjectSchema = z.object({
      userId: z.string().min(1),
      title: z.string().min(1).max(255),
      description: z.union([z.string(), z.null()]).optional(),
      isPublic: z.boolean().optional().default(false),
      isStarred: z.boolean().optional().default(false)
    });
    insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
    insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
    insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
    insertMemorySchema = createInsertSchema(memories).omit({ id: true, createdAt: true });
    insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, completedAt: true });
    insertWorkflowSchema = z.object({
      userId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      nodes: z.any().optional().default([]),
      // JSONB - accept any JSON
      edges: z.any().optional().default([]),
      // JSONB - accept any JSON
      isActive: z.boolean().optional().default(false)
    });
    insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({ id: true, createdAt: true, completedAt: true });
    insertVoiceModelSchema = createInsertSchema(voiceModels).omit({ id: true, createdAt: true });
    insertDocumentActionLogSchema = createInsertSchema(documentActionLogs).omit({ id: true, createdAt: true });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool
});
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
function getPool() {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?\n\nTo set up locally:\n1. Create a .env file in the project root\n2. Add: DATABASE_URL=postgresql://user:password@localhost:5432/dbname\n3. For a quick setup, use Docker: docker run --name neon-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=neon -p 5432:5432 -d postgres:15\n   Then use: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neon\n4. Or get a free database from: https://neon.tech\n5. For Vercel: Add DATABASE_URL in Vercel project settings \u2192 Environment Variables"
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}
function getDb() {
  if (!_db) {
    _db = drizzle(getPool(), { schema: schema_exports });
  }
  return _db;
}
var Pool, _pool, _db, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pg);
    pool = new Proxy({}, {
      get(_target, prop) {
        const actualPool = getPool();
        const value = actualPool[prop];
        return typeof value === "function" ? value.bind(actualPool) : value;
      }
    });
    db = new Proxy({}, {
      get(_target, prop) {
        const actualDb = getDb();
        const value = actualDb[prop];
        return typeof value === "function" ? value.bind(actualDb) : value;
      }
    });
  }
});

// server/utils/sanitize.ts
var sanitize_exports = {};
__export(sanitize_exports, {
  cleanObject: () => cleanObject,
  limitTextLength: () => limitTextLength,
  prepareDataForStorage: () => prepareDataForStorage,
  sanitizeExtractedData: () => sanitizeExtractedData,
  sanitizeForJSON: () => sanitizeForJSON,
  sanitizeText: () => sanitizeText
});
function sanitizeForJSON(str) {
  if (!str) return "";
  return str.replace(/\u0000/g, "").replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, (c) => {
    if (c === "\n" || c === "\r" || c === "	") return c;
    return "";
  }).trim();
}
function cleanObject(obj) {
  if (obj === null || obj === void 0) return obj;
  if (typeof obj === "string") {
    return sanitizeForJSON(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  }
  if (obj && typeof obj === "object") {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanObject(value);
    }
    return cleaned;
  }
  return obj;
}
function limitTextLength(text2, maxLength = 3e3) {
  if (!text2 || text2.length <= maxLength) return text2;
  return text2.substring(0, maxLength) + "...";
}
function prepareDataForStorage(data, maxSnippetLength = 3e3) {
  if (!data) return data;
  const cleaned = cleanObject(data);
  if (cleaned.raw_text_snippet && typeof cleaned.raw_text_snippet === "string") {
    cleaned.raw_text_snippet = limitTextLength(cleaned.raw_text_snippet, maxSnippetLength);
  }
  if (cleaned.ocrText && typeof cleaned.ocrText === "string") {
    cleaned.ocrText = limitTextLength(cleaned.ocrText, maxSnippetLength);
  }
  return cleaned;
}
var sanitizeText, sanitizeExtractedData;
var init_sanitize = __esm({
  "server/utils/sanitize.ts"() {
    "use strict";
    sanitizeText = sanitizeForJSON;
    sanitizeExtractedData = cleanObject;
  }
});

// server/storage.ts
import { eq, and, desc } from "drizzle-orm";
var DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    DatabaseStorage = class {
      // User operations
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user;
      }
      async upsertUser(userData) {
        const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return user;
      }
      // Project operations
      async getProjects(userId) {
        return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
      }
      async getProject(id) {
        const [project] = await db.select().from(projects).where(eq(projects.id, id));
        return project;
      }
      async createProject(project) {
        const [created] = await db.insert(projects).values(project).returning();
        return created;
      }
      async updateProject(id, project) {
        const [updated] = await db.update(projects).set({ ...project, updatedAt: /* @__PURE__ */ new Date() }).where(eq(projects.id, id)).returning();
        return updated;
      }
      async deleteProject(id) {
        try {
          await db.delete(assets).where(eq(assets.projectId, id));
          const projectConversations = await db.select().from(conversations).where(eq(conversations.projectId, id));
          for (const conv of projectConversations) {
            await db.delete(messages).where(eq(messages.conversationId, conv.id));
            await db.delete(conversations).where(eq(conversations.id, conv.id));
          }
          const result = await db.delete(projects).where(eq(projects.id, id)).returning();
          return result.length > 0;
        } catch (error) {
          console.error("\u274C Error deleting project:", error);
          throw error;
        }
      }
      // Asset operations
      async getAssets(userId, projectId) {
        if (projectId) {
          return db.select().from(assets).where(and(eq(assets.userId, userId), eq(assets.projectId, projectId))).orderBy(desc(assets.createdAt));
        }
        return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
      }
      async getAsset(id) {
        const [asset] = await db.select().from(assets).where(eq(assets.id, id));
        return asset;
      }
      async createAsset(asset) {
        const { cleanObject: cleanObject2 } = await Promise.resolve().then(() => (init_sanitize(), sanitize_exports));
        const sanitizedAsset = {
          ...asset,
          metadata: asset.metadata ? cleanObject2(asset.metadata) : {}
        };
        const [created] = await db.insert(assets).values(sanitizedAsset).returning();
        return created;
      }
      async updateAsset(id, asset) {
        const { cleanObject: cleanObject2 } = await Promise.resolve().then(() => (init_sanitize(), sanitize_exports));
        const sanitizedAsset = {
          ...asset,
          metadata: asset.metadata ? cleanObject2(asset.metadata) : void 0,
          updatedAt: /* @__PURE__ */ new Date()
        };
        const [updated] = await db.update(assets).set(sanitizedAsset).where(eq(assets.id, id)).returning();
        return updated;
      }
      async deleteAsset(id) {
        const result = await db.delete(assets).where(eq(assets.id, id)).returning();
        return result.length > 0;
      }
      // Conversation operations
      async getConversations(userId) {
        return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
      }
      async getConversation(id) {
        const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
        return conversation;
      }
      async createConversation(conversation) {
        const [created] = await db.insert(conversations).values(conversation).returning();
        return created;
      }
      async updateConversation(id, conversation) {
        const [updated] = await db.update(conversations).set({ ...conversation, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id)).returning();
        return updated;
      }
      async deleteConversation(id) {
        const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
        return result.length > 0;
      }
      // Message operations
      async getMessages(conversationId) {
        return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      }
      async createMessage(message) {
        const [created] = await db.insert(messages).values(message).returning();
        await db.update(conversations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, message.conversationId));
        return created;
      }
      // Memory operations
      async getMemories(userId) {
        return db.select().from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.createdAt));
      }
      async getMemory(id) {
        const [memory] = await db.select().from(memories).where(eq(memories.id, id));
        return memory;
      }
      async createMemory(memory) {
        const [created] = await db.insert(memories).values(memory).returning();
        return created;
      }
      async deleteMemory(id) {
        const result = await db.delete(memories).where(eq(memories.id, id)).returning();
        return result.length > 0;
      }
      async clearMemories(userId) {
        const result = await db.delete(memories).where(eq(memories.userId, userId)).returning();
        return result.length > 0;
      }
      // Job operations
      async getJobs(userId) {
        return db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
      }
      async getJob(id) {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
        return job;
      }
      async createJob(job) {
        const [created] = await db.insert(jobs).values(job).returning();
        return created;
      }
      async updateJob(id, job) {
        const [updated] = await db.update(jobs).set(job).where(eq(jobs.id, id)).returning();
        return updated;
      }
      // Workflow operations
      async getWorkflows(userId) {
        return db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt));
      }
      async getWorkflow(id) {
        const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
        return workflow;
      }
      async createWorkflow(workflow) {
        const [created] = await db.insert(workflows).values(workflow).returning();
        return created;
      }
      async updateWorkflow(id, workflow) {
        const [updated] = await db.update(workflows).set({ ...workflow, updatedAt: /* @__PURE__ */ new Date() }).where(eq(workflows.id, id)).returning();
        return updated;
      }
      async deleteWorkflow(id) {
        const result = await db.delete(workflows).where(eq(workflows.id, id)).returning();
        return result.length > 0;
      }
      // Workflow run operations
      async getWorkflowRuns(workflowId) {
        return db.select().from(workflowRuns).where(eq(workflowRuns.workflowId, workflowId)).orderBy(desc(workflowRuns.createdAt));
      }
      async getWorkflowRun(id) {
        const [run] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, id));
        return run;
      }
      async createWorkflowRun(run) {
        const [created] = await db.insert(workflowRuns).values(run).returning();
        return created;
      }
      async updateWorkflowRun(id, run) {
        const [updated] = await db.update(workflowRuns).set(run).where(eq(workflowRuns.id, id)).returning();
        return updated;
      }
      // Voice model operations
      async getVoiceModels(userId) {
        return db.select().from(voiceModels).where(eq(voiceModels.userId, userId)).orderBy(desc(voiceModels.createdAt));
      }
      async getVoiceModel(id) {
        const [model] = await db.select().from(voiceModels).where(eq(voiceModels.id, id));
        return model;
      }
      async createVoiceModel(model) {
        const [created] = await db.insert(voiceModels).values(model).returning();
        return created;
      }
      async deleteVoiceModel(id) {
        const result = await db.delete(voiceModels).where(eq(voiceModels.id, id)).returning();
        return result.length > 0;
      }
      // Document action log operations
      async getDocumentActionLogs(assetId, userId) {
        return await db.select().from(documentActionLogs).where(and(eq(documentActionLogs.assetId, assetId), eq(documentActionLogs.userId, userId))).orderBy(desc(documentActionLogs.createdAt));
      }
      async createDocumentActionLog(log) {
        const [newLog] = await db.insert(documentActionLogs).values(log).returning();
        return newLog;
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/firebaseAuth.ts
import admin from "firebase-admin";
var verifyFirebaseToken, isAuthenticated;
var init_firebaseAuth = __esm({
  "server/firebaseAuth.ts"() {
    "use strict";
    if (!admin.apps.length) {
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: "navigator-4fc34"
          });
        } else if (process.env.FIREBASE_PROJECT_ID) {
          admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID
          });
        } else {
          admin.initializeApp({
            projectId: "navigator-4fc34"
          });
        }
      } catch (error) {
        console.warn("Firebase Admin initialization warning:", error);
      }
    }
    verifyFirebaseToken = async (req, res, next) => {
      if (!process.env.REPL_ID && false) {
        req.user = {
          uid: "local-dev-user",
          email: "dev@localhost",
          displayName: "Local Developer"
        };
        return next();
      }
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
      }
      const token = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
      } catch (error) {
        console.error("Token verification error:", error);
        if (false) {
          req.user = {
            uid: "local-dev-user",
            email: "dev@localhost",
            displayName: "Local Developer"
          };
          return next();
        }
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
      }
    };
    isAuthenticated = verifyFirebaseToken;
  }
});

// node_modules/@google/generative-ai/dist/index.mjs
function getClientHeaders(requestOptions) {
  const clientHeaders = [];
  if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.apiClient) {
    clientHeaders.push(requestOptions.apiClient);
  }
  clientHeaders.push(`${PACKAGE_LOG_HEADER}/${PACKAGE_VERSION}`);
  return clientHeaders.join(" ");
}
async function getHeaders(url) {
  var _a;
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("x-goog-api-client", getClientHeaders(url.requestOptions));
  headers.append("x-goog-api-key", url.apiKey);
  let customHeaders = (_a = url.requestOptions) === null || _a === void 0 ? void 0 : _a.customHeaders;
  if (customHeaders) {
    if (!(customHeaders instanceof Headers)) {
      try {
        customHeaders = new Headers(customHeaders);
      } catch (e) {
        throw new GoogleGenerativeAIRequestInputError(`unable to convert customHeaders value ${JSON.stringify(customHeaders)} to Headers: ${e.message}`);
      }
    }
    for (const [headerName, headerValue] of customHeaders.entries()) {
      if (headerName === "x-goog-api-key") {
        throw new GoogleGenerativeAIRequestInputError(`Cannot set reserved header name ${headerName}`);
      } else if (headerName === "x-goog-api-client") {
        throw new GoogleGenerativeAIRequestInputError(`Header name ${headerName} can only be set using the apiClient field`);
      }
      headers.append(headerName, headerValue);
    }
  }
  return headers;
}
async function constructModelRequest(model, task, apiKey2, stream, body, requestOptions) {
  const url = new RequestUrl(model, task, apiKey2, stream, requestOptions);
  return {
    url: url.toString(),
    fetchOptions: Object.assign(Object.assign({}, buildFetchOptions(requestOptions)), { method: "POST", headers: await getHeaders(url), body })
  };
}
async function makeModelRequest(model, task, apiKey2, stream, body, requestOptions = {}, fetchFn = fetch) {
  const { url, fetchOptions } = await constructModelRequest(model, task, apiKey2, stream, body, requestOptions);
  return makeRequest(url, fetchOptions, fetchFn);
}
async function makeRequest(url, fetchOptions, fetchFn = fetch) {
  let response;
  try {
    response = await fetchFn(url, fetchOptions);
  } catch (e) {
    handleResponseError(e, url);
  }
  if (!response.ok) {
    await handleResponseNotOk(response, url);
  }
  return response;
}
function handleResponseError(e, url) {
  let err = e;
  if (err.name === "AbortError") {
    err = new GoogleGenerativeAIAbortError(`Request aborted when fetching ${url.toString()}: ${e.message}`);
    err.stack = e.stack;
  } else if (!(e instanceof GoogleGenerativeAIFetchError || e instanceof GoogleGenerativeAIRequestInputError)) {
    err = new GoogleGenerativeAIError(`Error fetching from ${url.toString()}: ${e.message}`);
    err.stack = e.stack;
  }
  throw err;
}
async function handleResponseNotOk(response, url) {
  let message = "";
  let errorDetails;
  try {
    const json = await response.json();
    message = json.error.message;
    if (json.error.details) {
      message += ` ${JSON.stringify(json.error.details)}`;
      errorDetails = json.error.details;
    }
  } catch (e) {
  }
  throw new GoogleGenerativeAIFetchError(`Error fetching from ${url.toString()}: [${response.status} ${response.statusText}] ${message}`, response.status, response.statusText, errorDetails);
}
function buildFetchOptions(requestOptions) {
  const fetchOptions = {};
  if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) !== void 0 || (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
    const controller = new AbortController();
    if ((requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.timeout) >= 0) {
      setTimeout(() => controller.abort(), requestOptions.timeout);
    }
    if (requestOptions === null || requestOptions === void 0 ? void 0 : requestOptions.signal) {
      requestOptions.signal.addEventListener("abort", () => {
        controller.abort();
      });
    }
    fetchOptions.signal = controller.signal;
  }
  return fetchOptions;
}
function addHelpers(response) {
  response.text = () => {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(`This response had ${response.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`);
      }
      if (hadBadFinishReason(response.candidates[0])) {
        throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
      }
      return getText(response);
    } else if (response.promptFeedback) {
      throw new GoogleGenerativeAIResponseError(`Text not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return "";
  };
  response.functionCall = () => {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(`This response had ${response.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`);
      }
      if (hadBadFinishReason(response.candidates[0])) {
        throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
      }
      console.warn(`response.functionCall() is deprecated. Use response.functionCalls() instead.`);
      return getFunctionCalls(response)[0];
    } else if (response.promptFeedback) {
      throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return void 0;
  };
  response.functionCalls = () => {
    if (response.candidates && response.candidates.length > 0) {
      if (response.candidates.length > 1) {
        console.warn(`This response had ${response.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`);
      }
      if (hadBadFinishReason(response.candidates[0])) {
        throw new GoogleGenerativeAIResponseError(`${formatBlockErrorMessage(response)}`, response);
      }
      return getFunctionCalls(response);
    } else if (response.promptFeedback) {
      throw new GoogleGenerativeAIResponseError(`Function call not available. ${formatBlockErrorMessage(response)}`, response);
    }
    return void 0;
  };
  return response;
}
function getText(response) {
  var _a, _b, _c, _d;
  const textStrings = [];
  if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
    for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
      if (part.text) {
        textStrings.push(part.text);
      }
      if (part.executableCode) {
        textStrings.push("\n```" + part.executableCode.language + "\n" + part.executableCode.code + "\n```\n");
      }
      if (part.codeExecutionResult) {
        textStrings.push("\n```\n" + part.codeExecutionResult.output + "\n```\n");
      }
    }
  }
  if (textStrings.length > 0) {
    return textStrings.join("");
  } else {
    return "";
  }
}
function getFunctionCalls(response) {
  var _a, _b, _c, _d;
  const functionCalls = [];
  if ((_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0].content) === null || _b === void 0 ? void 0 : _b.parts) {
    for (const part of (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0].content) === null || _d === void 0 ? void 0 : _d.parts) {
      if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }
  }
  if (functionCalls.length > 0) {
    return functionCalls;
  } else {
    return void 0;
  }
}
function hadBadFinishReason(candidate) {
  return !!candidate.finishReason && badFinishReasons.includes(candidate.finishReason);
}
function formatBlockErrorMessage(response) {
  var _a, _b, _c;
  let message = "";
  if ((!response.candidates || response.candidates.length === 0) && response.promptFeedback) {
    message += "Response was blocked";
    if ((_a = response.promptFeedback) === null || _a === void 0 ? void 0 : _a.blockReason) {
      message += ` due to ${response.promptFeedback.blockReason}`;
    }
    if ((_b = response.promptFeedback) === null || _b === void 0 ? void 0 : _b.blockReasonMessage) {
      message += `: ${response.promptFeedback.blockReasonMessage}`;
    }
  } else if ((_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0]) {
    const firstCandidate = response.candidates[0];
    if (hadBadFinishReason(firstCandidate)) {
      message += `Candidate was blocked due to ${firstCandidate.finishReason}`;
      if (firstCandidate.finishMessage) {
        message += `: ${firstCandidate.finishMessage}`;
      }
    }
  }
  return message;
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function verb(n) {
    if (g[n]) i[n] = function(v) {
      return new Promise(function(a, b) {
        q.push([n, v, a, b]) > 1 || resume(n, v);
      });
    };
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function processStream(response) {
  const inputStream = response.body.pipeThrough(new TextDecoderStream("utf8", { fatal: true }));
  const responseStream = getResponseStream(inputStream);
  const [stream1, stream2] = responseStream.tee();
  return {
    stream: generateResponseSequence(stream1),
    response: getResponsePromise(stream2)
  };
}
async function getResponsePromise(stream) {
  const allResponses = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      return addHelpers(aggregateResponses(allResponses));
    }
    allResponses.push(value);
  }
}
function generateResponseSequence(stream) {
  return __asyncGenerator(this, arguments, function* generateResponseSequence_1() {
    const reader = stream.getReader();
    while (true) {
      const { value, done } = yield __await(reader.read());
      if (done) {
        break;
      }
      yield yield __await(addHelpers(value));
    }
  });
}
function getResponseStream(inputStream) {
  const reader = inputStream.getReader();
  const stream = new ReadableStream({
    start(controller) {
      let currentText = "";
      return pump();
      function pump() {
        return reader.read().then(({ value, done }) => {
          if (done) {
            if (currentText.trim()) {
              controller.error(new GoogleGenerativeAIError("Failed to parse stream"));
              return;
            }
            controller.close();
            return;
          }
          currentText += value;
          let match = currentText.match(responseLineRE);
          let parsedResponse;
          while (match) {
            try {
              parsedResponse = JSON.parse(match[1]);
            } catch (e) {
              controller.error(new GoogleGenerativeAIError(`Error parsing JSON response: "${match[1]}"`));
              return;
            }
            controller.enqueue(parsedResponse);
            currentText = currentText.substring(match[0].length);
            match = currentText.match(responseLineRE);
          }
          return pump();
        }).catch((e) => {
          let err = e;
          err.stack = e.stack;
          if (err.name === "AbortError") {
            err = new GoogleGenerativeAIAbortError("Request aborted when reading from the stream");
          } else {
            err = new GoogleGenerativeAIError("Error reading from the stream");
          }
          throw err;
        });
      }
    }
  });
  return stream;
}
function aggregateResponses(responses) {
  const lastResponse = responses[responses.length - 1];
  const aggregatedResponse = {
    promptFeedback: lastResponse === null || lastResponse === void 0 ? void 0 : lastResponse.promptFeedback
  };
  for (const response of responses) {
    if (response.candidates) {
      let candidateIndex = 0;
      for (const candidate of response.candidates) {
        if (!aggregatedResponse.candidates) {
          aggregatedResponse.candidates = [];
        }
        if (!aggregatedResponse.candidates[candidateIndex]) {
          aggregatedResponse.candidates[candidateIndex] = {
            index: candidateIndex
          };
        }
        aggregatedResponse.candidates[candidateIndex].citationMetadata = candidate.citationMetadata;
        aggregatedResponse.candidates[candidateIndex].groundingMetadata = candidate.groundingMetadata;
        aggregatedResponse.candidates[candidateIndex].finishReason = candidate.finishReason;
        aggregatedResponse.candidates[candidateIndex].finishMessage = candidate.finishMessage;
        aggregatedResponse.candidates[candidateIndex].safetyRatings = candidate.safetyRatings;
        if (candidate.content && candidate.content.parts) {
          if (!aggregatedResponse.candidates[candidateIndex].content) {
            aggregatedResponse.candidates[candidateIndex].content = {
              role: candidate.content.role || "user",
              parts: []
            };
          }
          const newPart = {};
          for (const part of candidate.content.parts) {
            if (part.text) {
              newPart.text = part.text;
            }
            if (part.functionCall) {
              newPart.functionCall = part.functionCall;
            }
            if (part.executableCode) {
              newPart.executableCode = part.executableCode;
            }
            if (part.codeExecutionResult) {
              newPart.codeExecutionResult = part.codeExecutionResult;
            }
            if (Object.keys(newPart).length === 0) {
              newPart.text = "";
            }
            aggregatedResponse.candidates[candidateIndex].content.parts.push(newPart);
          }
        }
      }
      candidateIndex++;
    }
    if (response.usageMetadata) {
      aggregatedResponse.usageMetadata = response.usageMetadata;
    }
  }
  return aggregatedResponse;
}
async function generateContentStream(apiKey2, model, params, requestOptions) {
  const response = await makeModelRequest(
    model,
    Task.STREAM_GENERATE_CONTENT,
    apiKey2,
    /* stream */
    true,
    JSON.stringify(params),
    requestOptions
  );
  return processStream(response);
}
async function generateContent(apiKey2, model, params, requestOptions) {
  const response = await makeModelRequest(
    model,
    Task.GENERATE_CONTENT,
    apiKey2,
    /* stream */
    false,
    JSON.stringify(params),
    requestOptions
  );
  const responseJson = await response.json();
  const enhancedResponse = addHelpers(responseJson);
  return {
    response: enhancedResponse
  };
}
function formatSystemInstruction(input) {
  if (input == null) {
    return void 0;
  } else if (typeof input === "string") {
    return { role: "system", parts: [{ text: input }] };
  } else if (input.text) {
    return { role: "system", parts: [input] };
  } else if (input.parts) {
    if (!input.role) {
      return { role: "system", parts: input.parts };
    } else {
      return input;
    }
  }
}
function formatNewContent(request) {
  let newParts = [];
  if (typeof request === "string") {
    newParts = [{ text: request }];
  } else {
    for (const partOrString of request) {
      if (typeof partOrString === "string") {
        newParts.push({ text: partOrString });
      } else {
        newParts.push(partOrString);
      }
    }
  }
  return assignRoleToPartsAndValidateSendMessageRequest(newParts);
}
function assignRoleToPartsAndValidateSendMessageRequest(parts) {
  const userContent = { role: "user", parts: [] };
  const functionContent = { role: "function", parts: [] };
  let hasUserContent = false;
  let hasFunctionContent = false;
  for (const part of parts) {
    if ("functionResponse" in part) {
      functionContent.parts.push(part);
      hasFunctionContent = true;
    } else {
      userContent.parts.push(part);
      hasUserContent = true;
    }
  }
  if (hasUserContent && hasFunctionContent) {
    throw new GoogleGenerativeAIError("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");
  }
  if (!hasUserContent && !hasFunctionContent) {
    throw new GoogleGenerativeAIError("No content is provided for sending chat message.");
  }
  if (hasUserContent) {
    return userContent;
  }
  return functionContent;
}
function formatCountTokensInput(params, modelParams) {
  var _a;
  let formattedGenerateContentRequest = {
    model: modelParams === null || modelParams === void 0 ? void 0 : modelParams.model,
    generationConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.generationConfig,
    safetySettings: modelParams === null || modelParams === void 0 ? void 0 : modelParams.safetySettings,
    tools: modelParams === null || modelParams === void 0 ? void 0 : modelParams.tools,
    toolConfig: modelParams === null || modelParams === void 0 ? void 0 : modelParams.toolConfig,
    systemInstruction: modelParams === null || modelParams === void 0 ? void 0 : modelParams.systemInstruction,
    cachedContent: (_a = modelParams === null || modelParams === void 0 ? void 0 : modelParams.cachedContent) === null || _a === void 0 ? void 0 : _a.name,
    contents: []
  };
  const containsGenerateContentRequest = params.generateContentRequest != null;
  if (params.contents) {
    if (containsGenerateContentRequest) {
      throw new GoogleGenerativeAIRequestInputError("CountTokensRequest must have one of contents or generateContentRequest, not both.");
    }
    formattedGenerateContentRequest.contents = params.contents;
  } else if (containsGenerateContentRequest) {
    formattedGenerateContentRequest = Object.assign(Object.assign({}, formattedGenerateContentRequest), params.generateContentRequest);
  } else {
    const content = formatNewContent(params);
    formattedGenerateContentRequest.contents = [content];
  }
  return { generateContentRequest: formattedGenerateContentRequest };
}
function formatGenerateContentInput(params) {
  let formattedRequest;
  if (params.contents) {
    formattedRequest = params;
  } else {
    const content = formatNewContent(params);
    formattedRequest = { contents: [content] };
  }
  if (params.systemInstruction) {
    formattedRequest.systemInstruction = formatSystemInstruction(params.systemInstruction);
  }
  return formattedRequest;
}
function formatEmbedContentInput(params) {
  if (typeof params === "string" || Array.isArray(params)) {
    const content = formatNewContent(params);
    return { content };
  }
  return params;
}
function validateChatHistory(history) {
  let prevContent = false;
  for (const currContent of history) {
    const { role, parts } = currContent;
    if (!prevContent && role !== "user") {
      throw new GoogleGenerativeAIError(`First content should be with role 'user', got ${role}`);
    }
    if (!POSSIBLE_ROLES.includes(role)) {
      throw new GoogleGenerativeAIError(`Each item should include role field. Got ${role} but valid roles are: ${JSON.stringify(POSSIBLE_ROLES)}`);
    }
    if (!Array.isArray(parts)) {
      throw new GoogleGenerativeAIError("Content should have 'parts' property with an array of Parts");
    }
    if (parts.length === 0) {
      throw new GoogleGenerativeAIError("Each Content should have at least one part");
    }
    const countFields = {
      text: 0,
      inlineData: 0,
      functionCall: 0,
      functionResponse: 0,
      fileData: 0,
      executableCode: 0,
      codeExecutionResult: 0
    };
    for (const part of parts) {
      for (const key of VALID_PART_FIELDS) {
        if (key in part) {
          countFields[key] += 1;
        }
      }
    }
    const validParts = VALID_PARTS_PER_ROLE[role];
    for (const key of VALID_PART_FIELDS) {
      if (!validParts.includes(key) && countFields[key] > 0) {
        throw new GoogleGenerativeAIError(`Content with role '${role}' can't contain '${key}' part`);
      }
    }
    prevContent = true;
  }
}
function isValidResponse(response) {
  var _a;
  if (response.candidates === void 0 || response.candidates.length === 0) {
    return false;
  }
  const content = (_a = response.candidates[0]) === null || _a === void 0 ? void 0 : _a.content;
  if (content === void 0) {
    return false;
  }
  if (content.parts === void 0 || content.parts.length === 0) {
    return false;
  }
  for (const part of content.parts) {
    if (part === void 0 || Object.keys(part).length === 0) {
      return false;
    }
    if (part.text !== void 0 && part.text === "") {
      return false;
    }
  }
  return true;
}
async function countTokens(apiKey2, model, params, singleRequestOptions) {
  const response = await makeModelRequest(model, Task.COUNT_TOKENS, apiKey2, false, JSON.stringify(params), singleRequestOptions);
  return response.json();
}
async function embedContent(apiKey2, model, params, requestOptions) {
  const response = await makeModelRequest(model, Task.EMBED_CONTENT, apiKey2, false, JSON.stringify(params), requestOptions);
  return response.json();
}
async function batchEmbedContents(apiKey2, model, params, requestOptions) {
  const requestsWithModel = params.requests.map((request) => {
    return Object.assign(Object.assign({}, request), { model });
  });
  const response = await makeModelRequest(model, Task.BATCH_EMBED_CONTENTS, apiKey2, false, JSON.stringify({ requests: requestsWithModel }), requestOptions);
  return response.json();
}
var SchemaType, ExecutableCodeLanguage, Outcome, POSSIBLE_ROLES, HarmCategory, HarmBlockThreshold, HarmProbability, BlockReason, FinishReason, TaskType, FunctionCallingMode, DynamicRetrievalMode, GoogleGenerativeAIError, GoogleGenerativeAIResponseError, GoogleGenerativeAIFetchError, GoogleGenerativeAIRequestInputError, GoogleGenerativeAIAbortError, DEFAULT_BASE_URL, DEFAULT_API_VERSION, PACKAGE_VERSION, PACKAGE_LOG_HEADER, Task, RequestUrl, badFinishReasons, responseLineRE, VALID_PART_FIELDS, VALID_PARTS_PER_ROLE, SILENT_ERROR, ChatSession, GenerativeModel, GoogleGenerativeAI;
var init_dist = __esm({
  "node_modules/@google/generative-ai/dist/index.mjs"() {
    (function(SchemaType2) {
      SchemaType2["STRING"] = "string";
      SchemaType2["NUMBER"] = "number";
      SchemaType2["INTEGER"] = "integer";
      SchemaType2["BOOLEAN"] = "boolean";
      SchemaType2["ARRAY"] = "array";
      SchemaType2["OBJECT"] = "object";
    })(SchemaType || (SchemaType = {}));
    (function(ExecutableCodeLanguage2) {
      ExecutableCodeLanguage2["LANGUAGE_UNSPECIFIED"] = "language_unspecified";
      ExecutableCodeLanguage2["PYTHON"] = "python";
    })(ExecutableCodeLanguage || (ExecutableCodeLanguage = {}));
    (function(Outcome2) {
      Outcome2["OUTCOME_UNSPECIFIED"] = "outcome_unspecified";
      Outcome2["OUTCOME_OK"] = "outcome_ok";
      Outcome2["OUTCOME_FAILED"] = "outcome_failed";
      Outcome2["OUTCOME_DEADLINE_EXCEEDED"] = "outcome_deadline_exceeded";
    })(Outcome || (Outcome = {}));
    POSSIBLE_ROLES = ["user", "model", "function", "system"];
    (function(HarmCategory2) {
      HarmCategory2["HARM_CATEGORY_UNSPECIFIED"] = "HARM_CATEGORY_UNSPECIFIED";
      HarmCategory2["HARM_CATEGORY_HATE_SPEECH"] = "HARM_CATEGORY_HATE_SPEECH";
      HarmCategory2["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
      HarmCategory2["HARM_CATEGORY_HARASSMENT"] = "HARM_CATEGORY_HARASSMENT";
      HarmCategory2["HARM_CATEGORY_DANGEROUS_CONTENT"] = "HARM_CATEGORY_DANGEROUS_CONTENT";
      HarmCategory2["HARM_CATEGORY_CIVIC_INTEGRITY"] = "HARM_CATEGORY_CIVIC_INTEGRITY";
    })(HarmCategory || (HarmCategory = {}));
    (function(HarmBlockThreshold2) {
      HarmBlockThreshold2["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
      HarmBlockThreshold2["BLOCK_LOW_AND_ABOVE"] = "BLOCK_LOW_AND_ABOVE";
      HarmBlockThreshold2["BLOCK_MEDIUM_AND_ABOVE"] = "BLOCK_MEDIUM_AND_ABOVE";
      HarmBlockThreshold2["BLOCK_ONLY_HIGH"] = "BLOCK_ONLY_HIGH";
      HarmBlockThreshold2["BLOCK_NONE"] = "BLOCK_NONE";
    })(HarmBlockThreshold || (HarmBlockThreshold = {}));
    (function(HarmProbability2) {
      HarmProbability2["HARM_PROBABILITY_UNSPECIFIED"] = "HARM_PROBABILITY_UNSPECIFIED";
      HarmProbability2["NEGLIGIBLE"] = "NEGLIGIBLE";
      HarmProbability2["LOW"] = "LOW";
      HarmProbability2["MEDIUM"] = "MEDIUM";
      HarmProbability2["HIGH"] = "HIGH";
    })(HarmProbability || (HarmProbability = {}));
    (function(BlockReason2) {
      BlockReason2["BLOCKED_REASON_UNSPECIFIED"] = "BLOCKED_REASON_UNSPECIFIED";
      BlockReason2["SAFETY"] = "SAFETY";
      BlockReason2["OTHER"] = "OTHER";
    })(BlockReason || (BlockReason = {}));
    (function(FinishReason2) {
      FinishReason2["FINISH_REASON_UNSPECIFIED"] = "FINISH_REASON_UNSPECIFIED";
      FinishReason2["STOP"] = "STOP";
      FinishReason2["MAX_TOKENS"] = "MAX_TOKENS";
      FinishReason2["SAFETY"] = "SAFETY";
      FinishReason2["RECITATION"] = "RECITATION";
      FinishReason2["LANGUAGE"] = "LANGUAGE";
      FinishReason2["BLOCKLIST"] = "BLOCKLIST";
      FinishReason2["PROHIBITED_CONTENT"] = "PROHIBITED_CONTENT";
      FinishReason2["SPII"] = "SPII";
      FinishReason2["MALFORMED_FUNCTION_CALL"] = "MALFORMED_FUNCTION_CALL";
      FinishReason2["OTHER"] = "OTHER";
    })(FinishReason || (FinishReason = {}));
    (function(TaskType2) {
      TaskType2["TASK_TYPE_UNSPECIFIED"] = "TASK_TYPE_UNSPECIFIED";
      TaskType2["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY";
      TaskType2["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT";
      TaskType2["SEMANTIC_SIMILARITY"] = "SEMANTIC_SIMILARITY";
      TaskType2["CLASSIFICATION"] = "CLASSIFICATION";
      TaskType2["CLUSTERING"] = "CLUSTERING";
    })(TaskType || (TaskType = {}));
    (function(FunctionCallingMode2) {
      FunctionCallingMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
      FunctionCallingMode2["AUTO"] = "AUTO";
      FunctionCallingMode2["ANY"] = "ANY";
      FunctionCallingMode2["NONE"] = "NONE";
    })(FunctionCallingMode || (FunctionCallingMode = {}));
    (function(DynamicRetrievalMode2) {
      DynamicRetrievalMode2["MODE_UNSPECIFIED"] = "MODE_UNSPECIFIED";
      DynamicRetrievalMode2["MODE_DYNAMIC"] = "MODE_DYNAMIC";
    })(DynamicRetrievalMode || (DynamicRetrievalMode = {}));
    GoogleGenerativeAIError = class extends Error {
      constructor(message) {
        super(`[GoogleGenerativeAI Error]: ${message}`);
      }
    };
    GoogleGenerativeAIResponseError = class extends GoogleGenerativeAIError {
      constructor(message, response) {
        super(message);
        this.response = response;
      }
    };
    GoogleGenerativeAIFetchError = class extends GoogleGenerativeAIError {
      constructor(message, status, statusText, errorDetails) {
        super(message);
        this.status = status;
        this.statusText = statusText;
        this.errorDetails = errorDetails;
      }
    };
    GoogleGenerativeAIRequestInputError = class extends GoogleGenerativeAIError {
    };
    GoogleGenerativeAIAbortError = class extends GoogleGenerativeAIError {
    };
    DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com";
    DEFAULT_API_VERSION = "v1beta";
    PACKAGE_VERSION = "0.24.1";
    PACKAGE_LOG_HEADER = "genai-js";
    (function(Task2) {
      Task2["GENERATE_CONTENT"] = "generateContent";
      Task2["STREAM_GENERATE_CONTENT"] = "streamGenerateContent";
      Task2["COUNT_TOKENS"] = "countTokens";
      Task2["EMBED_CONTENT"] = "embedContent";
      Task2["BATCH_EMBED_CONTENTS"] = "batchEmbedContents";
    })(Task || (Task = {}));
    RequestUrl = class {
      constructor(model, task, apiKey2, stream, requestOptions) {
        this.model = model;
        this.task = task;
        this.apiKey = apiKey2;
        this.stream = stream;
        this.requestOptions = requestOptions;
      }
      toString() {
        var _a, _b;
        const apiVersion = ((_a = this.requestOptions) === null || _a === void 0 ? void 0 : _a.apiVersion) || DEFAULT_API_VERSION;
        const baseUrl4 = ((_b = this.requestOptions) === null || _b === void 0 ? void 0 : _b.baseUrl) || DEFAULT_BASE_URL;
        let url = `${baseUrl4}/${apiVersion}/${this.model}:${this.task}`;
        if (this.stream) {
          url += "?alt=sse";
        }
        return url;
      }
    };
    badFinishReasons = [
      FinishReason.RECITATION,
      FinishReason.SAFETY,
      FinishReason.LANGUAGE
    ];
    responseLineRE = /^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;
    VALID_PART_FIELDS = [
      "text",
      "inlineData",
      "functionCall",
      "functionResponse",
      "executableCode",
      "codeExecutionResult"
    ];
    VALID_PARTS_PER_ROLE = {
      user: ["text", "inlineData"],
      function: ["functionResponse"],
      model: ["text", "functionCall", "executableCode", "codeExecutionResult"],
      // System instructions shouldn't be in history anyway.
      system: ["text"]
    };
    SILENT_ERROR = "SILENT_ERROR";
    ChatSession = class {
      constructor(apiKey2, model, params, _requestOptions = {}) {
        this.model = model;
        this.params = params;
        this._requestOptions = _requestOptions;
        this._history = [];
        this._sendPromise = Promise.resolve();
        this._apiKey = apiKey2;
        if (params === null || params === void 0 ? void 0 : params.history) {
          validateChatHistory(params.history);
          this._history = params.history;
        }
      }
      /**
       * Gets the chat history so far. Blocked prompts are not added to history.
       * Blocked candidates are not added to history, nor are the prompts that
       * generated them.
       */
      async getHistory() {
        await this._sendPromise;
        return this._history;
      }
      /**
       * Sends a chat message and receives a non-streaming
       * {@link GenerateContentResult}.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async sendMessage(request, requestOptions = {}) {
        var _a, _b, _c, _d, _e, _f;
        await this._sendPromise;
        const newContent = formatNewContent(request);
        const generateContentRequest = {
          safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
          generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
          tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
          toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
          systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
          cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
          contents: [...this._history, newContent]
        };
        const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        let finalResult;
        this._sendPromise = this._sendPromise.then(() => generateContent(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions)).then((result) => {
          var _a2;
          if (isValidResponse(result.response)) {
            this._history.push(newContent);
            const responseContent = Object.assign({
              parts: [],
              // Response seems to come back without a role set.
              role: "model"
            }, (_a2 = result.response.candidates) === null || _a2 === void 0 ? void 0 : _a2[0].content);
            this._history.push(responseContent);
          } else {
            const blockErrorMessage = formatBlockErrorMessage(result.response);
            if (blockErrorMessage) {
              console.warn(`sendMessage() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
            }
          }
          finalResult = result;
        }).catch((e) => {
          this._sendPromise = Promise.resolve();
          throw e;
        });
        await this._sendPromise;
        return finalResult;
      }
      /**
       * Sends a chat message and receives the response as a
       * {@link GenerateContentStreamResult} containing an iterable stream
       * and a response promise.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async sendMessageStream(request, requestOptions = {}) {
        var _a, _b, _c, _d, _e, _f;
        await this._sendPromise;
        const newContent = formatNewContent(request);
        const generateContentRequest = {
          safetySettings: (_a = this.params) === null || _a === void 0 ? void 0 : _a.safetySettings,
          generationConfig: (_b = this.params) === null || _b === void 0 ? void 0 : _b.generationConfig,
          tools: (_c = this.params) === null || _c === void 0 ? void 0 : _c.tools,
          toolConfig: (_d = this.params) === null || _d === void 0 ? void 0 : _d.toolConfig,
          systemInstruction: (_e = this.params) === null || _e === void 0 ? void 0 : _e.systemInstruction,
          cachedContent: (_f = this.params) === null || _f === void 0 ? void 0 : _f.cachedContent,
          contents: [...this._history, newContent]
        };
        const chatSessionRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        const streamPromise = generateContentStream(this._apiKey, this.model, generateContentRequest, chatSessionRequestOptions);
        this._sendPromise = this._sendPromise.then(() => streamPromise).catch((_ignored) => {
          throw new Error(SILENT_ERROR);
        }).then((streamResult) => streamResult.response).then((response) => {
          if (isValidResponse(response)) {
            this._history.push(newContent);
            const responseContent = Object.assign({}, response.candidates[0].content);
            if (!responseContent.role) {
              responseContent.role = "model";
            }
            this._history.push(responseContent);
          } else {
            const blockErrorMessage = formatBlockErrorMessage(response);
            if (blockErrorMessage) {
              console.warn(`sendMessageStream() was unsuccessful. ${blockErrorMessage}. Inspect response object for details.`);
            }
          }
        }).catch((e) => {
          if (e.message !== SILENT_ERROR) {
            console.error(e);
          }
        });
        return streamPromise;
      }
    };
    GenerativeModel = class {
      constructor(apiKey2, modelParams, _requestOptions = {}) {
        this.apiKey = apiKey2;
        this._requestOptions = _requestOptions;
        if (modelParams.model.includes("/")) {
          this.model = modelParams.model;
        } else {
          this.model = `models/${modelParams.model}`;
        }
        this.generationConfig = modelParams.generationConfig || {};
        this.safetySettings = modelParams.safetySettings || [];
        this.tools = modelParams.tools;
        this.toolConfig = modelParams.toolConfig;
        this.systemInstruction = formatSystemInstruction(modelParams.systemInstruction);
        this.cachedContent = modelParams.cachedContent;
      }
      /**
       * Makes a single non-streaming call to the model
       * and returns an object containing a single {@link GenerateContentResponse}.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async generateContent(request, requestOptions = {}) {
        var _a;
        const formattedParams = formatGenerateContentInput(request);
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return generateContent(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, formattedParams), generativeModelRequestOptions);
      }
      /**
       * Makes a single streaming call to the model and returns an object
       * containing an iterable stream that iterates over all chunks in the
       * streaming response as well as a promise that returns the final
       * aggregated response.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async generateContentStream(request, requestOptions = {}) {
        var _a;
        const formattedParams = formatGenerateContentInput(request);
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return generateContentStream(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, formattedParams), generativeModelRequestOptions);
      }
      /**
       * Gets a new {@link ChatSession} instance which can be used for
       * multi-turn chats.
       */
      startChat(startChatParams) {
        var _a;
        return new ChatSession(this.apiKey, this.model, Object.assign({ generationConfig: this.generationConfig, safetySettings: this.safetySettings, tools: this.tools, toolConfig: this.toolConfig, systemInstruction: this.systemInstruction, cachedContent: (_a = this.cachedContent) === null || _a === void 0 ? void 0 : _a.name }, startChatParams), this._requestOptions);
      }
      /**
       * Counts the tokens in the provided request.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async countTokens(request, requestOptions = {}) {
        const formattedParams = formatCountTokensInput(request, {
          model: this.model,
          generationConfig: this.generationConfig,
          safetySettings: this.safetySettings,
          tools: this.tools,
          toolConfig: this.toolConfig,
          systemInstruction: this.systemInstruction,
          cachedContent: this.cachedContent
        });
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return countTokens(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
      }
      /**
       * Embeds the provided content.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async embedContent(request, requestOptions = {}) {
        const formattedParams = formatEmbedContentInput(request);
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return embedContent(this.apiKey, this.model, formattedParams, generativeModelRequestOptions);
      }
      /**
       * Embeds an array of {@link EmbedContentRequest}s.
       *
       * Fields set in the optional {@link SingleRequestOptions} parameter will
       * take precedence over the {@link RequestOptions} values provided to
       * {@link GoogleGenerativeAI.getGenerativeModel }.
       */
      async batchEmbedContents(batchEmbedContentRequest, requestOptions = {}) {
        const generativeModelRequestOptions = Object.assign(Object.assign({}, this._requestOptions), requestOptions);
        return batchEmbedContents(this.apiKey, this.model, batchEmbedContentRequest, generativeModelRequestOptions);
      }
    };
    GoogleGenerativeAI = class {
      constructor(apiKey2) {
        this.apiKey = apiKey2;
      }
      /**
       * Gets a {@link GenerativeModel} instance for the provided model name.
       */
      getGenerativeModel(modelParams, requestOptions) {
        if (!modelParams.model) {
          throw new GoogleGenerativeAIError(`Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })`);
        }
        return new GenerativeModel(this.apiKey, modelParams, requestOptions);
      }
      /**
       * Creates a {@link GenerativeModel} instance from provided content cache.
       */
      getGenerativeModelFromCachedContent(cachedContent, modelParams, requestOptions) {
        if (!cachedContent.name) {
          throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `name` field.");
        }
        if (!cachedContent.model) {
          throw new GoogleGenerativeAIRequestInputError("Cached content must contain a `model` field.");
        }
        const disallowedDuplicates = ["model", "systemInstruction"];
        for (const key of disallowedDuplicates) {
          if ((modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) && cachedContent[key] && (modelParams === null || modelParams === void 0 ? void 0 : modelParams[key]) !== cachedContent[key]) {
            if (key === "model") {
              const modelParamsComp = modelParams.model.startsWith("models/") ? modelParams.model.replace("models/", "") : modelParams.model;
              const cachedContentComp = cachedContent.model.startsWith("models/") ? cachedContent.model.replace("models/", "") : cachedContent.model;
              if (modelParamsComp === cachedContentComp) {
                continue;
              }
            }
            throw new GoogleGenerativeAIRequestInputError(`Different value for "${key}" specified in modelParams (${modelParams[key]}) and cachedContent (${cachedContent[key]})`);
          }
        }
        const modelParamsFromCache = Object.assign(Object.assign({}, modelParams), { model: cachedContent.model, tools: cachedContent.tools, toolConfig: cachedContent.toolConfig, systemInstruction: cachedContent.systemInstruction, cachedContent });
        return new GenerativeModel(this.apiKey, modelParamsFromCache, requestOptions);
      }
    };
  }
});

// server/bytezService.ts
import Bytez from "bytez.js";
async function generateImageWithBytez(options) {
  try {
    console.log("\u{1F3A8} Bytez: Starting image generation with prompt:", options.prompt);
    let enhancedPrompt = options.prompt;
    if (options.style) {
      const styleMap = {
        realistic: "photorealistic, high quality, detailed",
        "3d": "3D render, CGI, detailed 3D model",
        anime: "anime style, Japanese animation, vibrant colors",
        cyberpunk: "cyberpunk, neon lights, futuristic, dark atmosphere",
        holographic: "holographic, iridescent, prismatic, ethereal glow",
        fantasy: "fantasy art, magical, mystical, epic"
      };
      const styleText = styleMap[options.style] || options.style;
      enhancedPrompt = `${enhancedPrompt}, ${styleText}`;
    }
    console.log("\u{1F3A8} Bytez: Enhanced prompt:", enhancedPrompt);
    const result = await imageModel.run(enhancedPrompt);
    console.log("\u{1F3A8} Bytez: Raw result:", JSON.stringify(result, null, 2));
    const { error, output } = result;
    if (error) {
      console.error("\u274C Bytez Model Error:", error);
      const errorMessage = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "Failed to generate image";
      return {
        error: errorMessage,
        raw: output
      };
    }
    console.log("\u{1F3A8} Bytez: Output structure:", {
      hasOutput: !!output,
      outputKeys: output ? Object.keys(output) : [],
      outputType: typeof output
    });
    if (output) {
      if (output.images) {
        console.log("\u{1F3A8} Bytez: Found images property, type:", typeof output.images);
        if (Array.isArray(output.images) && output.images.length > 0) {
          console.log("\u2705 Bytez: Returning", output.images.length, "images");
          return {
            urls: output.images,
            raw: output
          };
        }
        if (typeof output.images === "string") {
          console.log("\u2705 Bytez: Returning single image URL");
          return {
            url: output.images,
            raw: output
          };
        }
        if (output.images[0]) {
          console.log("\u2705 Bytez: Returning first image from array");
          return {
            url: output.images[0],
            urls: Array.isArray(output.images) ? output.images : [output.images[0]],
            raw: output
          };
        }
      }
      if (output.url) {
        console.log("\u2705 Bytez: Returning direct URL");
        return {
          url: output.url,
          raw: output
        };
      }
      if (typeof output === "string" && (output.startsWith("http") || output.startsWith("data:"))) {
        console.log("\u2705 Bytez: Output is a URL string");
        return {
          url: output,
          raw: { url: output }
        };
      }
      if (output.data || output.base64) {
        const imageData = output.data || output.base64;
        console.log("\u2705 Bytez: Found data/base64, converting to data URL");
        const dataUrl = typeof imageData === "string" && imageData.startsWith("data:") ? imageData : `data:image/png;base64,${imageData}`;
        return {
          url: dataUrl,
          raw: output
        };
      }
    }
    console.error("\u274C Bytez: No image URL found in response. Full output:", JSON.stringify(output, null, 2));
    return {
      error: "No image URL found in response. Check server logs for details.",
      raw: output
    };
  } catch (err) {
    console.error("\u274C Bytez Service Exception:", err);
    console.error("\u274C Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Failed to generate image"
    };
  }
}
async function generateVideoWithGoogle(options) {
  try {
    console.log("\u{1F3AC} Google Veo: Starting video generation with prompt:", options.prompt);
    console.log("\u{1F3AC} Google Veo: Using API key:", googleApiKey.substring(0, 8) + "...");
    const genAIAny = genAI;
    let operation = await genAIAny.models.generateVideo({
      model: "veo-1.5-generate-001",
      prompt: options.prompt
    });
    console.log("\u{1F3AC} Google Veo: Operation started:", operation.name);
    const maxWaitTime = 3e5;
    const startTime = Date.now();
    const pollInterval = 8e3;
    while (!operation.done) {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitTime) {
        return {
          error: "Video generation timeout - operation took longer than 5 minutes"
        };
      }
      console.log("\u{1F3AC} Google Veo: Generating video... (elapsed: " + Math.round(elapsed / 1e3) + "s)");
      await new Promise((res) => setTimeout(res, pollInterval));
      operation = await genAIAny.operations.get({ name: operation.name });
    }
    console.log("\u2705 Google Veo: Video generation completed");
    const videoFile = operation.result?.video;
    if (!videoFile) {
      console.error("\u274C Google Veo: No video file in result");
      return {
        error: "No video file returned from Google Veo",
        raw: operation.result
      };
    }
    let videoUrl;
    if (typeof videoFile === "string") {
      videoUrl = videoFile;
    } else if (videoFile.uri) {
      videoUrl = videoFile.uri;
    } else if (videoFile.url) {
      videoUrl = videoFile.url;
    } else {
      videoUrl = videoFile.fileUri || videoFile.uri || JSON.stringify(videoFile);
    }
    console.log("\u2705 Google Veo: Video URL:", videoUrl);
    return {
      url: videoUrl,
      raw: {
        operation: operation.name,
        videoFile,
        result: operation.result
      }
    };
  } catch (err) {
    console.error("\u274C Google Veo Service Exception:", err);
    console.error("\u274C Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Failed to generate video with Google Veo"
    };
  }
}
async function generateVideoWithBytez(options) {
  try {
    console.log("\u{1F3AC} Bytez Video: Starting video generation with prompt:", options.prompt);
    console.log("\u{1F3AC} Bytez Video: Using API key:", videoApiKey.substring(0, 8) + "...");
    const result = await videoModel.run(options.prompt);
    console.log("\u{1F3AC} Bytez: Raw video result:", JSON.stringify(result, null, 2));
    const { error, output } = result;
    if (error) {
      console.error("\u274C Bytez Video Model Error:", error);
      const errorMessage = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "Failed to generate video";
      return {
        error: errorMessage,
        raw: output
      };
    }
    console.log("\u{1F3AC} Bytez: Video output structure:", {
      hasOutput: !!output,
      outputKeys: output ? Object.keys(output) : [],
      outputType: typeof output
    });
    if (output) {
      if (output.videos) {
        console.log("\u{1F3AC} Bytez: Found videos property, type:", typeof output.videos);
        if (Array.isArray(output.videos) && output.videos.length > 0) {
          console.log("\u2705 Bytez: Returning", output.videos.length, "video(s)");
          return {
            urls: output.videos,
            raw: output
          };
        }
        if (typeof output.videos === "string") {
          console.log("\u2705 Bytez: Returning single video URL");
          return {
            url: output.videos,
            raw: output
          };
        }
        if (output.videos[0]) {
          console.log("\u2705 Bytez: Returning first video from array");
          return {
            url: output.videos[0],
            urls: Array.isArray(output.videos) ? output.videos : [output.videos[0]],
            raw: output
          };
        }
      }
      if (output.url) {
        console.log("\u2705 Bytez: Returning direct video URL");
        return {
          url: output.url,
          raw: output
        };
      }
      if (typeof output === "string" && (output.startsWith("http") || output.startsWith("data:"))) {
        console.log("\u2705 Bytez: Output is a video URL string");
        return {
          url: output,
          raw: { url: output }
        };
      }
      if (output.video || output.file) {
        const videoData = output.video || output.file;
        console.log("\u2705 Bytez: Found video file/data");
        return {
          url: typeof videoData === "string" ? videoData : JSON.stringify(videoData),
          raw: output
        };
      }
    }
    console.error("\u274C Bytez: No video URL found in response. Full output:", JSON.stringify(output, null, 2));
    return {
      error: "No video URL found in response. Check server logs for details.",
      raw: output
    };
  } catch (err) {
    console.error("\u274C Bytez Video Service Exception:", err);
    console.error("\u274C Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Failed to generate video"
    };
  }
}
async function generateDialogueSummary(options) {
  try {
    if (!options.text || !options.text.trim()) {
      return {
        error: "Text is required for dialogue summarization"
      };
    }
    console.log("\u{1F4DD} Bytez Dialogue: Generating dialogue summary...");
    console.log("\u{1F4DD} Bytez Dialogue: Input text length:", options.text.length);
    console.log("\u{1F4DD} Bytez Dialogue: Using API key:", dialogueApiKey.substring(0, 8) + "...");
    const result = await dialogueSummaryModel.run(options.text);
    console.log("\u{1F4DD} Bytez Dialogue: Raw result:", JSON.stringify(result, null, 2));
    const { error, output } = result;
    if (error) {
      console.error("\u274C Bytez Dialogue Model Error:", error);
      const errorMessage = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "Failed to generate dialogue summary";
      return {
        error: errorMessage
      };
    }
    if (!output) {
      return {
        error: "No output received from Bytez API"
      };
    }
    let summary;
    if (typeof output === "string") {
      summary = output;
    } else if (typeof output === "object" && output !== null) {
      summary = output.summary || output.text || JSON.stringify(output);
    } else {
      summary = String(output);
    }
    console.log("\u2705 Bytez Dialogue: Dialogue summary generated successfully");
    console.log("\u{1F4DD} Bytez Dialogue: Summary length:", summary.length);
    return {
      summary: summary.trim()
    };
  } catch (err) {
    console.error("\u274C Bytez Dialogue Service Exception:", err);
    console.error("\u274C Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Bytez dialogue service encountered an unexpected error"
    };
  }
}
async function analyzeDocumentWithBytez(options) {
  try {
    console.log("\u{1F4C4} Bytez Document: Starting document analysis");
    console.log("\u{1F4C4} Bytez Document: File:", options.fileName, "Type:", options.mimeType);
    console.log("\u{1F4C4} Bytez Document: Using API key:", documentApiKey.substring(0, 8) + "...");
    const base64Data = options.fileBuffer.toString("base64");
    const modelName = options.model || "svjack/dialogue-summary";
    const documentModel = documentSdk.model(modelName);
    let input;
    if (options.mimeType.startsWith("text/")) {
      input = options.fileBuffer.toString("utf-8");
    } else if (options.mimeType === "application/pdf") {
      input = `Document: ${options.fileName}
Type: PDF
Base64: ${base64Data.substring(0, 1e3)}...

Extract all text and structured data from this PDF document.`;
    } else if (options.mimeType.startsWith("image/")) {
      input = `Document: ${options.fileName}
Type: Image (${options.mimeType})
Base64: ${base64Data.substring(0, 1e3)}...

Extract all text and structured data from this image document using OCR.`;
    } else {
      try {
        input = options.fileBuffer.toString("utf-8");
      } catch {
        input = `Document: ${options.fileName}
Type: ${options.mimeType}
Base64: ${base64Data.substring(0, 1e3)}...`;
      }
    }
    console.log("\u{1F4C4} Bytez Document: Running model:", modelName);
    const result = await documentModel.run(input);
    console.log("\u{1F4C4} Bytez Document: Raw result:", JSON.stringify(result, null, 2));
    const { error, output } = result;
    if (error) {
      console.error("\u274C Bytez Document Model Error:", error);
      const errorMessage = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "Failed to analyze document";
      return {
        error: errorMessage
      };
    }
    if (!output) {
      return {
        error: "No output received from Bytez API"
      };
    }
    let extractedData = null;
    let ocrText = "";
    if (typeof output === "string") {
      ocrText = output;
      extractedData = {
        doc_type: "other",
        raw_text_snippet: output.substring(0, 1e3)
      };
    } else if (typeof output === "object" && output !== null) {
      extractedData = output;
      ocrText = output.text || output.ocrText || output.raw_text_snippet || JSON.stringify(output);
    } else {
      ocrText = String(output);
      extractedData = {
        doc_type: "other",
        raw_text_snippet: ocrText.substring(0, 1e3)
      };
    }
    console.log("\u2705 Bytez Document: Document analysis completed");
    console.log("\u{1F4C4} Bytez Document: OCR text length:", ocrText.length);
    return {
      extractedData,
      ocrText: ocrText.trim(),
      confidence: 0.85
      // Default confidence for Bytez extraction
    };
  } catch (err) {
    console.error("\u274C Bytez Document Service Exception:", err);
    console.error("\u274C Error stack:", err.stack);
    return {
      error: err.message || err.toString() || "Bytez document service encountered an unexpected error"
    };
  }
}
var imageApiKey, imageSdk, imageModel, videoApiKey, videoSdk, videoModel, googleApiKey, genAI, dialogueApiKey, dialogueSdk, dialogueSummaryModel, documentApiKey, documentSdk;
var init_bytezService = __esm({
  "server/bytezService.ts"() {
    "use strict";
    init_dist();
    imageApiKey = process.env.BYTEZ_API_KEY || "349c88bd7835622d5760900f6b0f8a51";
    imageSdk = new Bytez(imageApiKey);
    imageModel = imageSdk.model("ZB-Tech/Text-to-Image");
    videoApiKey = process.env.BYTEZ_VIDEO_API_KEY || "72766a8ab41bb8e6ee002cc4e4dd42c6";
    videoSdk = new Bytez(videoApiKey);
    videoModel = videoSdk.model("ali-vilab/text-to-video-ms-1.7b");
    googleApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "AIzaSyDMUiPPecWYiH0IdfT6ubMQvyXaRBe0EXM";
    genAI = new GoogleGenerativeAI(googleApiKey);
    dialogueApiKey = process.env.BYTEZ_DIALOGUE_API_KEY || "19ddd0a5c384c7365b8e0bd620351a1e";
    dialogueSdk = new Bytez(dialogueApiKey);
    dialogueSummaryModel = dialogueSdk.model("svjack/dialogue-summary");
    documentApiKey = process.env.BYTEZ_DOCUMENT_API_KEY || "e05bb4f31ced25f7d0bd7340eb8d6688";
    documentSdk = new Bytez(documentApiKey);
  }
});

// server/geminiService.ts
async function analyzeImageWithGemini(options) {
  try {
    console.log("\u{1F52E} Gemini: Starting document analysis (image/PDF)");
    console.log("\u{1F52E} Gemini: MIME type:", options.mimeType);
    const model = genAI2.getGenerativeModel({ model: "gemini-1.5-pro" });
    const base64Data = options.imageBuffer.toString("base64");
    const prompt = options.prompt || `You are a precise document extractor. Analyze this document (image or PDF) and extract all structured data. The document could be an invoice, bill, resume/CV, form, letter, or other document type.

Return ONLY valid JSON with the following structure (use null for fields that don't apply):

{
  "doc_type": "invoice|bill|resume|cv|form|letter|other",
  "issuer": "<company or issuer name or null>",
  "account_number": "<if present or null>",
  "invoice_date": "<YYYY-MM-DD or null>",
  "due_date": "<YYYY-MM-DD or null>",
  "amount_due": {"value": 1234.56, "currency": "INR|USD|..."} or null,
  "line_items": [{"description": "", "qty": 1, "unit_price": 0.0, "total": 0.0}],
  "recipient_name": "<if present - could be applicant name for resumes>",
  "recipient_email": "<if present>",
  "raw_text_snippet": "<extract all readable text content from the document, preserving structure>"
}

For resumes/CVs, focus on extracting: name, email, phone, skills, experience, education.
For invoices/bills, extract: issuer, dates, amounts, line items.
For other documents, extract all relevant structured information.

Extract all structured data from this document. Return ONLY valid JSON with the exact structure specified.`;
    const mimeType = options.mimeType === "application/pdf" ? "application/pdf" : options.mimeType;
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      },
      prompt
    ]);
    const response = await result.response;
    const text2 = response.text();
    console.log("\u{1F52E} Gemini: Raw response:", text2.substring(0, 500));
    let extractedData = null;
    let ocrText = text2;
    try {
      const jsonMatch = text2.match(/```json\s*([\s\S]*?)\s*```/) || text2.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : text2;
      extractedData = JSON.parse(jsonString);
      console.log("\u2705 Gemini: Successfully parsed JSON response");
      if (extractedData.raw_text_snippet) {
        ocrText = extractedData.raw_text_snippet;
      }
    } catch (parseError) {
      console.warn("\u26A0\uFE0F Gemini: Failed to parse JSON, using raw text");
      return {
        text: text2,
        ocrText: text2,
        extractedData: {
          doc_type: "other",
          raw_text_snippet: text2.substring(0, 1e3)
        },
        confidence: 0.7
        // Default confidence when JSON parsing fails
      };
    }
    return {
      text: text2,
      ocrText,
      extractedData,
      confidence: 0.95
      // High confidence for successful extraction
    };
  } catch (err) {
    console.error("\u274C Gemini Service Error:", err);
    return {
      error: err.message || "Gemini service encountered an unexpected error"
    };
  }
}
async function generateTextWithGemini(prompt, modelName = "gemini-1.5-flash") {
  try {
    console.log("\u{1F52E} Gemini: Generating text with model:", modelName);
    const model = genAI2.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text2 = response.text();
    console.log("\u2705 Gemini: Text generated successfully");
    return { text: text2 };
  } catch (err) {
    console.error("\u274C Gemini Text Generation Error:", err);
    return {
      error: err.message || "Failed to generate text with Gemini"
    };
  }
}
function isGeminiAvailable() {
  return !!geminiApiKey && geminiApiKey !== "";
}
var geminiApiKey, genAI2;
var init_geminiService = __esm({
  "server/geminiService.ts"() {
    "use strict";
    init_dist();
    geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyAhyQx7oPQ9ffTeyT91IlUbut0psAxrcMQ";
    genAI2 = new GoogleGenerativeAI(geminiApiKey);
  }
});

// server/apyhubService.ts
var apyhubService_exports = {};
__export(apyhubService_exports, {
  isApyHubAvailable: () => isApyHubAvailable,
  splitTextIntoChunks: () => splitTextIntoChunks,
  summarizeLargeText: () => summarizeLargeText,
  summarizeTextViaUrl: () => summarizeTextViaUrl,
  summarizeUrl: () => summarizeUrl
});
import fetch2 from "node-fetch";
function isApyHubAvailable() {
  return !!apyhubToken && apyhubToken.length > 0;
}
async function summarizeUrl(options) {
  try {
    if (!isApyHubAvailable()) {
      return {
        error: "ApyHub API token is not configured. Please set APYHUB_TOKEN in your environment variables."
      };
    }
    console.log("\u{1F4DD} ApyHub: Starting URL summarization");
    console.log("\u{1F4DD} ApyHub: URL:", options.url.substring(0, 100));
    console.log("\u{1F4DD} ApyHub: Summary length:", options.summary_length || "medium");
    console.log("\u{1F4DD} ApyHub: Output language:", options.output_language || "en");
    const requestBody = {
      url: options.url,
      summary_length: options.summary_length || "medium",
      output_language: options.output_language || "en"
    };
    const response = await fetch2(`${baseUrl}/ai/summarize-url`, {
      method: "POST",
      headers: {
        "apy-token": apyhubToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `ApyHub API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error("\u274C ApyHub API Error:", errorMessage);
      return { error: errorMessage };
    }
    const data = await response.json();
    const summary = data.data?.summary || data.summary || "";
    if (!summary) {
      console.warn("\u26A0\uFE0F ApyHub: No summary content in response");
      return {
        error: "No summary content received from ApyHub API"
      };
    }
    console.log("\u2705 ApyHub: URL summarization completed");
    console.log("\u{1F4DD} ApyHub: Summary length:", summary.length);
    return { summary };
  } catch (error) {
    console.error("\u274C ApyHub Service Error:", error);
    return {
      error: error.message || "ApyHub service encountered an unexpected error"
    };
  }
}
function splitTextIntoChunks(text2, maxChars = 1e4, overlap = 500) {
  const chunks = [];
  let i = 0;
  while (i < text2.length) {
    const start = Math.max(0, i - overlap);
    const chunk = text2.slice(start, start + maxChars);
    chunks.push(chunk);
    i += maxChars - overlap;
  }
  return chunks;
}
async function summarizeTextViaUrl(text2, uploadToStorage, options = {}) {
  try {
    const filename = `doc-summary-${Date.now()}.txt`;
    const textBuffer = Buffer.from(text2, "utf-8");
    console.log("\u{1F4DD} ApyHub: Uploading text to storage for summarization");
    const url = await uploadToStorage(textBuffer, filename);
    console.log("\u{1F4DD} ApyHub: Text uploaded, URL:", url);
    return await summarizeUrl({
      url,
      ...options
    });
  } catch (error) {
    console.error("\u274C ApyHub: Error in summarizeTextViaUrl:", error);
    return {
      error: error.message || "Failed to summarize text via URL"
    };
  }
}
async function summarizeLargeText(text2, uploadToStorage, options = {}) {
  try {
    const maxChars = 8e3;
    if (text2.length <= maxChars) {
      return await summarizeTextViaUrl(text2, uploadToStorage, options);
    }
    console.log("\u{1F4DD} ApyHub: Text is large, chunking for summarization");
    console.log("\u{1F4DD} ApyHub: Text length:", text2.length, "chars");
    const chunks = splitTextIntoChunks(text2, maxChars, 500);
    console.log("\u{1F4DD} ApyHub: Split into", chunks.length, "chunks");
    const chunkSummaries = [];
    for (const [idx, chunk] of chunks.entries()) {
      console.log(`\u{1F4DD} ApyHub: Summarizing chunk ${idx + 1}/${chunks.length}`);
      const chunkResult = await summarizeTextViaUrl(
        chunk,
        uploadToStorage,
        { ...options, summary_length: "short" }
        // Use short for chunks
      );
      if (chunkResult.error) {
        console.warn(`\u26A0\uFE0F ApyHub: Chunk ${idx + 1} summarization failed:`, chunkResult.error);
        continue;
      }
      if (chunkResult.summary) {
        chunkSummaries.push(chunkResult.summary);
      }
    }
    if (chunkSummaries.length === 0) {
      return {
        error: "Failed to summarize any chunks"
      };
    }
    const mergedText = chunkSummaries.join("\n\n");
    console.log("\u{1F4DD} ApyHub: Merging", chunkSummaries.length, "chunk summaries");
    if (mergedText.length > maxChars) {
      return await summarizeLargeText(mergedText, uploadToStorage, options);
    }
    return await summarizeTextViaUrl(mergedText, uploadToStorage, {
      ...options,
      summary_length: options.summary_length || "medium"
    });
  } catch (error) {
    console.error("\u274C ApyHub: Error in summarizeLargeText:", error);
    return {
      error: error.message || "Failed to summarize large text"
    };
  }
}
var apyhubToken, baseUrl;
var init_apyhubService = __esm({
  "server/apyhubService.ts"() {
    "use strict";
    apyhubToken = process.env.APYHUB_TOKEN || "APY029h8vlKrlVGl9FqqkRLSmZy2zwsXr5yc5aMbCa5rWQCMsfaKgunMsr4BH0BTmHpsEgO3O";
    baseUrl = "https://api.apyhub.com";
  }
});

// server/storageHelper.ts
var storageHelper_exports = {};
__export(storageHelper_exports, {
  deleteTemporaryFile: () => deleteTemporaryFile,
  getTemporaryFile: () => getTemporaryFile,
  getTemporaryFileUrl: () => getTemporaryFileUrl,
  storeTemporaryFile: () => storeTemporaryFile,
  uploadTextForApyHub: () => uploadTextForApyHub,
  uploadTextToTemporaryStorage: () => uploadTextToTemporaryStorage
});
async function uploadTextToTemporaryStorage(buffer, filename) {
  throw new Error(
    "Temporary storage not implemented. Please configure object storage (Vultr, AWS S3, etc.) or use a file hosting service that provides public URLs for ApyHub summarization."
  );
}
function getTemporaryFileUrl(filename, baseUrl4 = "http://localhost:5678") {
  const fileId = filename.replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now();
  return `${baseUrl4}/api/temp-files/${fileId}`;
}
function storeTemporaryFile(fileId, buffer, mimeType = "text/plain") {
  temporaryFiles.set(fileId, { buffer, mimeType });
}
function getTemporaryFile(fileId) {
  return temporaryFiles.get(fileId);
}
function deleteTemporaryFile(fileId) {
  temporaryFiles.delete(fileId);
}
async function uploadTextForApyHub(buffer, filename, baseUrl4 = "http://localhost:5678") {
  const fileId = `apyhub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  storeTemporaryFile(fileId, buffer, "text/plain");
  const url = `${baseUrl4}/api/temp-files/${fileId}`;
  console.log("\u{1F4C1} Temporary file stored:", fileId);
  console.log("\u{1F4C1} Temporary file URL:", url);
  return url;
}
var temporaryFiles;
var init_storageHelper = __esm({
  "server/storageHelper.ts"() {
    "use strict";
    temporaryFiles = /* @__PURE__ */ new Map();
  }
});

// server/documentService.ts
import OpenAI from "openai";
import mammoth from "mammoth";
async function analyzeDocument(fileBuffer, fileName, mimeType) {
  try {
    console.log("\u{1F4C4} Document Analysis: Starting analysis for file:", fileName, "Type:", mimeType);
    if (mimeType === "text/plain" || mimeType === "text/markdown" || mimeType.startsWith("text/")) {
      const text2 = fileBuffer.toString("utf-8");
      console.log("\u{1F4C4} Processing text document, length:", text2.length);
      let summary = text2.substring(0, 500);
      try {
        const { isApyHubAvailable: isApyHubAvailable2, summarizeLargeText: summarizeLargeText2 } = await Promise.resolve().then(() => (init_apyhubService(), apyhubService_exports));
        const { uploadTextForApyHub: uploadTextForApyHub2 } = await Promise.resolve().then(() => (init_storageHelper(), storageHelper_exports));
        if (isApyHubAvailable2() && text2.length > 100) {
          const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
          const apyhubResult = await summarizeLargeText2(
            text2,
            (buffer, filename) => uploadTextForApyHub2(buffer, filename, serverUrl),
            { summary_length: "medium", output_language: "en" }
          );
          if (!apyhubResult.error && apyhubResult.summary) {
            summary = apyhubResult.summary;
            console.log("\u2705 ApyHub summary generated for document");
          } else {
            console.warn("\u26A0\uFE0F ApyHub summary failed:", apyhubResult.error);
          }
        }
      } catch (summaryError) {
        console.warn("\u26A0\uFE0F ApyHub summary failed, using text snippet:", summaryError.message);
      }
      const fields = [];
      const extractedData = {
        doc_type: "text",
        raw_text_snippet: text2.substring(0, 1e3)
      };
      const emailMatch = text2.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        fields.push({ key: "recipient_email", value: emailMatch[0], confidence: 0.7 });
        extractedData.recipient_email = emailMatch[0];
      }
      const dateMatch = text2.match(/\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/);
      if (dateMatch) {
        fields.push({ key: "date", value: dateMatch[0], confidence: 0.6 });
        extractedData.invoice_date = dateMatch[0];
      }
      const amountMatch = text2.match(/(?:USD|INR|EUR|GBP|₹|\$|€|£)\s*[\d,]+\.?\d*/i);
      if (amountMatch) {
        fields.push({ key: "amount_due", value: amountMatch[0], confidence: 0.6 });
        extractedData.amount_due = { value: parseFloat(amountMatch[0].replace(/[^\d.]/g, "")), currency: "USD" };
      }
      return {
        fields,
        extractedData: sanitizeExtractedData(extractedData),
        summary: sanitizeText(summary)
      };
    }
    if (mimeType.startsWith("image/")) {
      let parsed = null;
      let ocrTextFromAnalysis = void 0;
      try {
        console.log("\u{1F4C4} Using Bytez for image document analysis");
        const bytezResult = await analyzeDocumentWithBytez({
          fileBuffer,
          fileName,
          mimeType
        });
        if (bytezResult.error) {
          console.warn("\u26A0\uFE0F Bytez analysis failed:", bytezResult.error);
        } else if (bytezResult.extractedData) {
          parsed = bytezResult.extractedData;
          ocrTextFromAnalysis = bytezResult.ocrText;
          console.log("\u2705 Bytez successfully extracted document data");
        }
      } catch (bytezError) {
        console.warn("\u26A0\uFE0F Bytez failed, trying Gemini:", bytezError.message);
      }
      if (!parsed && isGeminiAvailable()) {
        try {
          console.log("\u{1F52E} Using Gemini AI for image analysis");
          const geminiResult = await analyzeImageWithGemini({
            imageBuffer: fileBuffer,
            mimeType
          });
          if (geminiResult.error) {
            console.warn("\u26A0\uFE0F Gemini analysis failed:", geminiResult.error);
            throw new Error(geminiResult.error);
          }
          if (geminiResult.extractedData) {
            parsed = geminiResult.extractedData;
            console.log("\u2705 Gemini successfully extracted document data");
            if (geminiResult.ocrText) {
              parsed.ocrText = geminiResult.ocrText;
            }
          } else if (geminiResult.text) {
            parsed = {
              doc_type: "other",
              raw_text_snippet: geminiResult.text.substring(0, 1e3),
              ocrText: geminiResult.text
            };
          }
        } catch (geminiError) {
          console.warn("\u26A0\uFE0F Gemini failed, trying OpenAI fallback:", geminiError.message);
        }
      }
      if (!parsed && openai) {
        try {
          console.log("\u{1F504} Using OpenAI for image analysis (fallback)");
          const base64 = fileBuffer.toString("base64");
          const dataUrl = `data:${mimeType};base64,${base64}`;
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are a precise extractor. Input: the full text of a document (invoice, bill, form, letter). Output: JSON only with keys:

{
  "doc_type": "invoice|bill|form|letter|other",
  "issuer": "<company or issuer name or null>",
  "account_number": "<if present or null>",
  "invoice_date": "<YYYY-MM-DD or null>",
  "due_date": "<YYYY-MM-DD or null>",
  "amount_due": {"value": 1234.56, "currency": "INR|USD|..."} or null,
  "line_items": [{"description": "", "qty": 1, "unit_price": 0.0, "total": 0.0}],
  "recipient_name": "<if present>",
  "recipient_email": "<if present>",
  "raw_text_snippet": "<short snippet for context>"
}

Return ONLY valid JSON.`
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: {
                      url: dataUrl
                    }
                  },
                  {
                    type: "text",
                    text: "Extract all structured data from this document. Return ONLY valid JSON with the exact structure specified."
                  }
                ]
              }
            ],
            max_tokens: 2e3
          });
          const content = response.choices[0]?.message?.content || "{}";
          console.log("\u{1F4C4} Document Analysis: Raw OpenAI response:", content);
          try {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;
            parsed = JSON.parse(jsonString);
            console.log("\u2705 OpenAI successfully extracted document data");
          } catch (parseError) {
            console.error("\u{1F4C4} Failed to parse OpenAI JSON response:", parseError);
            throw parseError;
          }
        } catch (openaiError) {
          console.error("\u274C OpenAI fallback also failed:", openaiError.message);
        }
      }
      if (!parsed) {
        return {
          fields: [],
          extractedData: sanitizeExtractedData({
            doc_type: "image",
            raw_text_snippet: `Image document: ${fileName}`
          }),
          summary: sanitizeText(`This is an image document named ${fileName}. Unable to extract structured data. Please ensure GEMINI_API_KEY or OPENAI_API_KEY is configured.`)
        };
      }
      let summary = parsed.raw_text_snippet || "";
      if (parsed.raw_text_snippet && parsed.raw_text_snippet.length > 100) {
        try {
          const { isApyHubAvailable: isApyHubAvailable2, summarizeLargeText: summarizeLargeText2 } = await Promise.resolve().then(() => (init_apyhubService(), apyhubService_exports));
          const { uploadTextForApyHub: uploadTextForApyHub2 } = await Promise.resolve().then(() => (init_storageHelper(), storageHelper_exports));
          if (isApyHubAvailable2()) {
            const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
            const apyhubResult = await summarizeLargeText2(
              parsed.raw_text_snippet,
              (buffer, filename) => uploadTextForApyHub2(buffer, filename, serverUrl),
              { summary_length: "medium", output_language: "en" }
            );
            if (!apyhubResult.error && apyhubResult.summary) {
              summary = apyhubResult.summary;
              console.log("\u2705 ApyHub summary generated for extracted document content");
            } else {
              console.warn("\u26A0\uFE0F ApyHub summary failed:", apyhubResult.error);
            }
          }
        } catch (summaryError) {
          console.warn("\u26A0\uFE0F ApyHub summary failed, using raw text snippet:", summaryError.message);
        }
      }
      const fields = [];
      if (parsed.issuer) fields.push({ key: "issuer", value: parsed.issuer, confidence: 0.95 });
      if (parsed.account_number) fields.push({ key: "account_number", value: parsed.account_number, confidence: 0.9, isRedacted: true });
      if (parsed.invoice_date) fields.push({ key: "date", value: parsed.invoice_date, confidence: 0.99 });
      if (parsed.due_date) fields.push({ key: "due_date", value: parsed.due_date, confidence: 0.96 });
      if (parsed.amount_due) {
        const amountStr = `${parsed.amount_due.currency || ""} ${parsed.amount_due.value}`.trim();
        fields.push({ key: "amount_due", value: amountStr, confidence: 0.97 });
      }
      if (parsed.line_items && parsed.line_items.length > 0) {
        fields.push({ key: "line_items", value: `${parsed.line_items.length} items`, confidence: 0.92 });
      }
      if (parsed.recipient_name) fields.push({ key: "recipient_name", value: parsed.recipient_name, confidence: 0.9 });
      if (parsed.recipient_email) fields.push({ key: "recipient_email", value: parsed.recipient_email, confidence: 0.88 });
      return {
        fields,
        extractedData: sanitizeExtractedData(parsed),
        summary: sanitizeText(summary),
        ocrText: sanitizeText(ocrTextFromAnalysis || parsed.ocrText || parsed.raw_text_snippet || ""),
        ocrConfidence: 0.95
        // High confidence for extraction
      };
    }
    if (mimeType === "application/pdf") {
      let parsed = null;
      let ocrTextFromAnalysis = void 0;
      try {
        console.log("\u{1F4C4} Using Bytez for PDF document analysis");
        const bytezResult = await analyzeDocumentWithBytez({
          fileBuffer,
          fileName,
          mimeType: "application/pdf"
        });
        if (bytezResult.error) {
          console.warn("\u26A0\uFE0F Bytez PDF analysis failed:", bytezResult.error);
        } else if (bytezResult.extractedData) {
          parsed = bytezResult.extractedData;
          ocrTextFromAnalysis = bytezResult.ocrText;
          console.log("\u2705 Bytez successfully extracted PDF data");
        }
      } catch (bytezError) {
        console.warn("\u26A0\uFE0F Bytez PDF failed, trying Gemini:", bytezError.message);
      }
      if (!parsed && isGeminiAvailable()) {
        try {
          console.log("\u{1F52E} Using Gemini AI for PDF analysis");
          const geminiResult = await analyzeImageWithGemini({
            imageBuffer: fileBuffer,
            mimeType: "application/pdf"
          });
          if (geminiResult.error) {
            console.warn("\u26A0\uFE0F Gemini PDF analysis failed:", geminiResult.error);
            throw new Error(geminiResult.error);
          }
          if (geminiResult.extractedData) {
            parsed = geminiResult.extractedData;
            if (geminiResult.ocrText) {
              parsed.ocrText = geminiResult.ocrText;
            }
            console.log("\u2705 Gemini successfully extracted PDF data");
          } else if (geminiResult.text) {
            parsed = {
              doc_type: "pdf",
              raw_text_snippet: geminiResult.text.substring(0, 1e3),
              ocrText: geminiResult.text
            };
          }
        } catch (geminiError) {
          console.warn("\u26A0\uFE0F Gemini PDF analysis failed:", geminiError.message);
        }
      }
      if (!parsed && openai) {
        return {
          fields: [],
          error: "PDF analysis requires conversion to images. Please upload the document as an image (PNG/JPG) or use a PDF-to-image converter first."
        };
      }
      if (!parsed) {
        return {
          fields: [],
          extractedData: sanitizeExtractedData({
            doc_type: "pdf",
            raw_text_snippet: `PDF document: ${fileName}`
          }),
          summary: sanitizeText(`This is a PDF document named ${fileName}. Unable to extract structured data. Please ensure GEMINI_API_KEY is configured.`)
        };
      }
      let summary = parsed.raw_text_snippet || "";
      if (parsed.raw_text_snippet && parsed.raw_text_snippet.length > 100) {
        try {
          const { isApyHubAvailable: isApyHubAvailable2, summarizeLargeText: summarizeLargeText2 } = await Promise.resolve().then(() => (init_apyhubService(), apyhubService_exports));
          const { uploadTextForApyHub: uploadTextForApyHub2 } = await Promise.resolve().then(() => (init_storageHelper(), storageHelper_exports));
          if (isApyHubAvailable2()) {
            const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
            const apyhubResult = await summarizeLargeText2(
              parsed.raw_text_snippet,
              (buffer, filename) => uploadTextForApyHub2(buffer, filename, serverUrl),
              { summary_length: "medium", output_language: "en" }
            );
            if (!apyhubResult.error && apyhubResult.summary) {
              summary = apyhubResult.summary;
              console.log("\u2705 ApyHub summary generated for PDF content");
            } else {
              console.warn("\u26A0\uFE0F ApyHub summary failed:", apyhubResult.error);
            }
          }
        } catch (summaryError) {
          console.warn("\u26A0\uFE0F ApyHub summary failed, using raw text snippet:", summaryError.message);
        }
      }
      const fields = [];
      if (parsed.issuer) fields.push({ key: "issuer", value: parsed.issuer, confidence: 0.95 });
      if (parsed.account_number) fields.push({ key: "account_number", value: parsed.account_number, confidence: 0.9, isRedacted: true });
      if (parsed.invoice_date) fields.push({ key: "date", value: parsed.invoice_date, confidence: 0.99 });
      if (parsed.due_date) fields.push({ key: "due_date", value: parsed.due_date, confidence: 0.96 });
      if (parsed.amount_due) {
        const amountStr = `${parsed.amount_due.currency || ""} ${parsed.amount_due.value}`.trim();
        fields.push({ key: "amount_due", value: amountStr, confidence: 0.97 });
      }
      if (parsed.line_items && parsed.line_items.length > 0) {
        fields.push({ key: "line_items", value: `${parsed.line_items.length} items`, confidence: 0.92 });
      }
      if (parsed.recipient_name) fields.push({ key: "recipient_name", value: parsed.recipient_name, confidence: 0.9 });
      if (parsed.recipient_email) fields.push({ key: "recipient_email", value: parsed.recipient_email, confidence: 0.88 });
      if (parsed.doc_type === "resume" || parsed.doc_type === "cv" || fileName.toLowerCase().includes("resume") || fileName.toLowerCase().includes("cv")) {
        const text2 = parsed.raw_text_snippet || "";
        const emailMatch = text2.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch && !fields.find((f) => f.key === "recipient_email")) {
          fields.push({ key: "recipient_email", value: emailMatch[0], confidence: 0.85 });
        }
        const phoneMatch = text2.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
          fields.push({ key: "phone", value: phoneMatch[0], confidence: 0.75 });
        }
      }
      return {
        fields,
        extractedData: sanitizeExtractedData(parsed),
        summary: sanitizeText(summary),
        ocrText: sanitizeText(ocrTextFromAnalysis || parsed.ocrText || parsed.raw_text_snippet || ""),
        ocrConfidence: 0.95
        // High confidence for extraction
      };
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        console.log("\u{1F4C4} Processing DOCX file:", fileName);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const text2 = sanitizeText(result.value);
        if (!text2 || text2.length === 0) {
          return {
            fields: [],
            error: "Could not extract text from DOCX file. The file may be corrupted or empty."
          };
        }
        console.log("\u2705 Extracted text from DOCX, length:", text2.length);
        let summary = text2.substring(0, 500);
        try {
          const { isApyHubAvailable: isApyHubAvailable2, summarizeLargeText: summarizeLargeText2 } = await Promise.resolve().then(() => (init_apyhubService(), apyhubService_exports));
          const { uploadTextForApyHub: uploadTextForApyHub2 } = await Promise.resolve().then(() => (init_storageHelper(), storageHelper_exports));
          if (isApyHubAvailable2() && text2.length > 100) {
            const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
            const apyhubResult = await summarizeLargeText2(
              text2,
              (buffer, filename) => uploadTextForApyHub2(buffer, filename, serverUrl),
              { summary_length: "medium", output_language: "en" }
            );
            if (!apyhubResult.error && apyhubResult.summary) {
              summary = sanitizeText(apyhubResult.summary);
              console.log("\u2705 ApyHub summary generated for DOCX");
            } else {
              console.warn("\u26A0\uFE0F ApyHub summary failed:", apyhubResult.error);
              summary = sanitizeText(text2.substring(0, 500));
            }
          }
        } catch (summaryError) {
          console.warn("\u26A0\uFE0F ApyHub summary failed, using text snippet:", summaryError.message);
          summary = sanitizeText(text2.substring(0, 500));
        }
        const fields = [];
        const extractedData = {
          doc_type: "document",
          raw_text_snippet: sanitizeText(text2.substring(0, 1e3))
        };
        const emailMatch = text2.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
          fields.push({ key: "recipient_email", value: emailMatch[0], confidence: 0.7 });
          extractedData.recipient_email = emailMatch[0];
        }
        const dateMatch = text2.match(/\b(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/);
        if (dateMatch) {
          fields.push({ key: "date", value: dateMatch[0], confidence: 0.6 });
          extractedData.invoice_date = dateMatch[0];
        }
        return {
          fields,
          extractedData: sanitizeExtractedData(extractedData),
          summary: sanitizeText(summary),
          ocrText: sanitizeText(text2),
          ocrConfidence: 0.9
        };
      } catch (docxError) {
        console.error("\u274C DOCX parsing error:", docxError);
        return {
          fields: [],
          error: `Failed to parse DOCX file: ${docxError.message || "Unknown error"}`
        };
      }
    }
    try {
      const text2 = sanitizeText(fileBuffer.toString("utf-8"));
      if (text2.length > 0 && !text2.match(/^PK\x03\x04/)) {
        let summary = text2.substring(0, 500);
        try {
          const bytezSummary = await generateDialogueSummary({ text: text2.substring(0, 2e3) });
          if (!bytezSummary.error && bytezSummary.summary) {
            summary = sanitizeText(bytezSummary.summary);
            console.log("\u2705 Bytez summary generated for document");
          }
        } catch (summaryError) {
          console.warn("\u26A0\uFE0F Bytez summary failed, using text snippet:", summaryError);
        }
        return {
          fields: [],
          extractedData: sanitizeExtractedData({
            doc_type: "document",
            raw_text_snippet: text2.substring(0, 1e3)
          }),
          summary: sanitizeText(summary)
        };
      }
    } catch (textError) {
    }
    return {
      fields: [],
      error: `Unsupported file type: ${mimeType}. Supported types: text files, images (PNG/JPG), and PDFs.`
    };
  } catch (error) {
    console.error("\u{1F4C4} Document Analysis Error:", error);
    return {
      fields: [],
      error: error.message || "Failed to analyze document"
    };
  }
}
var openai;
var init_documentService = __esm({
  "server/documentService.ts"() {
    "use strict";
    init_bytezService();
    init_geminiService();
    init_sanitize();
    openai = null;
    if (process.env.OPENAI_API_KEY) {
      openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }
});

// server/reasonerService.ts
import OpenAI2 from "openai";
function simpleHeuristicSummary(text2, extracted) {
  if (!text2 || text2.trim().length === 0) {
    const docType = extracted.doc_type || "document";
    return `This is a ${docType}. No text content was extracted.`;
  }
  const sentences = text2.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 20).slice(0, 3);
  if (sentences.length > 0) {
    let summary = sentences.join(" ");
    if (extracted.issuer) {
      summary += ` Issuer: ${extracted.issuer}.`;
    }
    if (extracted.amount_due) {
      summary += ` Amount: ${extracted.amount_due.currency || ""} ${extracted.amount_due.value}.`;
    }
    if (extracted.invoice_date) {
      summary += ` Date: ${extracted.invoice_date}.`;
    }
    return summary;
  }
  return text2.substring(0, 200) + (text2.length > 200 ? "..." : "");
}
async function generateSuggestedActions(extracted, rawText) {
  const extractedJson = JSON.stringify(extracted, null, 2);
  const contextText = rawText || extracted.raw_text_snippet || "";
  let summaryText = "";
  let summaryResponse;
  try {
    console.log("\u{1F4DD} Using ApyHub for document summarization");
    const textToSummarize = `Document Content:
${contextText}

Extracted Information:
${extractedJson}`;
    const { isApyHubAvailable: isApyHubAvailable2, summarizeLargeText: summarizeLargeText2 } = await Promise.resolve().then(() => (init_apyhubService(), apyhubService_exports));
    const { uploadTextForApyHub: uploadTextForApyHub2 } = await Promise.resolve().then(() => (init_storageHelper(), storageHelper_exports));
    if (isApyHubAvailable2() && textToSummarize.length > 100) {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5678}`;
      const apyhubResult = await summarizeLargeText2(
        textToSummarize,
        (buffer, filename) => uploadTextForApyHub2(buffer, filename, serverUrl),
        { summary_length: "medium", output_language: "en" }
      );
      if (apyhubResult.error) {
        console.warn("\u26A0\uFE0F ApyHub summary failed, falling back to OpenAI:", apyhubResult.error);
        throw new Error(apyhubResult.error);
      }
      summaryText = apyhubResult.summary || "";
      console.log("\u2705 ApyHub summary generated successfully");
      summaryResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ summary: summaryText })
          }
        }]
      };
    } else {
      throw new Error("ApyHub not available or text too short");
    }
  } catch (apyhubError) {
    const errorMessage = apyhubError?.message || String(apyhubError);
    const isPlanError = errorMessage.includes("not on a plan") || errorMessage.includes("plan");
    if (isPlanError) {
      console.warn("\u26A0\uFE0F ApyHub plan/quota error - using fallback summarizer");
    } else {
      console.warn("\u26A0\uFE0F ApyHub summary failed, falling back:", errorMessage);
    }
    if (!openai2) {
      console.warn("\u26A0\uFE0F Bytez failed and OpenAI not available, using heuristic summary");
      summaryText = simpleHeuristicSummary(contextText, extracted);
      summaryResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ summary: summaryText })
          }
        }]
      };
    } else {
      console.log("\u{1F504} Falling back to OpenAI for summary generation");
      summaryResponse = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an executive summarizer. Input: full text of document + extracted_json.
Output: a short 2\u20134 sentence summary suitable for showing to a user. Include key numbers/dates and 1 recommended next-step.

Format:
{
  "summary": "..."
}

Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Extracted data:
${extractedJson}

Document text:
${contextText.substring(0, 2e3)}

Generate a summary.`
          }
        ],
        max_tokens: 300
      });
      summaryText = summaryResponse.choices[0]?.message?.content || "";
    }
  }
  if (!openai2) {
    return {
      summary: parseJsonResponse(summaryResponse.choices[0]?.message?.content || "{}"),
      autofill: { form_mapping: {}, confidence: 0, missing_fields: [] },
      email: { subject: "", body: "" },
      tasks: { tasks: [] }
    };
  }
  const formSchema = [
    { name: "payer_name", type: "string" },
    { name: "account_number", type: "string" },
    { name: "amount", type: "number" },
    { name: "date", type: "string" },
    { name: "due_date", type: "string" },
    { name: "invoice_number", type: "string" },
    { name: "notes", type: "string" }
  ];
  const autofillResponse = await openai2.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a form mapper. Input: 1) extracted_json, 2) target form schema (list of fields with names and types).
Output: JSON mapping of form_field_name -> suggested_value. If field cannot be mapped, return null and an explanation.

Example output:
{
  "form_mapping": {
    "payer_name": "ABC Pvt Ltd",
    "account_number": "12345",
    "amount": "1234.56",
    "date": "2025-12-01",
    "notes": null
  },
  "confidence": 0.87,
  "missing_fields": ["bank_ifsc"]
}

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Extracted data:
${extractedJson}

Form schema:
${JSON.stringify(formSchema, null, 2)}

Generate form mapping.`
      }
    ],
    max_tokens: 500
  });
  const emailResponse = await openai2.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a professional email writer. Input: extracted_json, summary, user tone preference (e.g., formal, friendly). Output: JSON:
{
  "subject": "...",
  "body": "Dear X,

 ...

Regards,
[User Name]"
}

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Extracted data:
${extractedJson}

Summary:
${summaryText}

Tone: professional and friendly. Generate email draft.`
      }
    ],
    max_tokens: 500
  });
  const tasksResponse = await openai2.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a task planner. Input: extracted_json and summary. Output: JSON array of tasks with fields: title, description, due_date, priority, estimated_time_minutes.

Example:
{
  "tasks": [
    {"title": "Pay invoice ACME 123", "description": "Pay \u20B91234.56 via netbanking. Account: xxxxx", "due_date": "2025-12-10", "priority": "high", "estimated_time_minutes": 10}
  ]
}

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Extracted data:
${extractedJson}

Summary:
${summaryText}

Generate tasks.`
      }
    ],
    max_tokens: 500
  });
  return {
    summary: parseJsonResponse(summaryResponse.choices[0]?.message?.content || "{}"),
    autofill: parseJsonResponse(autofillResponse.choices[0]?.message?.content || "{}"),
    email: parseJsonResponse(emailResponse.choices[0]?.message?.content || "{}"),
    tasks: parseJsonResponse(tasksResponse.choices[0]?.message?.content || "{}")
  };
}
var openai2, parseJsonResponse;
var init_reasonerService = __esm({
  "server/reasonerService.ts"() {
    "use strict";
    openai2 = null;
    if (process.env.OPENAI_API_KEY) {
      openai2 = new OpenAI2({ apiKey: process.env.OPENAI_API_KEY });
    }
    parseJsonResponse = (content) => {
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        return JSON.parse(jsonString);
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        return {};
      }
    };
  }
});

// server/murfService.ts
import fetch3 from "node-fetch";
async function generateSpeechWithMurf(options) {
  try {
    console.log("\u{1F3A4} Murf: Starting speech generation with text:", options.text.substring(0, 50) + "...");
    let voiceId = options.voiceId;
    const invalidVoicePatterns = [
      "en-US-Neural2-D",
      "en-US-Neural2-A",
      "en-US-Neural2-F",
      "en-US-Neural2-C"
    ];
    if (voiceId && invalidVoicePatterns.includes(voiceId)) {
      console.warn(`\u26A0\uFE0F Murf: Detected invalid hardcoded voice ID "${voiceId}", fetching valid voice from API...`);
      voiceId = void 0;
    }
    if (voiceId && !voiceId.includes("-") && voiceId.length < 15) {
      const simpleName = voiceId.toLowerCase();
      const nameToVoiceId = {
        "matthew": "en-US-matthew",
        "sarah": "en-US-sarah",
        "james": "en-US-james",
        "michael": "en-US-michael"
      };
      if (nameToVoiceId[simpleName]) {
        console.log(`\u{1F3A4} Murf: Converting simple name "${voiceId}" to proper format "${nameToVoiceId[simpleName]}"`);
        voiceId = nameToVoiceId[simpleName];
      }
    }
    if (!voiceId) {
      console.log("\u{1F3A4} Murf: No voiceId provided, fetching default...");
      const defaultVoiceId = await getDefaultVoiceId();
      if (defaultVoiceId) {
        voiceId = defaultVoiceId;
        console.log(`\u{1F3A4} Murf: Using default voice from API: ${voiceId}`);
      } else {
        if (cachedVoices && cachedVoices.length > 0) {
          const firstVoice = cachedVoices[0];
          voiceId = firstVoice.id || firstVoice.voiceId || firstVoice.voice_id;
          if (voiceId) {
            console.log(`\u{1F3A4} Murf: Using first cached voice: ${voiceId}`);
          }
        }
        if (!voiceId) {
          console.log("\u{1F3A4} Murf: No voice ID found, attempting to fetch voices again...");
          const result = await getMurfVoices();
          if (result.voices && result.voices.length > 0) {
            const firstVoice = result.voices[0];
            voiceId = firstVoice.id || firstVoice.voiceId || firstVoice.voice_id;
            if (voiceId) {
              console.log(`\u{1F3A4} Murf: Found voice after retry: ${voiceId}`);
            }
          }
        }
        if (!voiceId) {
          voiceId = "en-US-matthew";
          console.log(`\u{1F3A4} Murf: Using fallback default voice ID: ${voiceId}`);
        }
      }
    }
    if (voiceId && !voiceId.includes("-") && !voiceId.includes("_") && voiceId.length < 15) {
      const searchName = voiceId.toLowerCase();
      if (cachedVoices && cachedVoices.length > 0) {
        const foundVoice = cachedVoices.find(
          (v) => v.name?.toLowerCase() === searchName || v.voiceName?.toLowerCase() === searchName
        );
        if (foundVoice) {
          const foundId = foundVoice.id || foundVoice.voiceId || foundVoice.voice_id;
          if (foundId) {
            voiceId = foundId;
            console.log(`\u{1F3A4} Murf: Found voice by name, using ID: ${voiceId}`);
          }
        }
      }
      if (!cachedVoices || cachedVoices.length === 0) {
        await getMurfVoices();
        if (cachedVoices && cachedVoices.length > 0) {
          const foundVoice = cachedVoices.find(
            (v) => v.name?.toLowerCase() === searchName || v.voiceName?.toLowerCase() === searchName
          );
          if (foundVoice) {
            const foundId = foundVoice.id || foundVoice.voiceId || foundVoice.voice_id;
            if (foundId) {
              voiceId = foundId;
              console.log(`\u{1F3A4} Murf: Found voice by name after fetch, using ID: ${voiceId}`);
            }
          }
        }
      }
      if (!voiceId || voiceId.length < 15 && !voiceId.includes("-") && !voiceId.includes("_")) {
        const defaultVoiceId = await getDefaultVoiceId();
        if (defaultVoiceId) {
          console.warn(`\u26A0\uFE0F Murf: Voice "${options.voiceId}" not found, using default: ${defaultVoiceId}`);
          voiceId = defaultVoiceId;
        } else {
          return {
            error: `Invalid voice ID: "${options.voiceId}". Please use a valid voice ID from /api/voice/voices.`
          };
        }
      }
    }
    if (!voiceId || voiceId.trim() === "") {
      console.warn("\u26A0\uFE0F Murf: No voice ID provided, using default: en-US-matthew");
      voiceId = "en-US-matthew";
    }
    console.log(`\u{1F3A4} Murf: Final voice ID to use: "${voiceId}"`);
    const requestBody = {
      text: options.text,
      voiceId: voiceId.trim(),
      // Ensure no whitespace
      multiNativeLocale: options.multiNativeLocale || "en-US",
      model: options.model || "FALCON",
      format: (options.format || "MP3").toUpperCase(),
      sampleRate: options.sampleRate || 24e3,
      channelType: "MONO"
    };
    if (options.speed !== void 0) {
      let normalizedSpeed = options.speed;
      if (normalizedSpeed > 10) {
        normalizedSpeed = normalizedSpeed / 100;
      }
      normalizedSpeed = Math.max(0.5, Math.min(2, normalizedSpeed));
      const rate = (normalizedSpeed - 0.5) / 1.5 * 100 - 50;
      requestBody.rate = Math.round(Math.max(-50, Math.min(50, rate)));
      console.log(`\u{1F3A4} Murf: Speed conversion: ${options.speed} \u2192 ${normalizedSpeed} \u2192 rate ${requestBody.rate}`);
    }
    if (options.pitch !== void 0) {
      requestBody.pitch = Math.round(options.pitch);
    }
    console.log("\u{1F3A4} Murf: Request config:", JSON.stringify(requestBody, null, 2));
    const endpoint = `${baseUrl2}/speech/stream`;
    console.log("\u{1F3A4} Murf: API URL:", endpoint);
    let response;
    try {
      console.log("\u{1F3A4} Murf: Attempting API call with api-key header...");
      response = await fetch3(endpoint, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      console.log("\u{1F3A4} Murf: Response status:", response.status);
      if (response.status === 401 || response.status === 403) {
        console.log("\u{1F504} Murf: api-key failed (401/403), trying Authorization header...");
        response = await fetch3(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });
        console.log("\u{1F3A4} Murf: Authorization header response status:", response.status);
      }
    } catch (err) {
      console.error("\u274C Murf: Network/Fetch error:", err);
      return {
        error: `Failed to connect to Murf.ai API: ${err.message}. Please check your internet connection and API endpoint.`
      };
    }
    console.log("\u{1F3A4} Murf: Response status:", response.status);
    console.log("\u{1F3A4} Murf: Response headers:", JSON.stringify(response.headers.raw(), null, 2));
    const contentType = response.headers.get("content-type") || "";
    console.log("\u{1F3A4} Murf: Content-Type:", contentType);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("\u274C Murf API Error Response:", errorText.substring(0, 500));
      if (contentType.includes("text/html") || errorText.trim().startsWith("<!DOCTYPE")) {
        return {
          error: `Murf.ai API returned an error page (${response.status}). Please check your API key and endpoint. The API might require a different endpoint or authentication method.`
        };
      }
      let errorMessage = "Failed to generate speech";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText.substring(0, 200) || `HTTP ${response.status}: ${response.statusText}`;
      }
      return {
        error: errorMessage
      };
    }
    if (contentType.includes("application/json")) {
      const jsonData = await response.json();
      console.log("\u{1F3A4} Murf: JSON Response:", JSON.stringify(jsonData, null, 2));
      if (jsonData.audio_file || jsonData.audioUrl) {
        const audioUrl = jsonData.audio_file || jsonData.audioUrl;
        const audioResponse = await fetch3(audioUrl);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        const base64Audio = audioBuffer.toString("base64");
        const mimeType = options.format === "wav" ? "audio/wav" : "audio/mpeg";
        const dataUrl = `data:${mimeType};base64,${base64Audio}`;
        return {
          audioUrl: dataUrl,
          audioBuffer
        };
      }
      return {
        error: "No audio file URL in API response",
        raw: jsonData
      };
    } else {
      let audioBuffer;
      try {
        audioBuffer = await response.buffer();
      } catch (err) {
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
      }
      if (!audioBuffer || audioBuffer.length === 0) {
        console.error("\u274C Murf: Empty audio response");
        return {
          error: "Received empty audio response from Murf.ai"
        };
      }
      console.log(`\u2705 Murf: Generated audio (${audioBuffer.length} bytes)`);
      const base64Audio = audioBuffer.toString("base64");
      const mimeType = options.format === "wav" ? "audio/wav" : "audio/mpeg";
      const audioUrl = `data:${mimeType};base64,${base64Audio}`;
      return {
        audioUrl,
        audioBuffer
      };
    }
  } catch (err) {
    console.error("\u274C Murf Service Error:", err);
    return {
      error: err.message || "Murf.ai service encountered an unexpected error"
    };
  }
}
async function getMurfVoices() {
  try {
    if (cachedVoices && cachedVoices.length > 0) {
      console.log(`\u{1F3A4} Using cached voices (${cachedVoices.length} voices)`);
      return { voices: cachedVoices };
    }
    if (voicesFetchPromise) {
      console.log("\u{1F3A4} Waiting for ongoing voice fetch...");
      const voices2 = await voicesFetchPromise;
      return { voices: voices2 };
    }
    voicesFetchPromise = (async () => {
      try {
        console.log("\u{1F3A4} Fetching voices from Murf.ai API...");
        const response = await fetch3(`${baseUrl2}/speech/voices`, {
          method: "GET",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json"
          }
        });
        console.log(`\u{1F3A4} Voices API response status: ${response.status}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("\u274C Failed to fetch Murf voices:", errorText);
          if (response.status === 401 || response.status === 403) {
            console.log("\u{1F504} Trying Authorization header...");
            const authResponse = await fetch3(`${baseUrl2}/speech/voices`, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
              }
            });
            if (authResponse.ok) {
              const authData = await authResponse.json();
              const voices3 = authData.voices || authData || [];
              cachedVoices = Array.isArray(voices3) ? voices3 : [];
              console.log(`\u2705 Fetched ${cachedVoices.length} voices using Authorization header`);
              return cachedVoices;
            }
          }
          return [];
        }
        const data = await response.json();
        console.log("\u{1F3A4} Voices API response:", JSON.stringify(data, null, 2).substring(0, 1e3));
        let voices2 = [];
        if (Array.isArray(data)) {
          voices2 = data;
        } else if (data.voices && Array.isArray(data.voices)) {
          voices2 = data.voices;
        } else if (data.data && Array.isArray(data.data)) {
          voices2 = data.data;
        } else if (typeof data === "object") {
          for (const key in data) {
            if (Array.isArray(data[key])) {
              voices2 = data[key];
              break;
            }
          }
        }
        cachedVoices = voices2;
        console.log(`\u2705 Fetched ${cachedVoices.length} voices from Murf.ai`);
        if (cachedVoices.length > 0) {
          console.log("\u{1F3A4} First voice structure:", JSON.stringify(cachedVoices[0], null, 2));
        } else {
          console.warn("\u26A0\uFE0F No voices found in API response. Full response:", JSON.stringify(data, null, 2));
        }
        return cachedVoices;
      } catch (err) {
        console.error("\u274C Failed to fetch Murf voices:", err);
        console.error("\u274C Error stack:", err.stack);
        return [];
      } finally {
        voicesFetchPromise = null;
      }
    })();
    const voices = await voicesFetchPromise;
    return { voices };
  } catch (err) {
    console.error("\u274C Failed to fetch Murf voices:", err);
    return {
      voices: [],
      error: err.message || "Failed to fetch voices"
    };
  }
}
async function getDefaultVoiceId() {
  try {
    const result = await getMurfVoices();
    console.log("\u{1F3A4} getDefaultVoiceId: Fetched voices result:", JSON.stringify(result, null, 2));
    if (result.error) {
      console.error("\u274C Error fetching voices:", result.error);
      return null;
    }
    if (result.voices && result.voices.length > 0) {
      for (const voice of result.voices) {
        const voiceId = voice.id || voice.voiceId || voice.voice_id || voice.voiceId;
        if (voiceId && typeof voiceId === "string" && voiceId.length > 0) {
          console.log(`\u2705 Using default voice ID: ${voiceId} (from voice: ${JSON.stringify(voice)})`);
          return voiceId;
        }
      }
      console.log("\u26A0\uFE0F Voices fetched but no valid ID found. Voice structure:", JSON.stringify(result.voices[0], null, 2));
    } else {
      console.warn("\u26A0\uFE0F No voices returned from API");
    }
    return null;
  } catch (err) {
    console.error("\u274C Failed to get default voice ID:", err);
    return null;
  }
}
var apiKey, baseUrl2, cachedVoices, voicesFetchPromise;
var init_murfService = __esm({
  "server/murfService.ts"() {
    "use strict";
    apiKey = process.env.MURF_API_KEY || "ap2_7416f00f-4e9a-4368-8ca2-707a27a26196";
    baseUrl2 = "https://global.api.murf.ai/v1";
    cachedVoices = null;
    voicesFetchPromise = null;
  }
});

// server/sambanovaService.ts
import fetch4 from "node-fetch";
function isSambaNovaAvailable() {
  return !!sambanovaApiKey && sambanovaApiKey.length > 0;
}
async function generateChatCompletion(options) {
  try {
    if (!isSambaNovaAvailable()) {
      return {
        error: "SambaNova API key is not configured. Please set SAMBANOVA_API_KEY in your environment variables."
      };
    }
    console.log("\u{1F916} SambaNova: Starting chat completion");
    console.log("\u{1F916} SambaNova: Model:", options.model || "ALLaM-7B-Instruct-preview");
    console.log("\u{1F916} SambaNova: Messages count:", options.messages.length);
    const requestBody = {
      model: options.model || "ALLaM-7B-Instruct-preview",
      messages: options.messages,
      stream: options.stream || false,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1e3
    };
    const response = await fetch4(`${baseUrl3}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sambanovaApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `SambaNova API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      console.error("\u274C SambaNova API Error:", errorMessage);
      return { error: errorMessage };
    }
    const data = await response.json();
    console.log("\u{1F916} SambaNova: Raw API response structure:", JSON.stringify(Object.keys(data), null, 2));
    if (data.choices) {
      console.log("\u{1F916} SambaNova: Choices count:", data.choices.length);
      if (data.choices[0]) {
        console.log("\u{1F916} SambaNova: First choice structure:", JSON.stringify(Object.keys(data.choices[0]), null, 2));
      }
    }
    if (options.stream && data.stream) {
      console.warn("\u26A0\uFE0F Streaming response not fully implemented yet, using non-streaming");
    }
    let message = "";
    if (data.choices && data.choices[0]) {
      message = data.choices[0].message?.content || data.choices[0].text || "";
    }
    if (!message) {
      message = data.content || data.text || data.message || "";
    }
    const usage = data.usage || {};
    if (!message) {
      console.warn("\u26A0\uFE0F SambaNova: No message content in response");
      console.warn("\u26A0\uFE0F SambaNova: Full response:", JSON.stringify(data, null, 2).substring(0, 1e3));
      return {
        error: "No response content received from SambaNova API"
      };
    }
    console.log("\u2705 SambaNova: Chat completion generated successfully");
    console.log("\u{1F916} SambaNova: Response length:", message.length);
    console.log("\u{1F916} SambaNova: Response preview:", message.substring(0, 200));
    return {
      message,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      }
    };
  } catch (error) {
    console.error("\u274C SambaNova Service Error:", error);
    return {
      error: error.message || "SambaNova service encountered an unexpected error"
    };
  }
}
var sambanovaApiKey, baseUrl3;
var init_sambanovaService = __esm({
  "server/sambanovaService.ts"() {
    "use strict";
    sambanovaApiKey = process.env.SAMBANOVA_API_KEY || "c8238532-f38b-4180-8ab1-bae5a4f1fd30";
    baseUrl3 = "https://api.sambanova.ai/v1";
  }
});

// server/workflowService.ts
async function executeWorkflow(workflow, userId) {
  const nodes = workflow.nodes || [];
  const edges = workflow.edges || [];
  const run = await storage.createWorkflowRun({
    workflowId: workflow.id,
    userId,
    status: "processing",
    logs: []
  });
  const logs = [];
  let currentStatus = "processing";
  let errorMessage = null;
  try {
    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      throw new Error("No trigger node found in workflow");
    }
    logs.push({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
      message: `Starting workflow execution: ${workflow.name}`,
      nodeId: triggerNode.id
    });
    const processedNodes = /* @__PURE__ */ new Set();
    const nodeQueue = [triggerNode.id];
    while (nodeQueue.length > 0) {
      const currentNodeId = nodeQueue.shift();
      if (processedNodes.has(currentNodeId)) continue;
      const node = nodes.find((n) => n.id === currentNodeId);
      if (!node) continue;
      processedNodes.add(currentNodeId);
      if (node.type === "action" && node.actionType) {
        try {
          const result = await executeAction(node.actionType, node.config || {}, userId);
          logs.push({
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            level: "info",
            message: `Executed action: ${node.label}`,
            nodeId: node.id,
            result
          });
          const nextEdges = edges.filter((e) => e.source === currentNodeId);
          for (const edge of nextEdges) {
            if (!processedNodes.has(edge.target)) {
              nodeQueue.push(edge.target);
            }
          }
        } catch (error) {
          logs.push({
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            level: "error",
            message: `Failed to execute action: ${node.label}`,
            nodeId: node.id,
            error: error.message
          });
          currentStatus = "failed";
          errorMessage = error.message;
          break;
        }
      } else if (node.type === "trigger") {
        const nextEdges = edges.filter((e) => e.source === currentNodeId);
        for (const edge of nextEdges) {
          if (!processedNodes.has(edge.target)) {
            nodeQueue.push(edge.target);
          }
        }
      }
    }
    if (currentStatus === "processing") {
      currentStatus = "completed";
      logs.push({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        level: "info",
        message: "Workflow execution completed successfully"
      });
    }
    await storage.updateWorkflowRun(run.id, {
      status: currentStatus,
      logs: errorMessage ? [...logs, { error: errorMessage, timestamp: (/* @__PURE__ */ new Date()).toISOString() }] : logs,
      completedAt: /* @__PURE__ */ new Date()
    });
    return await storage.getWorkflowRun(run.id);
  } catch (error) {
    currentStatus = "failed";
    errorMessage = error.message;
    logs.push({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "error",
      message: `Workflow execution failed: ${error.message}`
    });
    await storage.updateWorkflowRun(run.id, {
      status: "failed",
      logs: [...logs, { error: errorMessage, timestamp: (/* @__PURE__ */ new Date()).toISOString() }],
      completedAt: /* @__PURE__ */ new Date()
    });
    throw error;
  }
}
async function executeAction(actionType, config, userId) {
  switch (actionType) {
    case "email":
      return {
        success: true,
        message: "Email would be sent here",
        to: config.to || "example@email.com",
        subject: config.subject || "Automated Email",
        body: config.body || ""
      };
    case "scrape":
      return {
        success: true,
        message: "Web scraping would happen here",
        url: config.url || "",
        data: []
      };
    case "autofill":
      return {
        success: true,
        message: "Form would be autofilled here",
        formData: config.formData || {}
      };
    case "schedule":
      return {
        success: true,
        message: "Task would be scheduled here",
        schedule: config.schedule || "daily"
      };
    case "api":
      try {
        const response = await fetch(config.url || "", {
          method: config.method || "GET",
          headers: config.headers || {},
          body: config.body ? JSON.stringify(config.body) : void 0
        });
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data
        };
      } catch (error) {
        throw new Error(`API request failed: ${error.message}`);
      }
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
async function getWorkflowStats(workflowId) {
  const runs = await storage.getWorkflowRuns(workflowId);
  const successCount = runs.filter((r) => r.status === "completed").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const lastRun = runs.length > 0 ? runs[0].createdAt || void 0 : void 0;
  return {
    totalRuns: runs.length,
    successCount,
    failedCount,
    lastRun
  };
}
var init_workflowService = __esm({
  "server/workflowService.ts"() {
    "use strict";
    init_storage();
  }
});

// server/routes.ts
var routes_exports = {};
__export(routes_exports, {
  registerRoutes: () => registerRoutes
});
import { WebSocketServer } from "ws";
import multer from "multer";
import OpenAI3 from "openai";
function getUserId(req) {
  const user = req.user;
  const userId = user?.uid || user?.user_id || user?.sub || user?.id;
  if (!userId) {
    console.warn("\u26A0\uFE0F No user ID found in token, using fallback:", JSON.stringify({
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : []
    }));
    return "local-dev-user";
  }
  return userId;
}
async function registerRoutes(httpServer, app2) {
  app2.get("/api/health", async (req, res) => {
    try {
      const health = {
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        environment: {
          nodeEnv: "production",
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasSessionSecret: !!process.env.SESSION_SECRET,
          hasOpenaiKey: !!process.env.OPENAI_API_KEY,
          vercel: !!process.env.VERCEL
        },
        // Test database connection
        database: "unknown"
      };
      try {
        const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
        await db2.select().from(users).limit(1);
        health.database = "connected";
      } catch (dbError) {
        health.database = `error: ${dbError.message}`;
      }
      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: "error",
        message: error.message,
        stack: false ? error.stack : void 0
      });
    }
  });
  app2.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("\u{1F4CB} Fetching projects for user:", userId);
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null
        });
        console.log("\u2705 Created user:", userId);
      }
      const projects2 = await storage.getProjects(userId);
      console.log("\u2705 Found", projects2.length, "projects");
      res.json(projects2);
    } catch (error) {
      console.error("\u274C Failed to fetch projects:", error);
      console.error("\u274C Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch projects", message: error.message });
    }
  });
  app2.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (!project.isPublic) {
        try {
          const userId = getUserId(req);
          if (!userId || project.userId !== userId) {
            return res.status(404).json({ error: "Project not found" });
          }
        } catch {
          return res.status(404).json({ error: "Project not found" });
        }
      }
      const assets2 = await storage.getAssets(project.userId, project.id);
      res.json({
        ...project,
        assets: assets2
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });
  app2.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user;
        console.log("\u{1F4CB} Creating user from token:", JSON.stringify({ uid: userInfo?.uid, email: userInfo?.email, name: userInfo?.name }, null, 2));
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null
        });
        console.log("\u2705 Created user:", userId);
      }
      const title = req.body.title?.trim();
      const description = req.body.description?.trim() || null;
      if (!title || title.length === 0) {
        return res.status(400).json({ error: "Project title is required" });
      }
      const isPublic = req.body.isPublic === true || req.body.isPublic === "true" || false;
      const isStarred = req.body.isStarred === true || req.body.isStarred === "true" || false;
      const projectData = {
        userId,
        title,
        description: description && description.length > 0 ? description : null,
        isPublic,
        isStarred
      };
      console.log("\u{1F4CB} Project creation request:", JSON.stringify(projectData, null, 2));
      const data = insertProjectSchema.parse(projectData);
      console.log("\u2705 Validated project data:", JSON.stringify(data, null, 2));
      const project = await storage.createProject(data);
      console.log("\u2705 Project created:", project.id);
      res.status(201).json(project);
    } catch (error) {
      console.error("\u274C Project creation error:", error);
      console.error("\u274C Error stack:", error.stack);
      console.error("\u274C Request body:", JSON.stringify(req.body, null, 2));
      console.error("\u274C User ID extracted:", getUserId(req));
      if (error.issues) {
        console.error("\u274C Zod validation errors:", JSON.stringify(error.issues, null, 2));
        const errorDetails = error.issues.map((issue) => ({
          path: issue.path?.join?.(".") || String(issue.path),
          message: issue.message,
          code: issue.code,
          received: issue.received
        }));
        res.status(400).json({
          error: "Invalid project data",
          details: errorDetails,
          message: error.message,
          received: req.body
        });
      } else {
        res.status(400).json({
          error: "Invalid project data",
          message: error.message,
          type: error.constructor?.name
        });
      }
    }
  });
  app2.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== getUserId(req)) return res.status(404).json({ error: "Project not found" });
      const updated = await storage.updateProject(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("\u274C Project update error:", error);
      res.status(500).json({ error: "Failed to update project", message: error.message });
    }
  });
  app2.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found" });
      if (project.userId !== getUserId(req)) return res.status(404).json({ error: "Project not found" });
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found or already deleted" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("\u274C Failed to delete project:", error);
      console.error("\u274C Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to delete project",
        message: error.message || "An unexpected error occurred",
        details: false ? error.stack : void 0
      });
    }
  });
  app2.get("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("\u{1F4E6} Fetching assets for user:", userId);
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null
        });
        console.log("\u2705 Created user:", userId);
      }
      const projectId = req.query.projectId;
      const assets2 = await storage.getAssets(userId, projectId);
      console.log("\u2705 Found", assets2.length, "assets");
      res.json(assets2);
    } catch (error) {
      console.error("\u274C Failed to fetch assets:", error);
      console.error("\u274C Error stack:", error.stack);
      res.status(500).json({ error: "Failed to fetch assets", message: error.message });
    }
  });
  app2.post("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const data = insertAssetSchema.parse({ ...req.body, userId: getUserId(req) });
      const asset = await storage.createAsset(data);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ error: "Invalid asset data" });
    }
  });
  app2.delete("/api/assets/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations2 = await storage.getConversations(getUserId(req));
      res.json(conversations2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      let user = await storage.getUser(userId);
      if (!user) {
        const userInfo = req.user;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null
        });
      }
      const data = insertConversationSchema.parse({ ...req.body, userId });
      const conversation = await storage.createConversation(data);
      res.status(201).json(conversation);
    } catch (error) {
      console.error("\u274C Conversation creation error:", error);
      if (error.issues) {
        res.status(400).json({ error: "Invalid conversation data", details: error.issues });
      } else {
        res.status(400).json({ error: "Invalid conversation data", message: error.message });
      }
    }
  });
  app2.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.userId !== getUserId(req)) return res.status(404).json({ error: "Conversation not found" });
      const messages2 = await storage.getMessages(req.params.conversationId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.conversationId);
      if (!conversation) return res.status(404).json({ error: "Conversation not found" });
      if (conversation.userId !== getUserId(req)) return res.status(404).json({ error: "Conversation not found" });
      const data = insertMessageSchema.parse({
        ...req.body,
        conversationId: req.params.conversationId
      });
      const message = await storage.createMessage(data);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });
  app2.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, conversationId } = req.body;
      let conversationHistory = [];
      if (conversationId) {
        const messages2 = await storage.getMessages(conversationId);
        conversationHistory = messages2.map((m) => ({
          role: m.role,
          content: m.content
        }));
      }
      const systemPrompt = "You are LifeNavigator, a helpful AI assistant. Answer the user's questions directly and accurately. Be concise, clear, and helpful. If the user asks about a topic, provide a direct answer rather than introducing yourself again.";
      let assistantMessage = "";
      let usage = null;
      if (isSambaNovaAvailable()) {
        try {
          console.log("\u{1F916} Using SambaNova AI for chat");
          console.log("\u{1F916} User message:", message);
          console.log("\u{1F916} Conversation history length:", conversationHistory.length);
          const messages2 = [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map((msg) => ({
              role: msg.role === "user" ? "user" : msg.role === "assistant" ? "assistant" : "user",
              content: msg.content
            })),
            { role: "user", content: message }
          ];
          console.log("\u{1F916} SambaNova messages being sent:", JSON.stringify(messages2.map((m) => ({ role: m.role, content: m.content.substring(0, 100) })), null, 2));
          const sambanovaResult = await generateChatCompletion({
            messages: messages2,
            model: "ALLaM-7B-Instruct-preview",
            stream: false,
            temperature: 0.8,
            // Increased for more varied responses
            max_tokens: 2e3
            // Increased token limit
          });
          if (sambanovaResult.error) {
            throw new Error(sambanovaResult.error);
          }
          assistantMessage = sambanovaResult.message || "I apologize, but I couldn't generate a response.";
          usage = sambanovaResult.usage;
          console.log("\u2705 SambaNova chat response generated");
        } catch (sambanovaError) {
          console.warn("\u26A0\uFE0F SambaNova chat failed, trying Gemini fallback:", sambanovaError.message);
        }
      }
      if (!assistantMessage && isGeminiAvailable()) {
        try {
          console.log("\u{1F52E} Using Gemini AI for chat");
          let fullPrompt = systemPrompt + "\n\n";
          if (conversationHistory.length > 0) {
            fullPrompt += "Previous conversation:\n";
            conversationHistory.forEach((msg, idx) => {
              fullPrompt += `${msg.role}: ${msg.content}
`;
            });
          }
          fullPrompt += `
User: ${message}
Assistant:`;
          const geminiResult = await generateTextWithGemini(fullPrompt, "gemini-1.5-flash");
          if (geminiResult.error) {
            throw new Error(geminiResult.error);
          }
          assistantMessage = geminiResult.text || "I apologize, but I couldn't generate a response.";
          console.log("\u2705 Gemini chat response generated");
        } catch (geminiError) {
          console.warn("\u26A0\uFE0F Gemini chat failed, trying OpenAI fallback:", geminiError.message);
        }
      }
      if (!assistantMessage && openai3) {
        try {
          console.log("\u{1F504} Using OpenAI for chat (fallback)");
          const systemMessage = {
            role: "system",
            content: systemPrompt
          };
          const completion = await openai3.chat.completions.create({
            model: "gpt-4o",
            messages: [
              systemMessage,
              ...conversationHistory,
              { role: "user", content: message }
            ],
            max_tokens: 1e3
          });
          assistantMessage = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
          usage = completion.usage;
          console.log("\u2705 OpenAI chat response generated");
        } catch (openaiError) {
          console.error("\u274C OpenAI chat also failed:", openaiError.message);
        }
      }
      if (!assistantMessage) {
        return res.status(503).json({
          error: "AI not configured",
          message: "Please add your SAMBANOVA_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to enable AI features.",
          fallbackResponse: "I'm currently unavailable. Please configure the SAMBANOVA_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to enable AI chat features."
        });
      }
      res.json({
        message: assistantMessage,
        usage
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate response", details: error.message });
    }
  });
  app2.post("/api/images/generate", isAuthenticated, async (req, res) => {
    try {
      const { prompt, style, size = "1024x1024", n = 1, provider = "bytez", projectId } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      let images = [];
      if (provider === "bytez" || !openai3) {
        console.log("\u{1F5BC}\uFE0F  Image Generation: Using Bytez.js");
        const bytezResult = await generateImageWithBytez({ prompt, style, size });
        if (bytezResult.error) {
          console.error("\u274C Bytez failed:", bytezResult.error);
          console.log("\u{1F4CB} Bytez raw output:", JSON.stringify(bytezResult.raw, null, 2));
          if (openai3) {
            console.log("\u{1F504} Bytez failed, falling back to OpenAI");
            try {
              const styledPrompt = style ? `${prompt}, in ${style} style` : prompt;
              const response = await openai3.images.generate({
                model: "dall-e-3",
                prompt: styledPrompt,
                n: Math.min(n, 1),
                size,
                quality: "standard"
              });
              images = (response.data || []).map((img) => ({
                url: img.url || "",
                revisedPrompt: img.revised_prompt
              })).filter((img) => img.url);
              console.log("\u2705 OpenAI fallback succeeded");
            } catch (openaiError) {
              console.error("\u274C OpenAI fallback also failed:", openaiError.message);
              return res.status(503).json({
                error: "Image generation failed",
                message: `Bytez: ${bytezResult.error}. OpenAI fallback also failed: ${openaiError.message}`,
                fallbackResponse: "Image generation is currently unavailable. Please check your API keys."
              });
            }
          } else {
            console.error("\u274C No fallback available - returning 503");
            return res.status(503).json({
              error: "Image generation failed",
              message: bytezResult.error || "Please configure BYTEZ_API_KEY or OPENAI_API_KEY",
              fallbackResponse: "Image generation is currently unavailable. Please check your API keys.",
              details: bytezResult.raw ? JSON.stringify(bytezResult.raw) : void 0
            });
          }
        } else {
          const urls = bytezResult.urls || (bytezResult.url ? [bytezResult.url] : []);
          if (urls.length === 0) {
            console.error("\u274C Bytez returned success but no URLs found");
            return res.status(503).json({
              error: "No images returned",
              message: "Image generation completed but no image URLs were returned",
              fallbackResponse: "Image generation failed. Please try again.",
              details: JSON.stringify(bytezResult.raw)
            });
          }
          console.log("\u2705 Bytez succeeded, returning", urls.length, "image(s)");
          images = urls.map((url) => ({
            url,
            revisedPrompt: prompt
          }));
        }
      } else if (provider === "openai" && openai3) {
        const styledPrompt = style ? `${prompt}, in ${style} style` : prompt;
        const response = await openai3.images.generate({
          model: "dall-e-3",
          prompt: styledPrompt,
          n: Math.min(n, 1),
          size,
          quality: "standard"
        });
        images = (response.data || []).map((img) => ({
          url: img.url || "",
          revisedPrompt: img.revised_prompt
        })).filter((img) => img.url);
      } else {
        return res.status(503).json({
          error: "No image provider available",
          message: "Please configure BYTEZ_API_KEY or OPENAI_API_KEY"
        });
      }
      const userId = getUserId(req);
      const savedAssets = [];
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
              provider: provider || "bytez"
            }
          });
          savedAssets.push(asset);
        } catch (assetError) {
          console.error("Failed to save asset:", assetError);
        }
      }
      const imagesWithAssets = images.map((img, index2) => ({
        ...img,
        assetId: savedAssets[index2]?.id
      }));
      res.json({
        images: imagesWithAssets,
        provider: provider || "bytez"
      });
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({
        error: "Failed to generate image",
        details: error.message,
        fallbackResponse: "Image generation failed. Please try again or check your API configuration."
      });
    }
  });
  app2.post("/api/videos/generate", isAuthenticated, async (req, res) => {
    try {
      const { prompt, duration, projectId } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const userId = getUserId(req);
      console.log("\u{1F3AC} Video Generation: Starting with prompt:", prompt);
      const job = await storage.createJob({
        userId,
        type: "video_generation",
        status: "pending",
        input: { prompt, duration, projectId }
      });
      console.log("\u2705 Video generation job created:", job.id);
      res.status(202).json({
        jobId: job.id,
        status: "pending",
        message: "Video generation started. Poll /api/jobs/:id for status.",
        pollUrl: `/api/jobs/${job.id}`
      });
      (async () => {
        try {
          await storage.updateJob(job.id, { status: "processing" });
          console.log("\u{1F3AC} Video Generation: Processing job", job.id);
          let videoResult;
          let provider = "unknown";
          try {
            videoResult = await generateVideoWithGoogle({ prompt, duration });
            provider = "google-veo";
            if (videoResult.error) {
              console.log("\u26A0\uFE0F Google Veo failed, trying Bytez fallback...");
              videoResult = await generateVideoWithBytez({ prompt, duration });
              provider = "bytez";
            }
          } catch (googleError) {
            console.warn("\u26A0\uFE0F Google Veo error, trying Bytez fallback:", googleError.message);
            videoResult = await generateVideoWithBytez({ prompt, duration });
            provider = "bytez";
          }
          if (videoResult.error) {
            console.error("\u274C Video generation failed:", videoResult.error);
            await storage.updateJob(job.id, {
              status: "failed",
              errorMessage: videoResult.error,
              completedAt: /* @__PURE__ */ new Date()
            });
            return;
          }
          const urls = videoResult.urls || (videoResult.url ? [videoResult.url] : []);
          if (urls.length === 0) {
            console.error("\u274C Video generation returned success but no video URLs found");
            await storage.updateJob(job.id, {
              status: "failed",
              errorMessage: "No video URLs returned",
              completedAt: /* @__PURE__ */ new Date()
            });
            return;
          }
          console.log("\u2705 Video generation succeeded, saving", urls.length, "video(s)");
          const savedVideos = [];
          for (const url of urls) {
            try {
              const asset = await storage.createAsset({
                userId,
                type: "video",
                name: prompt.slice(0, 50),
                url,
                projectId: projectId || null,
                metadata: { prompt, duration, provider }
              });
              savedVideos.push({
                id: asset.id,
                url: asset.url,
                prompt
              });
            } catch (assetError) {
              console.error("Failed to save video asset:", assetError);
              savedVideos.push({
                id: `temp-${Date.now()}`,
                url,
                prompt
              });
            }
          }
          await storage.updateJob(job.id, {
            status: "completed",
            result: {
              videos: savedVideos,
              provider
            },
            resultUrl: savedVideos[0]?.url,
            completedAt: /* @__PURE__ */ new Date()
          });
          console.log("\u2705 Video generation job completed:", job.id);
        } catch (error) {
          console.error("\u274C Video generation job error:", error);
          await storage.updateJob(job.id, {
            status: "failed",
            errorMessage: error.message || "Video generation failed",
            completedAt: /* @__PURE__ */ new Date()
          });
        }
      })();
    } catch (error) {
      console.error("Video generation request error:", error);
      res.status(500).json({
        error: "Failed to start video generation",
        details: error.message
      });
    }
  });
  app2.post("/api/documents/actions/autofill", isAuthenticated, async (req, res) => {
    try {
      const { mapping, targetUrl, consent } = req.body;
      if (!consent) {
        return res.status(400).json({ error: "User consent required for autofill" });
      }
      console.log("\u{1F510} Autofill simulation requested for:", targetUrl);
      console.log("\u{1F4CB} Mapping:", mapping);
      res.json({
        success: true,
        status: "simulated",
        message: "Autofill simulation completed. In production, this would fill the form.",
        mapping
      });
    } catch (error) {
      console.error("Autofill error:", error);
      res.status(500).json({ error: "Failed to execute autofill", details: error.message });
    }
  });
  app2.post("/api/documents/actions/email", isAuthenticated, async (req, res) => {
    try {
      const { to, subject, body, consent } = req.body;
      if (!consent) {
        return res.status(400).json({ error: "User consent required to send email" });
      }
      console.log("\u{1F4E7} Email draft prepared:", { to, subject });
      const userId = getUserId(req);
      try {
        await storage.createMemory({
          userId,
          key: `email_draft_${Date.now()}`,
          value: JSON.stringify({ to, subject, body }),
          consent: true
        });
      } catch (memoryError) {
        console.error("Failed to save email draft:", memoryError);
      }
      res.json({
        success: true,
        message: "Email draft saved. In production, this would send the email.",
        email: { to, subject, body }
      });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to process email", details: error.message });
    }
  });
  app2.post("/api/documents/actions/tasks", isAuthenticated, async (req, res) => {
    try {
      const { tasks } = req.body;
      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: "Tasks array is required" });
      }
      const userId = getUserId(req);
      const createdTasks = [];
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
              estimated_time: task.estimated_time_minutes
            }
          });
          createdTasks.push(job);
        } catch (jobError) {
          console.error("Failed to create task:", jobError);
        }
      }
      res.json({
        success: true,
        tasks: createdTasks,
        message: `Created ${createdTasks.length} task(s)`
      });
    } catch (error) {
      console.error("Tasks error:", error);
      res.status(500).json({ error: "Failed to create tasks", details: error.message });
    }
  });
  app2.get("/api/memories", isAuthenticated, async (req, res) => {
    try {
      const memories2 = await storage.getMemories(getUserId(req));
      res.json(memories2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memories" });
    }
  });
  app2.post("/api/memories", isAuthenticated, async (req, res) => {
    try {
      const data = insertMemorySchema.parse({ ...req.body, userId: getUserId(req) });
      const memory = await storage.createMemory(data);
      res.status(201).json(memory);
    } catch (error) {
      res.status(400).json({ error: "Invalid memory data" });
    }
  });
  app2.delete("/api/memories/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/memories", isAuthenticated, async (req, res) => {
    try {
      await storage.clearMemories(getUserId(req));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear memories" });
    }
  });
  app2.get("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs2 = await storage.getJobs(getUserId(req));
      res.json(jobs2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
  app2.get("/api/jobs/:id", isAuthenticated, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.userId !== getUserId(req)) return res.status(404).json({ error: "Job not found" });
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      });
      res.json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch job" });
    }
  });
  app2.post("/api/jobs", isAuthenticated, async (req, res) => {
    try {
      const data = insertJobSchema.parse({ ...req.body, userId: getUserId(req) });
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      res.status(400).json({ error: "Invalid job data" });
    }
  });
  app2.get("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      const workflows2 = await storage.getWorkflows(getUserId(req));
      res.json(workflows2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });
  app2.post("/api/workflows", isAuthenticated, async (req, res) => {
    try {
      console.log("\u{1F4CB} Creating workflow with data:", JSON.stringify(req.body, null, 2));
      const userId = getUserId(req);
      console.log("\u{1F4CB} User ID:", userId);
      let user = await storage.getUser(userId);
      if (!user) {
        console.log("\u{1F464} User not found, creating user:", userId);
        const userInfo = req.user;
        user = await storage.upsertUser({
          id: userId,
          email: userInfo?.email || `user-${userId}@example.com`,
          firstName: userInfo?.name?.split(" ")[0] || userInfo?.displayName?.split(" ")[0] || "User",
          lastName: userInfo?.name?.split(" ").slice(1).join(" ") || userInfo?.displayName?.split(" ").slice(1).join(" ") || "",
          profileImageUrl: userInfo?.picture || userInfo?.profileImageUrl || null
        });
        console.log("\u2705 User created/updated:", user.id);
      }
      const workflowData = {
        userId,
        name: req.body.name?.trim(),
        description: req.body.description?.trim() || null,
        nodes: Array.isArray(req.body.nodes) ? req.body.nodes : [],
        edges: Array.isArray(req.body.edges) ? req.body.edges : [],
        isActive: req.body.isActive ?? false
      };
      if (!workflowData.name || workflowData.name.length === 0) {
        return res.status(400).json({ error: "Workflow name is required" });
      }
      console.log("\u{1F4CB} Transformed data:", JSON.stringify(workflowData, null, 2));
      const data = insertWorkflowSchema.parse(workflowData);
      console.log("\u{1F4CB} Parsed data:", JSON.stringify(data, null, 2));
      const workflow = await storage.createWorkflow(data);
      console.log("\u2705 Workflow created:", workflow.id);
      res.status(201).json(workflow);
    } catch (error) {
      console.error("\u274C Workflow creation error:", error);
      console.error("\u274C Error stack:", error.stack);
      if (error.issues) {
        console.error("\u274C Zod validation errors:", JSON.stringify(error.issues, null, 2));
        const errorDetails = error.issues.map((issue) => ({
          path: issue.path?.join?.(".") || String(issue.path),
          message: issue.message,
          code: issue.code
        }));
        res.status(400).json({
          error: "Invalid workflow data",
          details: errorDetails,
          fullError: error.issues
          // Include full error for debugging
        });
      } else if (error.errors) {
        console.error("\u274C Validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ error: "Invalid workflow data", details: error.errors });
      } else {
        console.error("\u274C Unknown error type:", typeof error, error);
        res.status(400).json({
          error: "Invalid workflow data",
          message: error.message || String(error),
          errorType: error.constructor?.name
        });
      }
    }
  });
  app2.patch("/api/workflows/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/workflows/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/workflows/:id/run", isAuthenticated, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) return res.status(404).json({ error: "Workflow not found" });
      if (workflow.userId !== getUserId(req)) return res.status(404).json({ error: "Workflow not found" });
      const run = await executeWorkflow(workflow, getUserId(req));
      res.json(run);
    } catch (error) {
      console.error("Workflow execution error:", error);
      res.status(500).json({ error: "Failed to execute workflow", message: error.message });
    }
  });
  app2.get("/api/workflows/:id/runs", isAuthenticated, async (req, res) => {
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
  app2.get("/api/workflows/:id/stats", isAuthenticated, async (req, res) => {
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
  app2.get("/api/temp-files/:fileId", async (req, res) => {
    try {
      const file = getTemporaryFile(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Disposition", `inline; filename="temp.txt"`);
      res.send(file.buffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to serve file" });
    }
  });
  app2.post("/api/documents/analyze", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const file = req.file;
      console.log("\u{1F4C4} Document upload:", {
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });
      const result = await analyzeDocument(file.buffer, file.originalname, file.mimetype);
      if (result.error) {
        return res.status(503).json({
          error: "Document analysis failed",
          message: result.error,
          fallbackResponse: result.error
        });
      }
      let suggestions = null;
      if (result.extractedData) {
        try {
          console.log("\u{1F916} Generating suggested actions...");
          suggestions = await generateSuggestedActions(result.extractedData, result.summary);
          console.log("\u2705 Suggested actions generated");
        } catch (suggestionError) {
          console.error("\u274C Failed to generate suggestions:", suggestionError);
        }
      }
      const userId = getUserId(req);
      let assetId;
      try {
        const sanitizedExtractedData = prepareDataForStorage(result.extractedData, 3e3);
        const sanitizedOcrText = result.ocrText ? prepareDataForStorage({ ocrText: result.ocrText }, 3e3).ocrText : void 0;
        const asset = await storage.createAsset({
          userId,
          type: "document",
          name: file.originalname,
          url: `data:${file.mimetype};base64,${file.buffer.toString("base64").substring(0, 100)}`,
          // Truncated for storage
          metadata: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            extractedFields: result.fields || [],
            extractedData: sanitizedExtractedData,
            ocrText: sanitizedOcrText,
            ocrConfidence: result.ocrConfidence,
            suggestions: suggestions || null,
            analysisDate: (/* @__PURE__ */ new Date()).toISOString()
          }
        });
        assetId = asset.id;
        console.log("\u2705 Document asset saved successfully:", asset.id);
      } catch (assetError) {
        console.error("\u274C Failed to save document asset:", assetError);
      }
      const response = {
        fields: result.fields || [],
        extractedData: result.extractedData,
        summary: result.summary || "",
        suggestions: suggestions || null,
        assetId,
        ocrText: result.ocrText,
        ocrConfidence: result.ocrConfidence
      };
      if ((!result.fields || result.fields.length === 0) && !result.error) {
        response.message = "No structured data extracted. This may be because:\n\u2022 Document is image-only and OCR failed (try a clearer scan)\n\u2022 Document format is not fully supported\n\u2022 Document is encrypted or corrupted\n\nYou can still view the extracted text in the OCR preview.";
        response.warning = true;
      }
      if (suggestions?.summary?.summary && (suggestions.summary.summary.includes("plan") || suggestions.summary.summary.includes("quota"))) {
        response.bytezWarning = "Premium summarization unavailable (model quota). Using fallback summary.";
      }
      res.json(response);
    } catch (error) {
      console.error("Document analysis error:", error);
      res.status(500).json({
        error: "Failed to analyze document",
        details: error.message,
        fallbackResponse: "Document analysis failed. Please try again or check your API configuration."
      });
    }
  });
  app2.post("/api/documents/:assetId/autofill", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const { formSchema } = req.body;
      const userId = getUserId(req);
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== userId) {
        return res.status(404).json({ error: "Document not found" });
      }
      const extractedData = asset.metadata?.extractedData || {};
      if (!openai3) {
        return res.status(503).json({
          error: "OpenAI not configured",
          message: "Form autofill requires OpenAI API key"
        });
      }
      const suggestions = await generateSuggestedActions(extractedData);
      await storage.createDocumentActionLog({
        assetId,
        userId,
        actionType: "autofill",
        status: "success",
        dataUsed: { extractedData, formSchema },
        result: suggestions.autofill,
        confidenceScore: Math.round((suggestions.autofill.confidence || 0) * 100)
      });
      res.json({
        formMapping: suggestions.autofill.form_mapping,
        confidence: suggestions.autofill.confidence,
        missingFields: suggestions.autofill.missing_fields
      });
    } catch (error) {
      console.error("Autofill error:", error);
      res.status(500).json({ error: "Failed to generate autofill mapping", details: error.message });
    }
  });
  app2.get("/api/documents/:assetId/logs", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const userId = getUserId(req);
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== userId) {
        return res.status(404).json({ error: "Document not found" });
      }
      const logs = await storage.getDocumentActionLogs(assetId, userId);
      res.json({ logs });
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      res.status(500).json({ error: "Failed to fetch action logs", details: error.message });
    }
  });
  app2.post("/api/documents/:assetId/actions", isAuthenticated, async (req, res) => {
    try {
      const { assetId } = req.params;
      const { actionType, actionData } = req.body;
      const userId = getUserId(req);
      const asset = await storage.getAsset(assetId);
      if (!asset || asset.userId !== userId) {
        return res.status(404).json({ error: "Document not found" });
      }
      const extractedData = asset.metadata?.extractedData || {};
      let result = {};
      let status = "success";
      try {
        if (actionType === "email") {
          const suggestions = await generateSuggestedActions(extractedData);
          result = suggestions.email;
        } else if (actionType === "task") {
          const suggestions = await generateSuggestedActions(extractedData);
          result = suggestions.tasks;
        } else if (actionType === "summary") {
          const suggestions = await generateSuggestedActions(extractedData);
          result = suggestions.summary;
        }
        await storage.createDocumentActionLog({
          assetId,
          userId,
          actionType,
          status,
          dataUsed: { extractedData, actionData },
          result
        });
      } catch (actionError) {
        status = "failed";
        await storage.createDocumentActionLog({
          assetId,
          userId,
          actionType,
          status: "failed",
          dataUsed: { extractedData, actionData },
          errorMessage: actionError.message
        });
        throw actionError;
      }
      res.json({ result, status });
    } catch (error) {
      console.error("Action execution error:", error);
      res.status(500).json({ error: "Failed to execute action", details: error.message });
    }
  });
  app2.post("/api/voice/generate", isAuthenticated, async (req, res) => {
    try {
      const { text: text2, voiceId, speed, pitch, sampleRate, format, projectId } = req.body;
      if (!text2 || !text2.trim()) {
        return res.status(400).json({ error: "Text is required" });
      }
      console.log("\u{1F3A4} Voice Generation: Starting with text:", text2.substring(0, 50));
      const result = await generateSpeechWithMurf({
        text: text2.trim(),
        voiceId,
        speed,
        pitch,
        sampleRate,
        format
      });
      if (result.error) {
        return res.status(503).json({
          error: "Voice generation failed",
          message: result.error,
          fallbackResponse: "Voice generation is currently unavailable. Please check your API configuration."
        });
      }
      const userId = getUserId(req);
      if (result.audioUrl) {
        try {
          await storage.createAsset({
            userId,
            type: "voice",
            name: text2.slice(0, 50),
            url: result.audioUrl,
            projectId: projectId || null,
            metadata: {
              text: text2,
              voiceId: voiceId || "default",
              speed,
              pitch,
              provider: "murf"
            }
          });
        } catch (assetError) {
          console.error("Failed to save audio asset:", assetError);
        }
      }
      res.json({
        audioUrl: result.audioUrl,
        provider: "murf"
      });
    } catch (error) {
      console.error("Voice generation error:", error);
      res.status(500).json({
        error: "Failed to generate voice",
        details: error.message,
        fallbackResponse: "Voice generation failed. Please try again or check your API configuration."
      });
    }
  });
  app2.get("/api/voice/voices", isAuthenticated, async (req, res) => {
    try {
      console.log("\u{1F4DE} /api/voice/voices endpoint called");
      const result = await getMurfVoices();
      console.log("\u{1F4DE} getMurfVoices result:", JSON.stringify({
        hasVoices: !!result.voices,
        voicesCount: result.voices?.length || 0,
        hasError: !!result.error,
        error: result.error
      }, null, 2));
      if (result.error) {
        console.error("\u274C Error fetching voices:", result.error);
        return res.status(503).json({
          error: "Failed to fetch voices",
          message: result.error
        });
      }
      const response = {
        voices: result.voices || [],
        provider: "murf"
      };
      console.log("\u{1F4DE} Sending response with", response.voices.length, "voices");
      console.log("\u{1F4DE} First voice sample:", response.voices.length > 0 ? JSON.stringify(response.voices[0], null, 2) : "none");
      res.json(response);
    } catch (error) {
      console.error("\u274C Failed to fetch voices:", error);
      console.error("\u274C Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to fetch voices",
        details: error.message
      });
    }
  });
  app2.get("/api/voice-models", isAuthenticated, async (req, res) => {
    try {
      const models = await storage.getVoiceModels(getUserId(req));
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch voice models" });
    }
  });
  app2.post("/api/voice-models", isAuthenticated, async (req, res) => {
    try {
      const data = insertVoiceModelSchema.parse({ ...req.body, userId: getUserId(req) });
      const model = await storage.createVoiceModel(data);
      res.status(201).json(model);
    } catch (error) {
      res.status(400).json({ error: "Invalid voice model data" });
    }
  });
  app2.delete("/api/voice-models/:id", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { firstName, lastName, preferences } = req.body;
      const user = await storage.upsertUser({
        id: getUserId(req),
        firstName,
        lastName,
        preferences
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong" }));
            break;
          case "subscribe":
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
var openai3, upload;
var init_routes = __esm({
  "server/routes.ts"() {
    "use strict";
    init_storage();
    init_firebaseAuth();
    init_bytezService();
    init_documentService();
    init_reasonerService();
    init_murfService();
    init_geminiService();
    init_sambanovaService();
    init_workflowService();
    init_storageHelper();
    init_sanitize();
    init_schema();
    openai3 = null;
    if (process.env.OPENAI_API_KEY) {
      openai3 = new OpenAI3({ apiKey: process.env.OPENAI_API_KEY });
    }
    upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024
        // 10MB limit
      }
    });
  }
});

// api/index.source.ts
import express from "express";
import { createServer } from "http";
var app = express();
var registerRoutes2 = null;
async function loadRoutes() {
  if (!registerRoutes2) {
    try {
      const routesModule = await Promise.resolve().then(() => (init_routes(), routes_exports));
      registerRoutes2 = routesModule.registerRoutes;
    } catch (error) {
      console.error("\u274C Failed to import routes:", error);
      console.error("\u274C Routes import error stack:", error?.stack);
      throw new Error(`Failed to load routes module: ${error.message}`);
    }
  }
  return registerRoutes2;
}
if (app && app.get) {
  app.get("/api/test", (req, res) => {
    try {
      res.json({
        status: "ok",
        message: "API function is working",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasSessionSecret: !!process.env.SESSION_SECRET,
          nodeEnv: "production",
          vercel: !!process.env.VERCEL
        }
      });
    } catch (error) {
      console.error("Test endpoint error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Test endpoint failed", message: error.message });
      }
    }
  });
}
if (app && typeof app.use === "function") {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app.use(express.urlencoded({ extended: false }));
}
if (app && typeof app.use === "function") {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
if (app && typeof app.use === "function") {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
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
var initialized = false;
var initPromise = null;
async function initialize() {
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      console.log("\u{1F504} Initializing routes...");
      console.log("\u{1F4CB} Environment check:", {
        NODE_ENV: "production",
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        vercelEnv: process.env.VERCEL ? "yes" : "no"
      });
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is required but not set");
      }
      const routesFn = await loadRoutes();
      const httpServer = createServer(app);
      await routesFn(httpServer, app);
      app.use((err, _req, res, _next) => {
        console.error("Express error:", err);
        if (!res.headersSent) {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          res.status(status).json({
            message,
            ...false
          });
        }
      });
      initialized = true;
      console.log("\u2705 Routes initialized successfully");
    } catch (error) {
      console.error("\u274C Failed to initialize routes:", error);
      console.error("\u274C Error stack:", error?.stack);
      throw error;
    }
  })();
  return initPromise;
}
async function handler(req, res) {
  console.log("\u{1F4E5} Handler called:", req.method, req.url);
  try {
    if (!app) {
      console.error("\u274C Express app not initialized");
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Server Initialization Error",
          message: "Failed to initialize Express application"
        });
      }
      return;
    }
    if (!process.env.DATABASE_URL) {
      console.error("\u274C DATABASE_URL is not set");
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Server Configuration Error",
          message: "DATABASE_URL environment variable is not set. Please configure it in Vercel project settings.",
          hint: "Go to Vercel Dashboard \u2192 Settings \u2192 Environment Variables \u2192 Add DATABASE_URL"
        });
      }
      return;
    }
    await initialize();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        res.removeListener("finish", onFinish);
        res.removeListener("close", onClose);
        resolve();
      };
      const onFinish = () => cleanup();
      const onClose = () => cleanup();
      res.once("finish", onFinish);
      res.once("close", onClose);
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          res.status(504).json({
            error: "Request Timeout",
            message: "The request took too long to process"
          });
        }
        cleanup();
      }, 25e3);
      app(req, res, (err) => {
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
  } catch (error) {
    console.error("Handler error:", error);
    console.error("Handler error stack:", error?.stack);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    if (!res.headersSent) {
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
          ...false
        });
      }
    }
    return;
  }
}
export {
  handler as default
};
/*! Bundled license information:

@google/generative-ai/dist/index.mjs:
  (**
   * @license
   * Copyright 2024 Google LLC
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *   http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *)
*/
