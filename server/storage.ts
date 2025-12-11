import {
  users,
  projects,
  assets,
  conversations,
  messages,
  memories,
  jobs,
  workflows,
  workflowRuns,
  voiceModels,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Asset,
  type InsertAsset,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Memory,
  type InsertMemory,
  type Job,
  type InsertJob,
  type Workflow,
  type InsertWorkflow,
  type WorkflowRun,
  type InsertWorkflowRun,
  type VoiceModel,
  type InsertVoiceModel,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Asset operations
  getAssets(userId: string, projectId?: string): Promise<Asset[]>;
  getAsset(id: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: string): Promise<boolean>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<boolean>;
  
  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Memory operations
  getMemories(userId: string): Promise<Memory[]>;
  getMemory(id: string): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  deleteMemory(id: string): Promise<boolean>;
  clearMemories(userId: string): Promise<boolean>;
  
  // Job operations
  getJobs(userId: string): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<Job>): Promise<Job | undefined>;
  
  // Workflow operations
  getWorkflows(userId: string): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Workflow run operations
  getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]>;
  createWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun>;
  updateWorkflowRun(id: string, run: Partial<WorkflowRun>): Promise<WorkflowRun | undefined>;
  
  // Voice model operations
  getVoiceModels(userId: string): Promise<VoiceModel[]>;
  getVoiceModel(id: string): Promise<VoiceModel | undefined>;
  createVoiceModel(model: InsertVoiceModel): Promise<VoiceModel>;
  deleteVoiceModel(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Asset operations
  async getAssets(userId: string, projectId?: string): Promise<Asset[]> {
    if (projectId) {
      return db.select().from(assets).where(and(eq(assets.userId, userId), eq(assets.projectId, projectId))).orderBy(desc(assets.createdAt));
    }
    return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [created] = await db.insert(assets).values(asset).returning();
    return created;
  }

  async updateAsset(id: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.id, id)).returning();
    return result.length > 0;
  }

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db.insert(conversations).values(conversation).returning();
    return created;
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    return result.length > 0;
  }

  // Message operations
  async getMessages(conversationId: string): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    // Update conversation timestamp
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, message.conversationId));
    return created;
  }

  // Memory operations
  async getMemories(userId: string): Promise<Memory[]> {
    return db.select().from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.createdAt));
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    const [memory] = await db.select().from(memories).where(eq(memories.id, id));
    return memory;
  }

  async createMemory(memory: InsertMemory): Promise<Memory> {
    const [created] = await db.insert(memories).values(memory).returning();
    return created;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const result = await db.delete(memories).where(eq(memories.id, id)).returning();
    return result.length > 0;
  }

  async clearMemories(userId: string): Promise<boolean> {
    const result = await db.delete(memories).where(eq(memories.userId, userId)).returning();
    return result.length > 0;
  }

  // Job operations
  async getJobs(userId: string): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
  }

  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [created] = await db.insert(jobs).values(job).returning();
    return created;
  }

  async updateJob(id: string, job: Partial<Job>): Promise<Job | undefined> {
    const [updated] = await db.update(jobs).set(job).where(eq(jobs.id, id)).returning();
    return updated;
  }

  // Workflow operations
  async getWorkflows(userId: string): Promise<Workflow[]> {
    return db.select().from(workflows).where(eq(workflows.userId, userId)).orderBy(desc(workflows.updatedAt));
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [created] = await db.insert(workflows).values(workflow).returning();
    return created;
  }

  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const [updated] = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return updated;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const result = await db.delete(workflows).where(eq(workflows.id, id)).returning();
    return result.length > 0;
  }

  // Workflow run operations
  async getWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
    return db.select().from(workflowRuns).where(eq(workflowRuns.workflowId, workflowId)).orderBy(desc(workflowRuns.createdAt));
  }

  async createWorkflowRun(run: InsertWorkflowRun): Promise<WorkflowRun> {
    const [created] = await db.insert(workflowRuns).values(run).returning();
    return created;
  }

  async updateWorkflowRun(id: string, run: Partial<WorkflowRun>): Promise<WorkflowRun | undefined> {
    const [updated] = await db.update(workflowRuns).set(run).where(eq(workflowRuns.id, id)).returning();
    return updated;
  }

  // Voice model operations
  async getVoiceModels(userId: string): Promise<VoiceModel[]> {
    return db.select().from(voiceModels).where(eq(voiceModels.userId, userId)).orderBy(desc(voiceModels.createdAt));
  }

  async getVoiceModel(id: string): Promise<VoiceModel | undefined> {
    const [model] = await db.select().from(voiceModels).where(eq(voiceModels.id, id));
    return model;
  }

  async createVoiceModel(model: InsertVoiceModel): Promise<VoiceModel> {
    const [created] = await db.insert(voiceModels).values(model).returning();
    return created;
  }

  async deleteVoiceModel(id: string): Promise<boolean> {
    const result = await db.delete(voiceModels).where(eq(voiceModels.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
