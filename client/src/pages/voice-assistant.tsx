import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ProjectSelector } from "@/components/ui/project-selector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownMessage } from "@/components/ui/markdown-message";
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
  Plus,
  MessageSquare,
  History,
  X,
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

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  projectId?: string | null;
}

export default function VoiceAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch messages for current conversation
  const { data: conversationMessages = [] } = useQuery({
    queryKey: currentConversationId ? [`/api/conversations/${currentConversationId}/messages`] : ["/api/conversations"],
    enabled: !!currentConversationId,
    retry: false,
    refetchOnWindowFocus: false,
    select: (data: any[]) => {
      if (!Array.isArray(data)) return [];
      return data.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));
    },
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId && conversationMessages.length > 0) {
      setMessages(conversationMessages);
    } else if (!currentConversationId) {
      setMessages([]);
    }
  }, [currentConversationId, conversationMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: title.trim() || "New Conversation",
        projectId: selectedProjectId,
      });
      return res.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(newConversation.id);
      setShowNewChatDialog(false);
      setNewChatTitle("");
      setMessages([]);
      toast({ title: "New conversation created" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create conversation", description: error.message, variant: "destructive" });
    },
  });

  // Save message mutation
  const saveMessageMutation = useMutation({
    mutationFn: async ({ conversationId, role, content }: { conversationId: string; role: string; content: string }) => {
      await apiRequest("POST", `/api/conversations/${conversationId}/messages`, {
        role,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${currentConversationId}/messages`] });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", {
        message,
        conversationId: currentConversationId,
      });
      
      // Handle 503 Service Unavailable (OpenAI not configured)
      if (response.status === 503) {
        const errorData = await response.json();
        // Return the fallback response so it shows in the chat
        return {
          message: errorData.fallbackResponse || "I'm currently unavailable. Please configure the OpenAI API key to enable AI chat features.",
          error: errorData.error,
          needsConfiguration: true,
        };
      }
      
      return response.json();
    },
    onSuccess: async (data, sentMessage) => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.fallbackResponse || "I apologize, but I couldn't generate a response.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save messages to conversation if conversation exists
      if (currentConversationId) {
        try {
          // Save user message
          await saveMessageMutation.mutateAsync({
            conversationId: currentConversationId,
            role: "user",
            content: sentMessage,
          });
          // Save assistant message
          await saveMessageMutation.mutateAsync({
            conversationId: currentConversationId,
            role: "assistant",
            content: assistantMessage.content,
          });
        } catch (error) {
          console.error("Failed to save messages:", error);
        }
      }
      
      // Show configuration notice if OpenAI is not set up
      if (data.needsConfiguration) {
        toast({
          title: "OpenAI Not Configured",
          description: data.error || "Please add your OpenAI API key to enable AI features.",
          variant: "destructive",
          duration: 5000,
        });
      }
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

    // Create conversation if none exists
    if (!currentConversationId) {
      createConversationMutation.mutate(newChatTitle || "New Conversation");
      // Wait a bit for conversation to be created
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

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

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const handleCreateNewChat = () => {
    createConversationMutation.mutate(newChatTitle || "New Conversation");
  };

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    setActiveTab("chat");
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
        {/* Header with project selector and new chat */}
        <div className="p-4 md:p-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleNewChat}
                className="glass-input border-white/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
              {currentConversationId && (
                <Badge variant="outline">
                  {conversations.find((c) => c.id === currentConversationId)?.title || "Chat"}
                </Badge>
              )}
            </div>
            <div className="w-full md:w-auto">
              <ProjectSelector
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                placeholder="Select project (optional)"
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chat" | "history")} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 md:px-6 pt-4">
            <TabsList className="bg-white/5">
              <TabsTrigger value="chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
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
                          "max-w-[80%] rounded-2xl",
                          message.role === "user"
                            ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-br-sm p-4"
                            : "bg-white/10 rounded-bl-sm p-4 md:p-6"
                        )}
                      >
                        {message.role === "assistant" ? (
                          <MarkdownMessage 
                            content={message.content} 
                            className="text-sm md:text-base text-gray-100"
                          />
                        ) : (
                          <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
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

        </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden">
              <div className="p-4 md:p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Conversation History</h3>
                  <Badge variant="outline">{conversations.length} conversations</Badge>
                </div>

                {conversationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <EmptyState
                    type="generic"
                    title="No conversations yet"
                    description="Start a new chat to begin a conversation"
                  />
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 rounded-xl cursor-pointer transition-colors ${
                          currentConversationId === conversation.id
                            ? "bg-purple-500/20 border border-purple-500/50"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <MessageSquare className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium">{conversation.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(conversation.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {currentConversationId === conversation.id && (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

        {/* New Chat Dialog */}
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Conversation</DialogTitle>
              <DialogDescription>Start a new chat conversation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Conversation Title (Optional)</label>
                <Input
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  placeholder="e.g., Project Discussion"
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Project (Optional)</label>
                <ProjectSelector
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  placeholder="Select project"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateNewChat}
                  disabled={createConversationMutation.isPending}
                >
                  {createConversationMutation.isPending ? "Creating..." : "Create Chat"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
