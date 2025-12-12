import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute, useRouter } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  FolderOpen,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Star,
  Clock,
  Mic,
  Image,
  Video,
  FileText,
  Share2,
  Trash2,
  Copy,
  Filter,
  Edit,
  Download,
  Play,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: "voice" | "image" | "video" | "document";
  createdAt?: string;
  updatedAt?: string;
  thumbnailUrl?: string | null;
  url?: string | null;
  projectId?: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  assetsCount?: number;
  lastUpdated?: string;
  isStarred?: boolean;
  isPublic?: boolean;
  userId?: string;
  assets?: Asset[];
  createdAt?: string;
  updatedAt?: string;
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  return date.toLocaleDateString();
}

const getAssetIcon = (type: Asset["type"]) => {
  switch (type) {
    case "voice":
      return <Mic className="w-5 h-5 text-cyan-400" />;
    case "image":
      return <Image className="w-5 h-5 text-pink-400" />;
    case "video":
      return <Video className="w-5 h-5 text-amber-400" />;
    case "document":
      return <FileText className="w-5 h-5 text-emerald-400" />;
  }
};

const getAssetColor = (type: Asset["type"]) => {
  switch (type) {
    case "voice":
      return "bg-cyan-500/20";
    case "image":
      return "bg-pink-500/20";
    case "video":
      return "bg-amber-500/20";
    case "document":
      return "bg-emerald-500/20";
  }
};

export default function Projects() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute<{ id?: string }>("/projects/:id");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingPublicProject, setIsLoadingPublicProject] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Check if viewing a public project from URL
  useEffect(() => {
    const projectId = params?.id;
    if (projectId) {
      setIsLoadingPublicProject(true);
      // Fetch project (public projects don't require auth)
      fetch(`${window.location.origin}/api/projects/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then(async (res) => {
          if (res.ok) {
            const project = await res.json();
            if (project && project.id) {
              console.log("✅ Loaded public project:", project.id, project.title);
              setSelectedProject(project);
            } else {
              console.error("❌ Invalid project data:", project);
              setSelectedProject(null);
            }
          } else {
            const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
            console.error("❌ Failed to load project:", res.status, errorData);
            setSelectedProject(null);
            toast({
              title: "Project not found",
              description: errorData.error || "This project may be private or doesn't exist.",
              variant: "destructive",
            });
          }
        })
        .catch((error) => {
          console.error("❌ Failed to load project:", error);
          setSelectedProject(null);
          toast({
            title: "Failed to load project",
            description: "Please check the link and try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingPublicProject(false);
        });
    } else {
      setSelectedProject(null);
      setIsLoadingPublicProject(false);
    }
  }, [params?.id, toast]);

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  // Fetch all assets
  const { data: allAssets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
    enabled: isAuthenticated, // Only fetch if authenticated
  });
  
  // Check if current user owns the selected project (must be after projects query)
  const isProjectOwner = selectedProject && isAuthenticated && projects.some(p => p.id === selectedProject.id);

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      const res = await apiRequest("POST", "/api/projects", {
        title: data.title.trim(),
        description: data.description?.trim() || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreateDialog(false);
      setProjectTitle("");
      setProjectDescription("");
      toast({ title: "Project created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create project", description: error.message, variant: "destructive" });
    },
  });

  // Update project mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowEditDialog(false);
      setProjectTitle("");
      setProjectDescription("");
      toast({ title: "Project updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update project", description: error.message, variant: "destructive" });
    },
  });

  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setSelectedProject(null);
      toast({ title: "Project deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete project", description: error.message, variant: "destructive" });
    },
  });

  // Toggle star mutation
  const starMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, { isStarred });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  // Combine projects with assets
  const projectsWithAssets: Project[] = projects.map((project) => {
    const assets = allAssets.filter((asset: any) => asset.projectId === project.id);
    return {
      ...project,
      assetsCount: assets.length,
      lastUpdated: project.updatedAt ? formatRelativeTime(new Date(project.updatedAt)) : "Never",
      isStarred: (project as any).isStarred || false,
      assets: assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        createdAt: asset.createdAt ? formatRelativeTime(new Date(asset.createdAt)) : "",
        thumbnail: asset.thumbnailUrl || undefined,
        url: asset.url || undefined,
      })),
    };
  });

  // Filter projects by search query
  const filteredProjects = projectsWithAssets.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStar = (id: string, isStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    starMutation.mutate({ id, isStarred: !isStarred });
  };

  const handleCreate = () => {
    if (!projectTitle.trim()) {
      toast({ title: "Project title is required", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title: projectTitle, description: projectDescription });
  };

  const handleEdit = () => {
    if (!selectedProject || !projectTitle.trim()) {
      toast({ title: "Project title is required", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: selectedProject.id,
      data: { title: projectTitle, description: projectDescription },
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setProjectTitle(project.title);
    setProjectDescription(project.description || "");
    setShowEditDialog(true);
  };

  return (
    <AppLayout title="Projects">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Project Workspace</h1>
            <p className="text-muted-foreground">Manage your AI-generated assets</p>
          </div>
          {isAuthenticated ? (
            <Button
              className="gradient-button"
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-new-project"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          ) : (
            <Button
              className="gradient-button"
              onClick={() => setLocation("/signup")}
              data-testid="button-signup-to-create"
            >
              <Plus className="w-4 h-4 mr-2" />
              Sign Up to Create
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-10 glass-input"
              data-testid="input-search-projects"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="glass-input border-white/20"
              data-testid="button-filter"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <div className="flex border border-white/20 rounded-lg overflow-hidden">
              <Button
                size="icon"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {isLoadingPublicProject ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSkeleton className="h-48 w-full max-w-md mb-4" />
              <p className="text-muted-foreground">Loading project...</p>
            </div>
          </div>
        ) : selectedProject ? (
          // Project Detail View
          <div className="space-y-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedProject(null)}
              data-testid="button-back"
            >
              Back to Projects
            </Button>

            <GlassCard>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
                    {selectedProject.isPublic && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/50">
                        Public
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedProject.description || "No description"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="glass-input border-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      const shareUrl = `${window.location.origin}/projects/${selectedProject.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      toast({ title: "Share link copied to clipboard", description: shareUrl });
                    }}
                    data-testid="button-share"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {selectedProject.isPublic ? "Copy Link" : "Share"}
                  </Button>
                  {/* Only show edit/delete buttons if user is authenticated and owns the project */}
                  {isProjectOwner && (
                    <>
                      <Button
                        variant="outline"
                        className="glass-input border-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({
                            id: selectedProject.id,
                            data: { isPublic: !selectedProject.isPublic },
                          });
                        }}
                        data-testid="button-toggle-public"
                      >
                        {selectedProject.isPublic ? "Make Private" : "Make Public"}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="glass-input border-white/20" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(selectedProject);
                        }}
                        data-testid="button-edit-project"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Asset type filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
                {["all", "voice", "image", "video", "document"].map((type) => (
                  <Button
                    key={type}
                    variant={filterType === type || (type === "all" && !filterType) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setFilterType(type === "all" ? null : type)}
                    className="shrink-0"
                    data-testid={`filter-${type}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedProject.assets && selectedProject.assets.length > 0 ? (
                  selectedProject.assets
                    .filter((a) => !filterType || filterType === "all" || a.type === filterType)
                    .map((asset) => (
                    <div
                      key={asset.id}
                      className="relative p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                      data-testid={`asset-${asset.id}`}
                    >
                      {/* Asset Preview/Thumbnail */}
                      <div className={`w-full aspect-square rounded-xl ${getAssetColor(asset.type)} flex items-center justify-center mb-3 relative overflow-hidden`}>
                        {asset.type === "image" && asset.url ? (
                          <img 
                            src={asset.url} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : asset.type === "video" && asset.thumbnailUrl ? (
                          <img 
                            src={asset.thumbnailUrl} 
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getAssetIcon(asset.type)
                        )}
                        
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {asset.type === "voice" && asset.url && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                const audio = new Audio(asset.url!);
                                audio.play();
                                toast({ title: "Playing audio", description: asset.name });
                              }}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Play
                            </Button>
                          )}
                          {asset.type === "video" && asset.url && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(asset.url!, "_blank");
                                toast({ title: "Opening video", description: asset.name });
                              }}
                            >
                              <Video className="w-4 h-4 mr-1" />
                              Watch
                            </Button>
                          )}
                          {asset.url && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement("a");
                                link.href = asset.url!;
                                const extension = asset.type === "voice" ? "mp3" : asset.type === "video" ? "mp4" : asset.type === "image" ? "png" : "pdf";
                                link.download = `${asset.name || `asset-${asset.id}`}.${extension}`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast({ title: "Download started", description: asset.name });
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.createdAt ? formatRelativeTime(new Date(asset.createdAt)) : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <EmptyState
                      type="generic"
                      title="No assets in this project"
                      description="Add assets to this project to see them here"
                    />
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <GlassCard
                key={project.id}
                variant="interactive"
                className="cursor-pointer"
                onClick={() => setSelectedProject(project)}
                data-testid={`project-${project.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => toggleStar(project.id, project.isStarred || false, e)}
                      data-testid={`star-${project.id}`}
                      disabled={starMutation.isPending}
                    >
                      <Star className={`w-4 h-4 ${project.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(project);
                      }}
                      data-testid={`edit-${project.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDelete(project.id, e)}
                      data-testid={`delete-${project.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{project.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description || "No description"}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.assetsCount} assets</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {project.lastUpdated}
                  </span>
                </div>

                {/* Asset type badges */}
                {project.assets && project.assets.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {Array.from(new Set(project.assets.map((a) => a.type))).map((type) => (
                      <div key={type} className={`w-6 h-6 rounded-lg ${getAssetColor(type)} flex items-center justify-center`}>
                        {getAssetIcon(type)}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        ) : (
          // List View
          <GlassCard>
            <div className="divide-y divide-white/10">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0 cursor-pointer hover:bg-white/5 -mx-6 px-6 transition-colors"
                  onClick={() => setSelectedProject(project)}
                  data-testid={`project-list-${project.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">{project.title}</p>
                      <p className="text-sm text-muted-foreground">{project.assetsCount || 0} assets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:block">{project.lastUpdated}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => toggleStar(project.id, e)}
                    >
                      <Star className={`w-4 h-4 ${project.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Create Project Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Organize your AI-generated assets into projects</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g., Marketing Campaign Assets"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe what this project is for"
                  className="glass-input"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Name</label>
                <Input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Project name"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Project description"
                  className="glass-input"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
