import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const assetTypeEnum = pgEnum('asset_type', ['voice', 'image', 'video', 'document']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets table (voice, image, video, documents)
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: assetTypeEnum("type").notNull(),
  name: varchar("name").notNull(),
  url: varchar("url"),
  thumbnailUrl: varchar("thumbnail_url"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table for chat history
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: varchar("title").default("New Conversation"),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  audioUrl: varchar("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Memories table for SmartMemory
export const memories = pgTable("memories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  key: varchar("key").notNull(),
  value: text("value").notNull(),
  consent: boolean("consent").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Jobs table for background processing
export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(),
  status: jobStatusEnum("status").default("pending"),
  input: jsonb("input").default({}),
  result: jsonb("result"),
  resultUrl: varchar("result_url"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Workflows/Automations table
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").default([]),
  edges: jsonb("edges").default([]),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow runs history
export const workflowRuns = pgTable("workflow_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => workflows.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: jobStatusEnum("status").default("pending"),
  logs: jsonb("logs").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Voice models table
export const voiceModels = pgTable("voice_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  isPreset: boolean("is_preset").default(false),
  voiceId: varchar("voice_id"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertMemorySchema = createInsertSchema(memories).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, completedAt: true });
export const insertWorkflowSchema = createInsertSchema(workflows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkflowRunSchema = createInsertSchema(workflowRuns).omit({ id: true, createdAt: true, completedAt: true });
export const insertVoiceModelSchema = createInsertSchema(voiceModels).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Memory = typeof memories.$inferSelect;
export type InsertMemory = z.infer<typeof insertMemorySchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type InsertWorkflowRun = z.infer<typeof insertWorkflowRunSchema>;

export type VoiceModel = typeof voiceModels.$inferSelect;
export type InsertVoiceModel = z.infer<typeof insertVoiceModelSchema>;
