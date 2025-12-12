import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSkeleton, GridSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjectSelector } from "@/components/ui/project-selector";
import { Confetti } from "@/components/ui/confetti";
import { SuccessAnimation } from "@/components/ui/success-animation";
import {
  Sparkles,
  RefreshCw,
  Download,
  Share2,
  ZoomIn,
  Wand2,
  Layers,
  Palette,
  Image as ImageIcon,
  Grid3X3,
  LayoutGrid,
} from "lucide-react";

const stylePresets = [
  { id: "realistic", name: "Realistic" },
  { id: "3d", name: "3D Render" },
  { id: "anime", name: "Anime" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "holographic", name: "Holographic" },
  { id: "fantasy", name: "Fantasy" },
];

const aspectRatios = [
  { id: "1:1", label: "1:1", width: 1024, height: 1024 },
  { id: "16:9", label: "16:9", width: 1792, height: 1024 },
  { id: "9:16", label: "9:16", width: 1024, height: 1792 },
  { id: "4:3", label: "4:3", width: 1024, height: 768 },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  assetId?: string;
  createdAt?: string;
}

export default function ImageStudio() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [creativity, setCreativity] = useState([70]);
  const [quality, setQuality] = useState([80]);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch image history from assets
  const { data: imageHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/assets"],
    retry: false,
    refetchOnWindowFocus: false,
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((asset) => asset.type === "image")
        .map((asset) => ({
          id: asset.id,
          url: asset.url,
          prompt: asset.metadata?.prompt || asset.name,
          assetId: asset.id,
          createdAt: asset.createdAt,
          style: asset.metadata?.style,
          size: asset.metadata?.size,
        }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    },
  });

  const ratioToSize: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x1024",
  };

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; style: string; size: string; projectId?: string | null }) => {
      const response = await apiRequest("POST", "/api/images/generate", {
        ...data,
        projectId: selectedProjectId,
      });
      
      // Handle 503 Service Unavailable (API not configured)
      if (response.status === 503) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Image generation unavailable");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.images && data.images.length > 0) {
        const newImages: GeneratedImage[] = data.images.map((img: any, i: number) => ({
          id: img.assetId || `img-${Date.now()}-${i}`,
          url: img.url,
          prompt: img.revisedPrompt || prompt,
          assetId: img.assetId,
        }));
        setImages(newImages);
        // Invalidate history to refresh
        queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
        setShowConfetti(true);
        setShowSuccess(true);
        setTimeout(() => setShowConfetti(false), 3000);
        toast({
          title: "Image generated ✨",
          description: `Successfully generated ${data.images.length} image(s) using ${data.provider || "Bytez"}. Images saved to history.`,
        });
      } else {
        toast({
          title: "No images generated",
          description: "The generation completed but no images were returned.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate image. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    if (!isAuthenticated) {
      setLocation("/signup");
      return;
    }
    generateMutation.mutate({
      prompt,
      style: selectedStyle,
      size: ratioToSize[selectedRatio] || "1024x1024",
    });
  };

  const isGenerating = generateMutation.isPending;

  // Download image function
  const handleDownload = async (imageUrl: string, prompt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Image downloaded successfully" });
    } catch (error) {
      toast({ title: "Failed to download image", variant: "destructive" });
    }
  };

  // Enhance/Regenerate image
  const handleEnhance = (image: GeneratedImage, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompt(image.prompt);
    setSelectedImage(null);
    setShowImageDialog(false);
    // Scroll to top and generate
    setTimeout(() => {
      handleGenerate();
    }, 100);
  };

  return (
    <AppLayout title="Image Studio">
      <Confetti trigger={showConfetti} />
      <SuccessAnimation show={showSuccess} message="Images Generated!" onComplete={() => setShowSuccess(false)} />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Image Studio</h1>
            <p className="text-muted-foreground">Generate stunning AI images from text</p>
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
              <ImageIcon className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Prompt Input */}
            <GlassCard>
              <h3 className="font-semibold mb-4">Prompt</h3>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="min-h-[120px] glass-input resize-none mb-4"
                data-testid="input-image-prompt"
              />
              
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full gradient-button"
                data-testid="button-generate-image"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Images
                  </>
                )}
              </Button>
            </GlassCard>

            {/* Style Presets */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Style</h3>
                <Palette className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {stylePresets.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      selectedStyle === style.id
                        ? "bg-purple-500/20 border border-purple-500/50"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    data-testid={`style-${style.id}`}
                  >
                    <span className="text-xs font-medium">{style.name}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Aspect Ratio */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Aspect Ratio</h3>
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedRatio === ratio.id
                        ? "bg-purple-500/20 border border-purple-500/50"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                    data-testid={`ratio-${ratio.id}`}
                  >
                    <span className="text-xs">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Advanced Settings */}
            <GlassCard>
              <h3 className="font-semibold mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Creativity</span>
                    <span className="text-muted-foreground">{creativity[0]}%</span>
                  </div>
                  <Slider
                    value={creativity}
                    onValueChange={setCreativity}
                    max={100}
                    step={1}
                    data-testid="slider-creativity"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quality</span>
                    <span className="text-muted-foreground">{quality[0]}%</span>
                  </div>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    max={100}
                    step={1}
                    data-testid="slider-quality"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right Panel - Generated Images */}
          <div className="lg:col-span-2">
            <GlassCard className="min-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Generated Images</h3>
                {images.length > 0 && (
                  <Badge variant="outline">{images.length} images</Badge>
                )}
              </div>

              {isGenerating ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square rounded-xl shimmer bg-white/5" />
                  ))}
                </div>
              ) : images.length === 0 ? (
                <EmptyState
                  type="image"
                  title="No images generated"
                  description="Enter a prompt and click generate to create images"
                  className="py-20"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                      data-testid={`image-${image.id}`}
                    >
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            setSelectedImage(image);
                            setShowImageDialog(true);
                          }}
                          data-testid={`zoom-${image.id}`}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => handleDownload(image.url, image.prompt, e)}
                          data-testid={`download-${image.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => handleEnhance(image, e)}
                          data-testid={`enhance-${image.id}`}
                        >
                          <Wand2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="history">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Image History</h3>
                <Badge variant="outline">{imageHistory.length} images</Badge>
              </div>

              {historyLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <LoadingSkeleton key={i} className="aspect-square rounded-xl" />
                  ))}
                </div>
              ) : imageHistory.length === 0 ? (
                <EmptyState
                  type="image"
                  title="No images in history"
                  description="Generated images will appear here"
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageHistory.map((image) => (
                    <div
                      key={image.id}
                      className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => {
                        setSelectedImage(image);
                        setShowImageDialog(true);
                      }}
                    >
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            setSelectedImage(image);
                            setShowImageDialog(true);
                          }}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => handleDownload(image.url, image.prompt, e)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => handleEnhance(image, e)}
                        >
                          <Wand2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Image Preview Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedImage?.prompt || "Generated Image"}</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="space-y-4">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={(e) => handleDownload(selectedImage.url, selectedImage.prompt, e)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      handleEnhance(selectedImage, e);
                      setShowImageDialog(false);
                    }}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Enhance Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedImage.url);
                      toast({ title: "Image URL copied to clipboard" });
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
