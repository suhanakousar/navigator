import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Settings,
  Trash2,
  Copy,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Globe,
  FileText,
  Calendar,
  Zap,
  ArrowRight,
} from "lucide-react";

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  lastRun?: string;
  runsCount: number;
  status: "success" | "failed" | "idle";
}

interface ActionModule {
  id: string;
  name: string;
  icon: typeof Mail;
  category: string;
  color: string;
}

const actionModules: ActionModule[] = [
  { id: "email", name: "Send Email", icon: Mail, category: "Communication", color: "bg-blue-500/20 text-blue-400" },
  { id: "scrape", name: "Web Scrape", icon: Globe, category: "Data", color: "bg-emerald-500/20 text-emerald-400" },
  { id: "autofill", name: "Form Autofill", icon: FileText, category: "Automation", color: "bg-purple-500/20 text-purple-400" },
  { id: "schedule", name: "Schedule", icon: Calendar, category: "Time", color: "bg-amber-500/20 text-amber-400" },
  { id: "api", name: "API Request", icon: Zap, category: "Integration", color: "bg-pink-500/20 text-pink-400" },
];

const sampleWorkflows: WorkflowItem[] = [
  {
    id: "1",
    name: "Daily Report Generator",
    description: "Generates and sends daily activity reports",
    isActive: true,
    lastRun: "2 hours ago",
    runsCount: 45,
    status: "success",
  },
  {
    id: "2",
    name: "Invoice Processor",
    description: "Extracts data from invoices and updates database",
    isActive: true,
    lastRun: "5 hours ago",
    runsCount: 128,
    status: "success",
  },
  {
    id: "3",
    name: "Lead Capture",
    description: "Scrapes leads from websites and adds to CRM",
    isActive: false,
    lastRun: "3 days ago",
    runsCount: 12,
    status: "failed",
  },
];

export default function Automations() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(sampleWorkflows);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);

  const toggleWorkflow = (id: string) => {
    setWorkflows(workflows.map(w => 
      w.id === id ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const getStatusIcon = (status: WorkflowItem["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout title="Automation Hub">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Automation Hub</h1>
            <p className="text-muted-foreground">Build and manage AI-powered workflows</p>
          </div>
          <Button className="gradient-button" data-testid="button-create-workflow">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </div>

        <Tabs defaultValue="workflows" className="space-y-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="workflows" data-testid="tab-workflows">
              <Workflow className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="modules" data-testid="tab-modules">
              <Zap className="w-4 h-4 mr-2" />
              Action Modules
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <FileText className="w-4 h-4 mr-2" />
              Run History
            </TabsTrigger>
          </TabsList>

          {/* Workflows Tab */}
          <TabsContent value="workflows">
            {workflows.length === 0 ? (
              <GlassCard>
                <EmptyState
                  type="automation"
                  title="No workflows yet"
                  description="Create your first automation to get started"
                  onAction={() => {}}
                  actionLabel="Create Workflow"
                />
              </GlassCard>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.map((workflow) => (
                  <GlassCard
                    key={workflow.id}
                    variant="interactive"
                    className="group"
                    onClick={() => setSelectedWorkflow(workflow)}
                    data-testid={`workflow-${workflow.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Workflow className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(workflow.status)}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWorkflow(workflow.id);
                          }}
                          data-testid={`toggle-${workflow.id}`}
                        >
                          {workflow.isActive ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-1">{workflow.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{workflow.description}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{workflow.runsCount} runs</span>
                      {workflow.lastRun && <span>Last: {workflow.lastRun}</span>}
                    </div>

                    <Badge
                      className={`mt-3 ${workflow.isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10"}`}
                    >
                      {workflow.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </GlassCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Action Modules Tab */}
          <TabsContent value="modules">
            <GlassCard>
              <h3 className="font-semibold mb-6">Available Actions</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {actionModules.map((module) => (
                  <div
                    key={module.id}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    data-testid={`module-${module.id}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl ${module.color} flex items-center justify-center`}>
                        <module.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{module.name}</p>
                        <p className="text-xs text-muted-foreground">{module.category}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual Workflow Builder Preview */}
              <div className="mt-8">
                <h3 className="font-semibold mb-4">Workflow Builder</h3>
                <div className="p-8 rounded-xl bg-white/5 border border-dashed border-white/20">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-emerald-500/20 flex flex-col items-center justify-center">
                      <Zap className="w-6 h-6 text-emerald-400 mb-1" />
                      <span className="text-xs">Trigger</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    <div className="w-24 h-24 rounded-2xl bg-blue-500/20 flex flex-col items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-400 mb-1" />
                      <span className="text-xs">Action</span>
                    </div>
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    <div className="w-24 h-24 rounded-2xl bg-purple-500/20 flex flex-col items-center justify-center border-2 border-dashed border-purple-500/50">
                      <Plus className="w-6 h-6 text-purple-400 mb-1" />
                      <span className="text-xs">Add Step</span>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Drag and drop actions to build your workflow
                  </p>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <GlassCard>
              <h3 className="font-semibold mb-4">Run History</h3>
              <div className="space-y-3">
                {[
                  { workflow: "Daily Report Generator", status: "success", time: "2 hours ago", duration: "12s" },
                  { workflow: "Invoice Processor", status: "success", time: "5 hours ago", duration: "45s" },
                  { workflow: "Lead Capture", status: "failed", time: "3 days ago", duration: "8s", error: "Connection timeout" },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    data-testid={`log-${i}`}
                  >
                    <div className="flex items-center gap-3">
                      {log.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium">{log.workflow}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.error || `Completed in ${log.duration}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
