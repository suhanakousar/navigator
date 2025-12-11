import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Image,
  Video,
  FileText,
  Workflow,
  FolderOpen,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

type EmptyStateType =
  | "voice"
  | "image"
  | "video"
  | "document"
  | "automation"
  | "project"
  | "chat"
  | "generic";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: LucideIcon;
}

const defaultContent: Record<
  EmptyStateType,
  { icon: LucideIcon; title: string; description: string; actionLabel: string }
> = {
  voice: {
    icon: Mic,
    title: "No voice recordings yet",
    description: "Create your first voice generation or clone your voice to get started",
    actionLabel: "Create Voice",
  },
  image: {
    icon: Image,
    title: "No images created",
    description: "Generate stunning AI images from your imagination",
    actionLabel: "Generate Image",
  },
  video: {
    icon: Video,
    title: "No videos generated",
    description: "Transform your scripts into captivating videos",
    actionLabel: "Create Video",
  },
  document: {
    icon: FileText,
    title: "No documents analyzed",
    description: "Upload documents to extract insights and automate tasks",
    actionLabel: "Upload Document",
  },
  automation: {
    icon: Workflow,
    title: "No automations created",
    description: "Build powerful workflows to automate your daily tasks",
    actionLabel: "Create Automation",
  },
  project: {
    icon: FolderOpen,
    title: "No projects yet",
    description: "Create a project to organize your AI-generated assets",
    actionLabel: "New Project",
  },
  chat: {
    icon: MessageSquare,
    title: "Start a conversation",
    description: "Ask anything or give a command to your AI assistant",
    actionLabel: "Say Hello",
  },
  generic: {
    icon: FolderOpen,
    title: "Nothing here yet",
    description: "Get started by creating your first item",
    actionLabel: "Get Started",
  },
};

export function EmptyState({
  type = "generic",
  title,
  description,
  actionLabel,
  onAction,
  className,
  icon: CustomIcon,
}: EmptyStateProps) {
  const content = defaultContent[type];
  const Icon = CustomIcon || content.icon;
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;
  const displayAction = actionLabel || content.actionLabel;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
      data-testid={`empty-state-${type}`}
    >
      {/* Icon with gradient glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-cyan-500/30 rounded-full blur-2xl scale-150" />
        <div className="relative p-6 rounded-full bg-white/5 border border-white/10">
          <Icon className="w-12 h-12 text-purple-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* Action button */}
      {onAction && (
        <Button
          onClick={onAction}
          className="gradient-button"
          data-testid={`empty-state-action-${type}`}
        >
          {displayAction}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
      data-testid="error-state"
    >
      {/* Error icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl scale-150" />
        <div className="relative p-6 rounded-full bg-red-500/10 border border-red-500/20">
          <svg
            className="w-12 h-12 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

      {onRetry && (
        <Button onClick={onRetry} variant="outline" data-testid="error-retry-button">
          Try Again
        </Button>
      )}
    </div>
  );
}

interface OfflineStateProps {
  className?: string;
}

export function OfflineState({ className }: OfflineStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
      data-testid="offline-state"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl scale-150" />
        <div className="relative p-6 rounded-full bg-yellow-500/10 border border-yellow-500/20">
          <svg
            className="w-12 h-12 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-xl font-semibold text-foreground mb-2">
        You're offline
      </h3>
      <p className="text-muted-foreground max-w-sm">
        Check your internet connection and try again
      </p>
    </div>
  );
}
