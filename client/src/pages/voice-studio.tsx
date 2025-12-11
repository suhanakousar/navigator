import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioWaveform, Waveform } from "@/components/ui/waveform";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Upload,
  Play,
  Pause,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  Volume2,
  Music,
  Settings2,
} from "lucide-react";

const presetVoices = [
  { id: "1", name: "AI Assistant", type: "Neutral", isPreset: true },
  { id: "2", name: "Narrator Pro", type: "Deep", isPreset: true },
  { id: "3", name: "Friendly Guide", type: "Warm", isPreset: true },
  { id: "4", name: "Cinematic Voice", type: "Dramatic", isPreset: true },
];

const emotionSliders = [
  { id: "joy", label: "Joy", color: "from-yellow-400 to-orange-400" },
  { id: "calm", label: "Calm", color: "from-cyan-400 to-blue-400" },
  { id: "intensity", label: "Intensity", color: "from-red-400 to-pink-400" },
  { id: "warmth", label: "Warmth", color: "from-amber-400 to-orange-400" },
];

const prosodySliders = [
  { id: "pitch", label: "Pitch", min: -50, max: 50 },
  { id: "speed", label: "Speed", min: 50, max: 200 },
  { id: "clarity", label: "Clarity", min: 0, max: 100 },
];

export default function VoiceStudio() {
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(presetVoices[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [emotions, setEmotions] = useState({
    joy: 50,
    calm: 70,
    intensity: 30,
    warmth: 60,
  });
  const [prosody, setProsody] = useState({
    pitch: 0,
    speed: 100,
    clarity: 80,
  });

  const handleGenerate = () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedAudio("generated");
    }, 2000);
  };

  return (
    <AppLayout title="Voice Studio">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Voice Studio</h1>
            <p className="text-muted-foreground">Create and customize AI voices</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="glass-input border-white/20" data-testid="button-upload-voice">
              <Upload className="w-4 h-4 mr-2" />
              Upload Voice
            </Button>
            <Button variant="outline" className="glass-input border-white/20" data-testid="button-record-voice">
              <Mic className="w-4 h-4 mr-2" />
              Record Voice
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Voice Selection */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard>
              <h3 className="font-semibold mb-4">Voice Models</h3>
              <Tabs defaultValue="presets">
                <TabsList className="w-full bg-white/5 mb-4">
                  <TabsTrigger value="presets" className="flex-1" data-testid="tab-presets">Presets</TabsTrigger>
                  <TabsTrigger value="cloned" className="flex-1" data-testid="tab-cloned">My Voices</TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="space-y-2 mt-0">
                  {presetVoices.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice)}
                      className={`p-3 rounded-xl cursor-pointer transition-all ${
                        selectedVoice.id === voice.id
                          ? "bg-purple-500/20 border border-purple-500/50"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      data-testid={`voice-${voice.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                            <Music className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">{voice.name}</p>
                            <p className="text-xs text-muted-foreground">{voice.type}</p>
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" data-testid={`play-voice-${voice.id}`}>
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="cloned" className="mt-0">
                  <EmptyState
                    type="voice"
                    title="No cloned voices"
                    description="Clone your voice or upload samples"
                    className="py-8"
                  />
                </TabsContent>
              </Tabs>
            </GlassCard>

            {/* Emotion Controls */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Emotion</h3>
                <Settings2 className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="space-y-4">
                {emotionSliders.map((emotion) => (
                  <div key={emotion.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{emotion.label}</span>
                      <span className="text-muted-foreground">
                        {emotions[emotion.id as keyof typeof emotions]}%
                      </span>
                    </div>
                    <div className="relative">
                      <div className={`absolute inset-0 h-2 rounded-full bg-gradient-to-r ${emotion.color} opacity-20`} />
                      <Slider
                        value={[emotions[emotion.id as keyof typeof emotions]]}
                        max={100}
                        step={1}
                        onValueChange={(v) =>
                          setEmotions((prev) => ({ ...prev, [emotion.id]: v[0] }))
                        }
                        className="relative"
                        data-testid={`slider-${emotion.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Center Panel - Text Input & Generation */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Text to Speech</h3>
                <Badge variant="outline" className="text-xs">
                  {selectedVoice.name}
                </Badge>
              </div>

              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="flex-1 min-h-[200px] glass-input resize-none mb-4"
                data-testid="input-tts-text"
              />

              {/* Prosody Controls */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {prosodySliders.map((slider) => (
                  <div key={slider.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{slider.label}</span>
                      <span>{prosody[slider.id as keyof typeof prosody]}</span>
                    </div>
                    <Slider
                      value={[prosody[slider.id as keyof typeof prosody]]}
                      min={slider.min}
                      max={slider.max}
                      step={1}
                      onValueChange={(v) =>
                        setProsody((prev) => ({ ...prev, [slider.id]: v[0] }))
                      }
                      data-testid={`slider-${slider.id}`}
                    />
                  </div>
                ))}
              </div>

              {/* Generated Audio */}
              {generatedAudio && (
                <div className="mb-4">
                  <AudioWaveform
                    isPlaying={isPlaying}
                    currentTime={isPlaying ? 30 : 0}
                    duration={100}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!text.trim() || isGenerating}
                  className="gradient-button flex-1 sm:flex-none"
                  data-testid="button-generate"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Voice
                    </>
                  )}
                </Button>

                {generatedAudio && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="glass-input border-white/20"
                      data-testid="button-play-pause"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 mr-2" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button variant="outline" className="glass-input border-white/20" data-testid="button-download">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" className="glass-input border-white/20" data-testid="button-share">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
