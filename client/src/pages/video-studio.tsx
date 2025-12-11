import { useState } from "react";
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

export default function VideoStudio() {
  const [script, setScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [scenes, setScenes] = useState<StoryboardScene[]>([
    { id: "1", description: "Opening scene with logo animation", duration: 3 },
    { id: "2", description: "Main content introduction", duration: 5 },
    { id: "3", description: "Feature showcase", duration: 8 },
    { id: "4", description: "Call to action and outro", duration: 4 },
  ]);

  const handleGenerate = () => {
    if (!script.trim()) return;
    setIsGenerating(true);
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          setGeneratedVideo("generated");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Video Studio</h1>
            <p className="text-muted-foreground">Transform scripts into captivating videos</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {totalDuration}s total
            </Badge>
          </div>
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
                      <div className="text-center">
                        <Video className="w-16 h-16 text-purple-400 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">Video Preview</p>
                      </div>
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
      </div>
    </AppLayout>
  );
}
