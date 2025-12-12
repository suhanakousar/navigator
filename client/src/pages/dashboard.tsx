import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { ModuleGrid } from "@/components/ui/module-card";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedOrb } from "@/components/ui/animated-orb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, ArrowRight, Zap, Clock, BarChart3 } from "lucide-react";
import { LoadingDots } from "@/components/ui/loading-dots";

const modules = [
  "voice-assistant",
  "voice-studio",
  "image-studio",
  "video-studio",
  "projects",
] as const;

const quickActions = [
  { label: "Generate Voice", icon: Zap, href: "/voice-studio" },
  { label: "Create Image", icon: Sparkles, href: "/image-studio" },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const handleModuleClick = (type: string) => {
    const routes: Record<string, string> = {
      "voice-assistant": "/assistant",
      "voice-studio": "/voice-studio",
      "image-studio": "/image-studio",
      "video-studio": "/video-studio",
      "projects": "/projects",
    };
    navigate(routes[type] || "/");
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <GlassCard variant="elevated" className="relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-amber-400 font-medium">Welcome back</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
                {greeting()}, {user?.firstName || "Creator"}
              </h1>
              <p className="text-muted-foreground mb-6">
                Your AI creative journey continues. What would you like to create today?
              </p>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="glass-input border-white/20"
                    onClick={() => navigate(action.href)}
                    data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <action.icon className="w-4 h-4 mr-2 text-purple-400" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Orb */}
            <div className="hidden lg:block">
              <AnimatedOrb size="lg" isActive />
            </div>
          </div>

          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 rounded-2xl" />
        </GlassCard>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 card-hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center pulse-glow">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">-</p>
                <p className="text-xs text-muted-foreground">Generations</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4 card-hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center pulse-glow">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">-</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4 card-hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center pulse-glow">
                <Clock className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">-</p>
                <p className="text-xs text-muted-foreground">Time Saved</p>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-4 card-hover-lift">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center pulse-glow">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">-</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Module Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Start Creating</h2>
              <p className="text-sm text-muted-foreground">Choose a module to begin</p>
            </div>
            <Button variant="ghost" className="text-purple-400" data-testid="button-view-all">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <ModuleGrid
            modules={[...modules]}
            onModuleClick={handleModuleClick}
          />
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Button variant="ghost" className="text-purple-400" data-testid="button-view-history">
              View History
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <GlassCard>
            <EmptyState
              type="generic"
              title="No recent activity"
              description="Your recent activity will appear here"
            />
          </GlassCard>
        </div>
      </div>
    </AppLayout>
  );
}
