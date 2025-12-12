import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/useAuth";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioWaveform, Waveform } from "@/components/ui/waveform";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProjectSelector } from "@/components/ui/project-selector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Confetti } from "@/components/ui/confetti";
import { SuccessAnimation } from "@/components/ui/success-animation";
import {
  Mic,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Share2,
  RefreshCw,
  Volume2,
  Music,
  Settings2,
} from "lucide-react";

// Preset voices - will be replaced by API voices
const defaultPresetVoices = [
  { id: "", name: "Loading voices...", type: "Loading", isPreset: false },
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
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(defaultPresetVoices[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");
  const [selectedHistoryAudio, setSelectedHistoryAudio] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch available voices from API
  const { data: voicesData, isLoading: voicesLoading, error: voicesError } = useQuery({
    queryKey: ["/api/voice/voices"],
    retry: 2,
    refetchOnWindowFocus: false,
    select: (data: any) => {
      console.log("🎤 Voices API response (full):", JSON.stringify(data, null, 2));
      console.log("🎤 Voices API response type:", typeof data);
      console.log("🎤 Voices API response keys:", data ? Object.keys(data) : "null");
      
      if (!data) {
        console.warn("⚠️ No data from voices API");
        return defaultPresetVoices;
      }
      
      // Handle different response formats
      let voices: any[] = [];
      
      // Check if it's already an array
      if (Array.isArray(data)) {
        voices = data;
        console.log("✅ Response is an array with", voices.length, "items");
      } 
      // Check for common property names
      else if (data.voices && Array.isArray(data.voices)) {
        voices = data.voices;
        console.log("✅ Found voices in data.voices:", voices.length);
      } 
      else if (data.data && Array.isArray(data.data)) {
        voices = data.data;
        console.log("✅ Found voices in data.data:", voices.length);
      }
      // Check if the object itself contains voice-like properties
      else if (typeof data === 'object') {
        // Try to find any array property
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            // Check if it looks like a voice array (has objects with id/name properties)
            const firstItem = data[key][0];
            if (firstItem && (firstItem.id || firstItem.voiceId || firstItem.name || firstItem.voiceName)) {
              voices = data[key];
              console.log(`✅ Found voices array in data.${key}:`, voices.length);
              break;
            }
          }
        }
        
        // If still no voices, check if the object itself is a voice (single voice response)
        if (voices.length === 0 && (data.id || data.voiceId || data.name)) {
          voices = [data];
          console.log("✅ Single voice object found, wrapping in array");
        }
      }
      
      if (voices.length === 0) {
        console.warn("⚠️ No voices found in API response. Full response structure:", {
          type: typeof data,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : [],
          sample: data ? JSON.stringify(data).substring(0, 500) : "null"
        });
        return defaultPresetVoices;
      }
      
      const mappedVoices = voices.map((voice: any, index: number) => {
        const voiceId = voice.id || voice.voiceId || voice.voice_id || voice.voiceId || `voice-${index}`;
        const voiceName = voice.name || voice.voiceName || voice.displayName || voice.title || `Voice ${index + 1}`;
        const voiceType = voice.type || voice.category || voice.gender || voice.style || "Standard";
        
        console.log(`🎤 Mapping voice ${index + 1}:`, { voiceId, voiceName, voiceType, rawKeys: Object.keys(voice) });
        
        return {
          id: voiceId,
          name: voiceName,
          type: voiceType,
          isPreset: false,
        };
      }).filter((v: any) => v.id && v.id.trim() !== "" && v.id !== `voice-${voices.indexOf(v)}`); // Filter out empty or placeholder IDs
      
      console.log(`✅ Mapped ${mappedVoices.length} voices from ${voices.length} raw voices`);
      return mappedVoices.length > 0 ? mappedVoices : defaultPresetVoices;
    },
  });
  
  // Log errors
  useEffect(() => {
    if (voicesError) {
      console.error("❌ Error fetching voices:", voicesError);
    }
  }, [voicesError]);

  // Update selected voice when voices are loaded
  useEffect(() => {
    if (voicesData && voicesData.length > 0) {
      // Only update if current selection is invalid or empty
      const currentId = selectedVoice?.id?.trim() || "";
      const isDefaultPlaceholder = currentId === "" || currentId === defaultPresetVoices[0].id;
      
      if (isDefaultPlaceholder || !selectedVoice) {
        setSelectedVoice(voicesData[0]);
        console.log("✅ Auto-selected first voice:", voicesData[0]);
      }
    }
  }, [voicesData]);

  // Fetch voice history from assets
  const { data: voiceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["/api/assets"],
    retry: false,
    refetchOnWindowFocus: false,
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data
        .filter((asset) => asset.type === "voice")
        .map((asset) => ({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          text: asset.metadata?.text || asset.name,
          voiceId: asset.metadata?.voiceId,
          createdAt: asset.createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    },
  });
  
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

  // Audio playback handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [generatedAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        console.error("Playback error:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const generateMutation = useMutation({
    mutationFn: async (data: { text: string; voiceId?: string; speed?: number; pitch?: number; projectId?: string | null }) => {
      const response = await apiRequest("POST", "/api/voice/generate", {
        ...data,
        projectId: selectedProjectId,
      });
      
      // Clone response for multiple reads
      const clonedResponse = response.clone();
      
      // Check content type
      const contentType = response.headers.get("content-type") || "";
      
      // Handle 503 Service Unavailable
      if (response.status === 503) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || "Voice generation unavailable");
        } catch (jsonError: any) {
          if (contentType.includes("text/html") || jsonError.message?.includes("DOCTYPE")) {
            throw new Error("Voice generation service is unavailable. Please check your API configuration and restart the server.");
          }
          throw new Error("Voice generation service is unavailable.");
        }
      }

      // Check for other errors
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
        } catch (jsonError: any) {
          if (contentType.includes("text/html") || jsonError.message?.includes("DOCTYPE")) {
            try {
              const text = await clonedResponse.text();
              console.error("Server returned HTML:", text.substring(0, 200));
              throw new Error(`Server error (${response.status}): The server returned an error page. Please check the server logs.`);
            } catch {
              throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
          }
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        setGeneratedAudio(data.audioUrl);
        queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
        setShowConfetti(true);
        setShowSuccess(true);
        setTimeout(() => setShowConfetti(false), 3000);
        toast({
          title: "Voice generated ✨",
          description: `Audio created successfully using ${data.provider || "Murf.ai"}. Saved to history.`,
        });
      } else {
        toast({
          title: "Generation failed",
          description: "No audio URL received. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate voice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!text.trim()) {
      toast({
        title: "Text required",
        description: "Please enter some text to generate voice.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated) {
      setLocation("/signup");
      return;
    }
    
    // Always allow generation - backend will use default voice if needed
    // Determine voice ID to use (can be undefined, backend will handle it)
    const voiceIdToUse = selectedVoice?.id?.trim() || undefined;
    
    // Convert prosody settings to Murf.ai format
    const speed = prosody.speed / 100; // Convert 50-200 to 0.5-2.0
    const pitch = prosody.pitch; // Already in semitones (-50 to 50)
    
    console.log("🎤 Generating voice with:", { 
      voiceId: voiceIdToUse || "default (backend will choose)", 
      text: text.substring(0, 50),
      voicesLoading,
      hasSelectedVoice: !!selectedVoice
    });
    
    generateMutation.mutate({
      text: text.trim(),
      voiceId: voiceIdToUse, // Can be undefined, backend will use default
      speed,
      pitch,
    });
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    
    const link = document.createElement("a");
    link.href = generatedAudio;
    link.download = `voice-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your audio file is downloading.",
    });
  };

  return (
    <AppLayout title="Voice Studio">
      <Confetti trigger={showConfetti} />
      <SuccessAnimation show={showSuccess} message="Voice Generated!" onComplete={() => setShowSuccess(false)} />
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
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
              <Music className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
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
                  {voicesLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading voices...</div>
                  ) : voicesError ? (
                    <div className="text-center py-4">
                      <p className="text-red-400 mb-2">Failed to load voices</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {voicesError instanceof Error ? voicesError.message : "Unknown error"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/voice/voices"] })}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : voicesData && voicesData.length > 0 ? (
                    voicesData.map((voice: any) => (
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
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-3">No voices available</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        The Murf API may not be returning voices. Check the server logs for details.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ["/api/voice/voices"] });
                          console.log("🔄 Retrying voice fetch...");
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  )}
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
                <div className="mb-4 space-y-2">
                  <AudioWaveform
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration || 100}
                  />
                  <audio
                    ref={audioRef}
                    src={generatedAudio}
                    className="hidden"
                    preload="metadata"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!text.trim() || generateMutation.isPending}
                  className="gradient-button flex-1 sm:flex-none"
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
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
                      onClick={handlePlayPause}
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
                    <Button 
                      variant="outline" 
                      onClick={handleDownload}
                      className="glass-input border-white/20" 
                      data-testid="button-download"
                    >
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
          </TabsContent>

          <TabsContent value="history">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Voice History</h3>
                <Badge variant="outline">{voiceHistory.length} audio files</Badge>
              </div>

              {historyLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : voiceHistory.length === 0 ? (
                <EmptyState
                  type="generic"
                  title="No voice history"
                  description="Generated voices will appear here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voiceHistory.map((voice) => (
                    <div
                      key={voice.id}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedHistoryAudio(voice.url);
                        setGeneratedAudio(voice.url);
                        setActiveTab("generate");
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Music className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{voice.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{voice.text}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistoryAudio(voice.url);
                            setGeneratedAudio(voice.url);
                            setActiveTab("generate");
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement("a");
                            link.href = voice.url;
                            link.download = `voice-${voice.id}.mp3`;
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
