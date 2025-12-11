import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
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
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  type: "voice" | "image" | "video" | "document";
  createdAt: string;
  thumbnail?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  assetsCount: number;
  lastUpdated: string;
  isStarred: boolean;
  assets: Asset[];
}

const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Marketing Campaign Q1",
    description: "Assets for Q1 2024 marketing campaign",
    assetsCount: 24,
    lastUpdated: "2 hours ago",
    isStarred: true,
    assets: [
      { id: "a1", name: "Hero Voice", type: "voice", createdAt: "1 hour ago" },
      { id: "a2", name: "Product Shot", type: "image", createdAt: "3 hours ago" },
      { id: "a3", name: "Promo Video", type: "video", createdAt: "1 day ago" },
    ],
  },
  {
    id: "2",
    name: "Product Launch",
    description: "New product announcement materials",
    assetsCount: 12,
    lastUpdated: "1 day ago",
    isStarred: false,
    assets: [
      { id: "a4", name: "Announcement Script", type: "document", createdAt: "1 day ago" },
      { id: "a5", name: "Demo Voice", type: "voice", createdAt: "1 day ago" },
    ],
  },
];

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
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.map(p => 
      p.id === id ? { ...p, isStarred: !p.isStarred } : p
    ));
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
          <Button className="gradient-button" data-testid="button-new-project">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
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
        {projects.length === 0 ? (
          <GlassCard>
            <EmptyState
              type="project"
              title="No projects yet"
              description="Create your first project to organize your assets"
              onAction={() => {}}
              actionLabel="Create Project"
            />
          </GlassCard>
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
                  <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="glass-input border-white/20" data-testid="button-share">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" className="glass-input border-white/20" data-testid="button-settings">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
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
                {selectedProject.assets
                  .filter((a) => !filterType || a.type === filterType)
                  .map((asset) => (
                    <div
                      key={asset.id}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                      data-testid={`asset-${asset.id}`}
                    >
                      <div className={`w-full aspect-square rounded-xl ${getAssetColor(asset.type)} flex items-center justify-center mb-3`}>
                        {getAssetIcon(asset.type)}
                      </div>
                      <p className="font-medium text-sm truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{asset.createdAt}</p>
                    </div>
                  ))}
              </div>
            </GlassCard>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
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
                      onClick={(e) => toggleStar(project.id, e)}
                      data-testid={`star-${project.id}`}
                    >
                      <Star className={`w-4 h-4 ${project.isStarred ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                    <Button size="icon" variant="ghost" data-testid={`more-${project.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold mb-1">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{project.assetsCount} assets</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {project.lastUpdated}
                  </span>
                </div>

                {/* Asset type badges */}
                <div className="flex gap-2 mt-3">
                  {Array.from(new Set(project.assets.map((a) => a.type))).map((type) => (
                    <div key={type} className={`w-6 h-6 rounded-lg ${getAssetColor(type)} flex items-center justify-center`}>
                      {getAssetIcon(type)}
                    </div>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          // List View
          <GlassCard>
            <div className="divide-y divide-white/10">
              {projects.map((project) => (
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
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.assetsCount} assets</p>
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
      </div>
    </AppLayout>
  );
}
