import { AppLayout } from "@/components/layout/app-layout";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { redirectToLogout } from "@/lib/authUtils";
import {
  User,
  Bell,
  Shield,
  Key,
  Palette,
  Database,
  Mic,
  CreditCard,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);

  const memories = [
    { key: "preferred_voice", value: "Narrator Pro", date: "2 days ago" },
    { key: "image_style", value: "Cyberpunk", date: "1 week ago" },
    { key: "timezone", value: "America/New_York", date: "2 weeks ago" },
  ];

  const voiceModels = [
    { id: "1", name: "My Clone Voice", status: "active", createdAt: "Jan 15, 2024" },
    { id: "2", name: "Podcast Voice", status: "processing", createdAt: "Jan 20, 2024" },
  ];

  return (
    <AppLayout title="Settings">
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-white/5 flex-wrap">
            <TabsTrigger value="account" data-testid="tab-account">
              <User className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="memory" data-testid="tab-memory">
              <Database className="w-4 h-4 mr-2" />
              AI Memory
            </TabsTrigger>
            <TabsTrigger value="voice" data-testid="tab-voice">
              <Mic className="w-4 h-4 mr-2" />
              Voice Models
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <GlassCard>
              <h3 className="font-semibold mb-6">Profile</h3>
              
              <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
                <Avatar className="w-20 h-20 border-2 border-white/20">
                  <AvatarImage src={user?.profileImageUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-2xl">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-3 flex-1">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">First Name</label>
                      <Input
                        defaultValue={user?.firstName || ""}
                        className="glass-input"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Last Name</label>
                      <Input
                        defaultValue={user?.lastName || ""}
                        className="glass-input"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                    <Input
                      defaultValue={user?.email || ""}
                      disabled
                      className="glass-input opacity-60"
                      data-testid="input-email"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="gradient-button" data-testid="button-save-profile">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  className="glass-input border-white/20 text-red-400"
                  onClick={redirectToLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </GlassCard>

            {/* Notifications */}
            <GlassCard className="mt-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Notifications</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: "Email notifications", description: "Receive updates via email", enabled: true },
                  { label: "Job completion alerts", description: "Get notified when jobs finish", enabled: true },
                  { label: "Marketing emails", description: "Product updates and tips", enabled: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked={item.enabled} data-testid={`switch-${item.label.toLowerCase().replace(/\s+/g, "-")}`} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          {/* AI Memory Tab */}
          <TabsContent value="memory">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold">AI Memory</h3>
                </div>
                <Badge variant="outline">{memories.length} items stored</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-6">
                LifeNavigator remembers your preferences and context to provide personalized assistance.
                You can view and delete any stored memory.
              </p>

              <div className="space-y-3">
                {memories.map((memory, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    data-testid={`memory-${i}`}
                  >
                    <div>
                      <p className="font-medium">{memory.key.replace(/_/g, " ")}</p>
                      <p className="text-sm text-muted-foreground">{memory.value}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">{memory.date}</span>
                      <Button size="icon" variant="ghost" className="text-red-400" data-testid={`delete-memory-${i}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 mb-3">
                  Deleting all memories will reset AI personalization. This action cannot be undone.
                </p>
                <Button variant="outline" className="border-red-500/50 text-red-400" data-testid="button-clear-memory">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Memory
                </Button>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Voice Models Tab */}
          <TabsContent value="voice">
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold">Voice Models</h3>
                </div>
                <Button variant="outline" className="glass-input border-white/20" data-testid="button-clone-voice">
                  <Plus className="w-4 h-4 mr-2" />
                  Clone Voice
                </Button>
              </div>

              <div className="space-y-3">
                {voiceModels.map((voice) => (
                  <div
                    key={voice.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                    data-testid={`voice-model-${voice.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Mic className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium">{voice.name}</p>
                        <p className="text-sm text-muted-foreground">Created {voice.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={voice.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>
                        {voice.status}
                      </Badge>
                      <Button size="icon" variant="ghost" className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-xl bg-white/5">
                <h4 className="font-medium mb-2">Voice Cloning Consent</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  By cloning a voice, you confirm that you have the right to use the voice sample
                  and agree to our terms of service.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">I agree to voice cloning terms</span>
                  <Switch defaultChecked data-testid="switch-voice-consent" />
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold">Security</h3>
              </div>

              <div className="space-y-6">
                {/* 2FA */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch data-testid="switch-2fa" />
                </div>

                {/* Sessions */}
                <div>
                  <h4 className="font-medium mb-4">Active Sessions</h4>
                  <div className="space-y-3">
                    {[
                      { device: "Chrome on MacOS", location: "New York, US", current: true },
                      { device: "Safari on iPhone", location: "New York, US", current: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                        <div>
                          <p className="font-medium">{session.device}</p>
                          <p className="text-sm text-muted-foreground">{session.location}</p>
                        </div>
                        {session.current ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400">Current</Badge>
                        ) : (
                          <Button variant="outline" size="sm" className="text-red-400 border-red-500/30">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold">API Keys & Integrations</h3>
              </div>

              <div className="space-y-6">
                {/* API Key Display */}
                <div className="p-4 rounded-xl bg-white/5">
                  <label className="text-sm text-muted-foreground mb-2 block">Your API Key</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value="ln_sk_1234567890abcdef"
                      readOnly
                      className="glass-input font-mono"
                      data-testid="input-api-key"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="shrink-0"
                      data-testid="button-toggle-api-key"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Integrations */}
                <div>
                  <h4 className="font-medium mb-4">Connected Services</h4>
                  <div className="space-y-3">
                    {[
                      { name: "OpenAI", status: "connected", icon: "🤖" },
                      { name: "ElevenLabs", status: "not connected", icon: "🎙️" },
                      { name: "Vultr", status: "connected", icon: "☁️" },
                    ].map((service, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.icon}</span>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.status}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="glass-input border-white/20">
                          {service.status === "connected" ? "Configure" : "Connect"}
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
