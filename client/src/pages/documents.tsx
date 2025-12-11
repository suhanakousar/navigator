import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import {
  FileText,
  Upload,
  Eye,
  Code,
  Table,
  Sparkles,
  CheckCircle,
  AlertCircle,
  FileImage,
  FilePlus,
  Trash2,
  Download,
  Wand2,
  ClipboardList,
} from "lucide-react";

interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  isRedacted?: boolean;
}

interface SuggestedAction {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  type: "autofill" | "summary" | "email" | "task";
}

export default function Documents() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedField[] | null>(null);
  const [showRedacted, setShowRedacted] = useState(false);
  const [viewMode, setViewMode] = useState<"json" | "table">("table");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);

    // Simulate analysis
    setTimeout(() => {
      setExtractedData([
        { key: "issuer", value: "ACME Corporation", confidence: 0.98 },
        { key: "account_number", value: "****-****-1234", confidence: 0.95, isRedacted: true },
        { key: "date", value: "2024-01-15", confidence: 0.99 },
        { key: "amount_due", value: "$1,250.00", confidence: 0.97 },
        { key: "due_date", value: "2024-02-15", confidence: 0.96 },
        { key: "line_items", value: "3 items", confidence: 0.92 },
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const suggestedActions: SuggestedAction[] = [
    {
      id: "1",
      title: "Auto-fill Payment Form",
      description: "Use extracted data to fill payment forms",
      icon: ClipboardList,
      type: "autofill",
    },
    {
      id: "2",
      title: "Generate Summary",
      description: "Create a brief summary of this document",
      icon: FileText,
      type: "summary",
    },
    {
      id: "3",
      title: "Draft Response Email",
      description: "Create an email response based on content",
      icon: Sparkles,
      type: "email",
    },
    {
      id: "4",
      title: "Create Task",
      description: "Add payment to your task list",
      icon: CheckCircle,
      type: "task",
    },
  ];

  return (
    <AppLayout title="Document Analyzer">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Document Analyzer</h1>
          <p className="text-muted-foreground">Extract insights and automate actions from documents</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Upload & Preview */}
          <div className="space-y-6">
            {/* Upload Area */}
            <GlassCard
              className={`min-h-[300px] flex items-center justify-center ${
                !uploadedFile ? "border-dashed border-2 border-white/20" : ""
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {!uploadedFile ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-2">Drop your document here</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports PDF, PNG, JPG, DOCX
                  </p>
                  <label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.docx"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      data-testid="input-file-upload"
                    />
                    <Button className="gradient-button" asChild>
                      <span>
                        <FilePlus className="w-4 h-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setUploadedFile(null);
                        setExtractedData(null);
                      }}
                      className="text-red-400"
                      data-testid="button-remove-file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Preview area */}
                  <div className="aspect-[4/3] rounded-xl bg-white/5 flex items-center justify-center">
                    {isAnalyzing ? (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Analyzing document...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Document Preview</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Suggested Actions */}
            {extractedData && (
              <GlassCard>
                <h3 className="font-semibold mb-4">Suggested Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {suggestedActions.map((action) => (
                    <button
                      key={action.id}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                      data-testid={`action-${action.type}`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                          <action.icon className="w-5 h-5 text-purple-400" />
                        </div>
                      </div>
                      <p className="font-medium text-sm">{action.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Panel - Extracted Data */}
          <div className="space-y-6">
            <GlassCard className="min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Extracted Data</h3>
                {extractedData && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Show redacted</span>
                      <Switch
                        checked={showRedacted}
                        onCheckedChange={setShowRedacted}
                        data-testid="switch-redacted"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant={viewMode === "table" ? "secondary" : "ghost"}
                        onClick={() => setViewMode("table")}
                        data-testid="button-view-table"
                      >
                        <Table className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={viewMode === "json" ? "secondary" : "ghost"}
                        onClick={() => setViewMode("json")}
                        data-testid="button-view-json"
                      >
                        <Code className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {isAnalyzing ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <LoadingSkeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : !extractedData ? (
                <EmptyState
                  type="document"
                  title="No data extracted"
                  description="Upload a document to extract structured data"
                  className="py-20"
                />
              ) : viewMode === "table" ? (
                <div className="space-y-2">
                  {extractedData.map((field) => (
                    <div
                      key={field.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground capitalize">
                          {field.key.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {field.isRedacted && !showRedacted ? "••••••••" : field.value}
                        </span>
                        <Badge
                          variant={field.confidence > 0.95 ? "default" : "outline"}
                          className={field.confidence > 0.95 ? "bg-emerald-500/20 text-emerald-400" : ""}
                        >
                          {Math.round(field.confidence * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="p-4 rounded-xl bg-black/30 text-sm overflow-auto max-h-[400px] font-mono">
                  {JSON.stringify(
                    extractedData.reduce((acc, field) => ({
                      ...acc,
                      [field.key]: field.isRedacted && !showRedacted ? "[REDACTED]" : field.value,
                    }), {}),
                    null,
                    2
                  )}
                </pre>
              )}

              {extractedData && (
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1 glass-input border-white/20" data-testid="button-export">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button className="flex-1 gradient-button" data-testid="button-use-data">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Use Data
                  </Button>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
