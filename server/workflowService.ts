import { storage } from "./storage";
import type { Workflow, WorkflowRun } from "@shared/schema";

export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition";
  actionType?: string; // "email", "scrape", "autofill", "schedule", "api"
  label: string;
  config?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

/**
 * Execute a workflow by processing its nodes and edges
 */
export async function executeWorkflow(workflow: Workflow, userId: string): Promise<WorkflowRun> {
  const nodes = (workflow.nodes as WorkflowNode[]) || [];
  const edges = (workflow.edges as WorkflowEdge[]) || [];

  // Create workflow run record
  const run = await storage.createWorkflowRun({
    workflowId: workflow.id,
    userId,
    status: "processing",
    logs: [],
  });

  const logs: any[] = [];
  let currentStatus: "pending" | "processing" | "completed" | "failed" = "processing";
  let errorMessage: string | null = null;

  try {
    // Find trigger node (entry point)
    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      throw new Error("No trigger node found in workflow");
    }

    logs.push({
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Starting workflow execution: ${workflow.name}`,
      nodeId: triggerNode.id,
    });

    // Process workflow nodes in order (simple linear execution for now)
    // In a full implementation, this would follow edges and handle conditions
    const processedNodes = new Set<string>();
    const nodeQueue: string[] = [triggerNode.id];

    while (nodeQueue.length > 0) {
      const currentNodeId = nodeQueue.shift()!;
      if (processedNodes.has(currentNodeId)) continue;

      const node = nodes.find((n) => n.id === currentNodeId);
      if (!node) continue;

      processedNodes.add(currentNodeId);

      // Execute node based on type
      if (node.type === "action" && node.actionType) {
        try {
          const result = await executeAction(node.actionType, node.config || {}, userId);
          logs.push({
            timestamp: new Date().toISOString(),
            level: "info",
            message: `Executed action: ${node.label}`,
            nodeId: node.id,
            result,
          });

          // Find next nodes via edges
          const nextEdges = edges.filter((e) => e.source === currentNodeId);
          for (const edge of nextEdges) {
            if (!processedNodes.has(edge.target)) {
              nodeQueue.push(edge.target);
            }
          }
        } catch (error: any) {
          logs.push({
            timestamp: new Date().toISOString(),
            level: "error",
            message: `Failed to execute action: ${node.label}`,
            nodeId: node.id,
            error: error.message,
          });
          currentStatus = "failed";
          errorMessage = error.message;
          break;
        }
      } else if (node.type === "trigger") {
        // Trigger nodes just pass through
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
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Workflow execution completed successfully",
      });
    }

    // Update workflow run with results
    await storage.updateWorkflowRun(run.id, {
      status: currentStatus,
      logs,
      completedAt: new Date(),
      errorMessage: errorMessage || undefined,
    });

    return (await storage.getWorkflowRun(run.id))!;
  } catch (error: any) {
    currentStatus = "failed";
    errorMessage = error.message;
    logs.push({
      timestamp: new Date().toISOString(),
      level: "error",
      message: `Workflow execution failed: ${error.message}`,
    });

    await storage.updateWorkflowRun(run.id, {
      status: "failed",
      logs,
      completedAt: new Date(),
      errorMessage,
    });

    throw error;
  }
}

/**
 * Execute a specific action type
 */
async function executeAction(
  actionType: string,
  config: Record<string, any>,
  userId: string
): Promise<any> {
  switch (actionType) {
    case "email":
      // Email action - would integrate with email service
      return {
        success: true,
        message: "Email would be sent here",
        to: config.to || "example@email.com",
        subject: config.subject || "Automated Email",
        body: config.body || "",
      };

    case "scrape":
      // Web scraping action
      return {
        success: true,
        message: "Web scraping would happen here",
        url: config.url || "",
        data: [],
      };

    case "autofill":
      // Form autofill action
      return {
        success: true,
        message: "Form would be autofilled here",
        formData: config.formData || {},
      };

    case "schedule":
      // Schedule action - would set up scheduled task
      return {
        success: true,
        message: "Task would be scheduled here",
        schedule: config.schedule || "daily",
      };

    case "api":
      // API request action
      try {
        const response = await fetch(config.url || "", {
          method: config.method || "GET",
          headers: config.headers || {},
          body: config.body ? JSON.stringify(config.body) : undefined,
        });
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data,
        };
      } catch (error: any) {
        throw new Error(`API request failed: ${error.message}`);
      }

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

/**
 * Get workflow run statistics
 */
export async function getWorkflowStats(workflowId: string): Promise<{
  totalRuns: number;
  successCount: number;
  failedCount: number;
  lastRun?: Date;
}> {
  const runs = await storage.getWorkflowRuns(workflowId);
  const successCount = runs.filter((r) => r.status === "completed").length;
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const lastRun = runs.length > 0 ? runs[0].createdAt : undefined;

  return {
    totalRuns: runs.length,
    successCount,
    failedCount,
    lastRun,
  };
}

