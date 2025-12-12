import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { ProjectSelector } from "@/components/ui/project-selector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Video,
  Play,
  Pause,
  Sparkles,
  RefreshCw,
  Download,
  Share2,
  Layers,
  Music,
  Type,
  Clock,
  Film,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";

interface StoryboardScene {
  id: string;
  description: string;
  duration: number;
}

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
}

export default function VideoStudio() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [script, setScript] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [selectedHistoryVideo, setSelectedHistoryVideo] = useState<GeneratedVideo | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [scenes, setScenes] = useState<StoryboardScene[]>([
    { id: "1", description: "Opening scene with logo animation", duration: 3 },
    { id: "2", description: "Main content introduction", duration: 5 },
    { id: "3", description: "Feature showcase", duration: 8 },
    { id: "4", description: "Call to action and outro", duration: 4 },
  ]);

  // Fetch video history from assets
  const { data: videoHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/assets"],
    retry: false,
    refetchOnWindowFocus: false,
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((asset) => asset.type === "video")
        .map((asset) => ({
          id: asset.id,
          url: asset.url,
          prompt: asset.metadata?.prompt || asset.name,
          assetId: asset.id,
          createdAt: asset.createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (prompt: string) => {
      try {
        const response = await apiRequest("POST", "/api/videos/generate", {
          prompt,
          projectId: selectedProjectId,
        });
        
        // Clone response for reading body multiple times if needed
        const clonedResponse = response.clone();
        
        // Handle 503 Service Unavailable (API not configured or Bytez failed)
        if (response.status === 503) {
          try {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || errorData.fallbackResponse || "Video generation unavailable";
            throw new Error(errorMessage);
          } catch (jsonError: any) {
            // If JSON parsing fails, try reading as text
            if (jsonError.message?.includes("JSON") || jsonError.message?.includes("DOCTYPE")) {
              try {
                const text = await clonedResponse.text();
                console.error("Server returned non-JSON response:", text.substring(0, 200));
                throw new Error("Video generation service is unavailable. Please check your API configuration and restart the server.");
              } catch {
                throw new Error("Video generation service is unavailable. Please check your API configuration.");
              }
            }
            throw new Error(jsonError.message || "Video generation service is unavailable.");
          }
        }
        
        // Check for other error statuses
        if (!response.ok) {
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
          } catch (jsonError: any) {
            // If JSON parsing fails, try reading as text
            if (jsonError.message?.includes("JSON") || jsonError.message?.includes("DOCTYPE")) {
              try {
                const text = await clonedResponse.text();
                console.error("Server returned non-JSON response:", text.substring(0, 200));
                throw new Error(`Server error (${response.status}): The server returned an error page. Please check the server logs.`);
              } catch {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
              }
            }
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
          }
        }
        
        return response.json();
      } catch (error: any) {
        // If it's already an Error with a message, rethrow it
        if (error instanceof Error) {
          throw error;
        }
        // Handle JSON parse errors
        if (error.message?.includes("JSON") || error.message?.includes("DOCTYPE")) {
          throw new Error("Server returned an invalid response. Please check the server logs and ensure the video generation endpoint is working.");
        }
        // Otherwise, wrap it
        throw new Error(error.message || "Failed to generate video");
      }
    },
    onSuccess: (data) => {
      if (data.videos && data.videos.length > 0) {
        const video = data.videos[0];
        setGeneratedVideo({
          id: video.id,
          url: video.url,
          prompt: video.prompt || script,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
        toast({
          title: "Video generated ✨",
          description: `Successfully generated video using ${data.provider || "Bytez"}. Saved to history.`,
        });
      } else {
        toast({
          title: "No video generated",
          description: "The generation completed but no video was returned.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate video. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleGenerate = () => {
    if (!script.trim()) return;
    if (!isAuthenticated) {
      setLocation("/signup");
      return;
    }
    generateMutation.mutate(script);
  };

  const isGenerating = generateMutation.isPending;
  const progress = isGenerating ? 50 : generatedVideo ? 100 : 0;

  const addScene = () => {
    setScenes([
      ...scenes,
      {
        id: Date.now().toString(),
        description: "New scene",
        duration: 5,
      },
    ]);
  };

  const removeScene = (id: string) => {
    setScenes(scenes.filter((s) => s.id !== id));
  };

  const totalDuration = scenes.reduce((acc, scene) => acc + scene.duration, 0);

  return (
    <AppLayout title="Video Studio">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">Video Studio</h1>
              <p className="text-muted-foreground">Transform scripts into captivating videos</p>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <ProjectSelector
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              placeholder="Select project (optional)"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "generate" | "history")} className="space-y-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="generate">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="history">
              <Video className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {totalDuration}s total
              </Badge>
            </div>

            <Tabs defaultValue="script" className="space-y-6">
          <TabsList className="bg-white/5">
            <TabsTrigger value="script" data-testid="tab-script">
              <Type className="w-4 h-4 mr-2" />
              Script
            </TabsTrigger>
            <TabsTrigger value="storyboard" data-testid="tab-storyboard">
              <Layers className="w-4 h-4 mr-2" />
              Storyboard
            </TabsTrigger>
            <TabsTrigger value="timeline" data-testid="tab-timeline">
              <Film className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Script Tab */}
          <TabsContent value="script">
            <div className="grid lg:grid-cols-2 gap-6">
              <GlassCard className="h-full">
                <h3 className="font-semibold mb-4">Script Editor</h3>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Write your video script here. Each paragraph can become a scene..."
                  className="min-h-[400px] glass-input resize-none mb-4"
                  data-testid="input-video-script"
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={!script.trim() || isGenerating}
                    className="gradient-button flex-1 md:flex-none"
                    data-testid="button-generate-video"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="glass-input border-white/20" data-testid="button-ai-improve">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Improve
                  </Button>
                </div>

                {/* Progress */}
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generating video...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </GlassCard>

              {/* Preview */}
              <GlassCard className="h-full">
                <h3 className="font-semibold mb-4">Preview</h3>
                {generatedVideo ? (
                  <div className="space-y-4">
                    <div className="aspect-video rounded-xl bg-black/50 flex items-center justify-center overflow-hidden">
                      <video
                        src={generatedVideo.url}
                        controls
                        className="w-full h-full object-contain"
                        data-testid="generated-video"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 glass-input border-white/20">
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                      <Button variant="outline" className="flex-1 glass-input border-white/20">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" className="glass-input border-white/20">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    type="video"
                    title="No video yet"
                    description="Write a script and generate to see your video"
                    className="py-20"
                  />
                )}
              </GlassCard>
            </div>
          </TabsContent>

          {/* Storyboard Tab */}
          <TabsContent value="storyboard">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Storyboard Scenes</h3>
                <Button onClick={addScene} variant="outline" className="glass-input border-white/20" data-testid="button-add-scene">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Scene
                </Button>
              </div>

              <div className="space-y-4">
                {scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/5"
                    data-testid={`scene-${scene.id}`}
                  >
                    <div className="cursor-grab text-muted-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={scene.description}
                        onChange={(e) => {
                          setScenes(
                            scenes.map((s) =>
                              s.id === scene.id ? { ...s, description: e.target.value } : s
                            )
                          );
                        }}
                        className="glass-input"
                        placeholder="Scene description..."
                      />
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{scene.duration}s</span>
                        </div>
                        <Slider
                          value={[scene.duration]}
                          onValueChange={(v) => {
                            setScenes(
                              scenes.map((s) =>
                                s.id === scene.id ? { ...s, duration: v[0] } : s
                              )
                            );
                          }}
                          min={1}
                          max={30}
                          className="w-32"
                        />
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeScene(scene.id)}
                      className="text-red-400 shrink-0"
                      data-testid={`delete-scene-${scene.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Timeline Editor</h3>
                <Badge variant="outline">{totalDuration} seconds</Badge>
              </div>

              {/* Timeline tracks */}
              <div className="space-y-4">
                {/* Video track */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Video className="w-4 h-4" />
                    <span>Video</span>
                  </div>
                  <div className="h-16 rounded-xl bg-white/5 flex overflow-hidden">
                    {scenes.map((scene, i) => (
                      <div
                        key={scene.id}
                        className="h-full flex items-center justify-center border-r border-white/10 last:border-0"
                        style={{
                          width: `${(scene.duration / totalDuration) * 100}%`,
                          background: `linear-gradient(135deg, hsl(${280 + i * 20}, 70%, 50%, 0.3), hsl(${200 + i * 20}, 70%, 50%, 0.3))`,
                        }}
                      >
                        <span className="text-xs truncate px-2">Scene {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio track */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Music className="w-4 h-4" />
                    <span>Voiceover</span>
                  </div>
                  <div className="h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Drag audio here</span>
                  </div>
                </div>

                {/* Music track */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Music className="w-4 h-4" />
                    <span>Background Music</span>
                  </div>
                  <div className="h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Drag music here</span>
                  </div>
                </div>
              </div>

              {/* Timeline ruler */}
              <div className="mt-4 h-6 flex items-end text-xs text-muted-foreground">
                {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-l border-white/20 pl-1"
                  >
                    {i * 5}s
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="history">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Video History</h3>
                <Badge variant="outline">{videoHistory.length} videos</Badge>
              </div>

              {historyLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : videoHistory.length === 0 ? (
                <EmptyState
                  type="generic"
                  title="No video history"
                  description="Generated videos will appear here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoHistory.map((video) => (
                    <div
                      key={video.id}
                      className="relative group aspect-video rounded-xl overflow-hidden bg-white/5"
                    >
                      <video
                        src={video.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedHistoryVideo(video);
                            setGeneratedVideo(video);
                            setActiveTab("generate");
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Use
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = video.url;
                            link.download = `video-${video.id}.mp4`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast({ title: "Download started" });
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60">
                        <p className="text-xs text-white truncate">{video.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
