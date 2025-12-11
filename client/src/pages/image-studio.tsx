import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { LoadingSkeleton, GridSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  { id: "realistic", name: "Realistic", icon: "📷" },
  { id: "3d", name: "3D Render", icon: "🎨" },
  { id: "anime", name: "Anime", icon: "✨" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🌃" },
  { id: "holographic", name: "Holographic", icon: "🔮" },
  { id: "fantasy", name: "Fantasy", icon: "🏰" },
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
}

export default function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [creativity, setCreativity] = useState([70]);
  const [quality, setQuality] = useState([80]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate generation
    setTimeout(() => {
      const newImages: GeneratedImage[] = Array.from({ length: 4 }, (_, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: `https://picsum.photos/seed/${Date.now() + i}/512/512`,
        prompt: prompt,
      }));
      setImages(newImages);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <AppLayout title="Image Studio">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold">Image Studio</h1>
          <p className="text-muted-foreground">Generate stunning AI images from text</p>
        </div>

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
                    <span className="text-xl block mb-1">{style.icon}</span>
                    <span className="text-xs">{style.name}</span>
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
                        <Button size="icon" variant="secondary" data-testid={`zoom-${image.id}`}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" data-testid={`download-${image.id}`}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="secondary" data-testid={`edit-${image.id}`}>
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
      </div>
    </AppLayout>
  );
}
