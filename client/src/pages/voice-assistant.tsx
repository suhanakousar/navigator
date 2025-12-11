import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedOrb } from "@/components/ui/animated-orb";
import { Waveform, VoiceInputIndicator } from "@/components/ui/waveform";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Send,
  MoreVertical,
  Pin,
  Trash2,
  Copy,
  Volume2,
  Sparkles,
  FileText,
  Mail,
  Wand2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { icon: Wand2, label: "Summarize" },
  { icon: FileText, label: "To Document" },
  { icon: Mail, label: "Draft Email" },
  { icon: Copy, label: "Copy" },
];

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { message });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.fallbackResponse || "I apologize, but I couldn't generate a response.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput("");
    
    chatMutation.mutate(messageToSend);
  };

  const isTyping = chatMutation.isPending;

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setInputMode("voice");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout title="Voice Assistant">
      <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-6 overflow-hidden">
          {/* Chat panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="space-y-4 p-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AnimatedOrb size="lg" isActive={isListening} />
                    <h2 className="text-xl font-semibold mt-6 mb-2">
                      Hello! How can I help you today?
                    </h2>
                    <p className="text-muted-foreground text-center max-w-md">
                      Ask me anything or use voice to chat. I can help with creative tasks,
                      document analysis, and much more.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 animate-fade-in",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] p-4 rounded-2xl",
                          message.role === "user"
                            ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-br-sm"
                            : "bg-white/10 rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm md:text-base">{message.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.role === "assistant" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-6 h-6"
                              data-testid="button-play-audio"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium">You</span>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick actions */}
            {messages.length > 0 && (
              <div className="flex gap-2 p-2 overflow-x-auto hide-scrollbar">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="shrink-0 glass-input border-white/20 text-xs"
                    data-testid={`quick-action-${action.label.toLowerCase()}`}
                  >
                    <action.icon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Input area */}
            <div className="p-2 md:p-4">
              <GlassCard className="p-3 md:p-4">
                {/* Voice waveform */}
                {isListening && (
                  <div className="mb-4">
                    <Waveform isActive={isListening} barCount={50} variant="default" />
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Listening... Speak now
                    </p>
                  </div>
                )}

                <div className="flex items-end gap-3">
                  {/* Voice toggle */}
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "outline"}
                    className={cn(
                      "shrink-0",
                      isListening && "bg-red-500 hover:bg-red-600 animate-pulse"
                    )}
                    onClick={toggleVoice}
                    data-testid="button-voice-toggle"
                  >
                    {isListening ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </Button>

                  {/* Text input */}
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message or use voice..."
                    className="min-h-[44px] max-h-32 resize-none glass-input flex-1"
                    rows={1}
                    data-testid="input-message"
                  />

                  {/* Send button */}
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="shrink-0 gradient-button w-11 h-11 rounded-xl"
                    data-testid="button-send"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Sidebar - Conversation History (Desktop) */}
          <div className="hidden lg:block w-72 shrink-0">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">History</h3>
                <Button size="icon" variant="ghost" data-testid="button-history-more">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {[
                  { title: "Voice generation help", time: "Today" },
                  { title: "Image prompt ideas", time: "Yesterday" },
                  { title: "Document analysis", time: "3 days ago" },
                ].map((conv, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                    data-testid={`conversation-${i}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">{conv.time}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="w-6 h-6">
                          <Pin className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="w-6 h-6 text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
