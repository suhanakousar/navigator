import { cn } from "@/lib/utils";
import { GlassCard } from "./glass-card";
import {
  Mic,
  Image,
  Video,
  FileText,
  Workflow,
  FolderOpen,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

type ModuleType =
  | "voice-assistant"
  | "voice-studio"
  | "image-studio"
  | "video-studio"
  | "document-analyzer"
  | "automation"
  | "projects"
  | "settings";

interface ModuleCardProps {
  type: ModuleType;
  title?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  badge?: string;
  isNew?: boolean;
}

const moduleConfig: Record<
  ModuleType,
  {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient: string;
    iconColor: string;
  }
> = {
  "voice-assistant": {
    icon: MessageSquare,
    title: "Smart Voice Assistant",
    description: "Chat with AI using voice or text",
    gradient: "from-purple-500/20 via-fuchsia-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
  "voice-studio": {
    icon: Mic,
    title: "Voice Studio",
    description: "Create and edit AI voices",
    gradient: "from-cyan-500/20 via-blue-500/20 to-indigo-500/20",
    iconColor: "text-cyan-400",
  },
  "image-studio": {
    icon: Image,
    title: "Image Studio",
    description: "Generate stunning AI images",
    gradient: "from-pink-500/20 via-rose-500/20 to-orange-500/20",
    iconColor: "text-pink-400",
  },
  "video-studio": {
    icon: Video,
    title: "Video Studio",
    description: "Create videos from scripts",
    gradient: "from-amber-500/20 via-yellow-500/20 to-lime-500/20",
    iconColor: "text-amber-400",
  },
  "document-analyzer": {
    icon: FileText,
    title: "Document Analyzer",
    description: "Extract insights from documents",
    gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
    iconColor: "text-emerald-400",
  },
  automation: {
    icon: Workflow,
    title: "Automation Hub",
    description: "Build powerful workflows",
    gradient: "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
    iconColor: "text-violet-400",
  },
  projects: {
    icon: FolderOpen,
    title: "Project Workspace",
    description: "Manage your AI assets",
    gradient: "from-blue-500/20 via-indigo-500/20 to-violet-500/20",
    iconColor: "text-blue-400",
  },
  settings: {
    icon: Settings,
    title: "Settings",
    description: "Configure your preferences",
    gradient: "from-slate-500/20 via-gray-500/20 to-zinc-500/20",
    iconColor: "text-slate-400",
  },
};

export function ModuleCard({
  type,
  title,
  description,
  onClick,
  className,
  badge,
  isNew,
}: ModuleCardProps) {
  const config = moduleConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <GlassCard
      variant="interactive"
      className={cn(
        "group relative overflow-visible cursor-pointer",
        "transform transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        className
      )}
      onClick={onClick}
      data-testid={`module-card-${type}`}
    >
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          `bg-gradient-to-br ${config.gradient}`
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {/* Icon container */}
          <div
            className={cn(
              "p-3 rounded-xl bg-white/5 border border-white/10",
              "group-hover:bg-white/10 transition-colors duration-300"
            )}
          >
            <Icon className={cn("w-6 h-6", config.iconColor)} strokeWidth={1.5} />
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                New
              </span>
            )}
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {badge}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-white transition-colors">
          {displayTitle}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground group-hover:text-white/70 transition-colors">
          {displayDescription}
        </p>
      </div>

      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20",
          "pointer-events-none"
        )}
      />
    </GlassCard>
  );
}

interface ModuleGridProps {
  modules: ModuleType[];
  onModuleClick?: (type: ModuleType) => void;
  className?: string;
}

export function ModuleGrid({ modules, onModuleClick, className }: ModuleGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
        className
      )}
    >
      {modules.map((type) => (
        <ModuleCard
          key={type}
          type={type}
          onClick={() => onModuleClick?.(type)}
        />
      ))}
    </div>
  );
}
