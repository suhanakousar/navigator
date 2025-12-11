import { Button } from "@/components/ui/button";
import { AnimatedOrb } from "@/components/ui/animated-orb";
import { GlassCard } from "@/components/ui/glass-card";
import {
  MessageSquare,
  Mic,
  Image,
  Video,
  FileText,
  Workflow,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Smart Voice Assistant",
    description: "Chat naturally with AI using voice or text",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
  },
  {
    icon: Mic,
    title: "Voice Studio",
    description: "Create and clone AI voices with emotion control",
    color: "text-cyan-400",
    bg: "bg-cyan-500/20",
  },
  {
    icon: Image,
    title: "Image Studio",
    description: "Generate stunning visuals from your imagination",
    color: "text-pink-400",
    bg: "bg-pink-500/20",
  },
  {
    icon: Video,
    title: "Video Studio",
    description: "Transform scripts into captivating videos",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
  {
    icon: FileText,
    title: "Document Analyzer",
    description: "Extract insights and automate workflows",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  {
    icon: Workflow,
    title: "Automation Hub",
    description: "Build powerful AI-driven workflows",
    color: "text-violet-400",
    bg: "bg-violet-500/20",
  },
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">
                LifeNavigator
              </span>
            </div>
            <Button
              onClick={handleLogin}
              className="gradient-button text-sm px-6 py-2"
              data-testid="button-login-header"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-tight mb-6">
                <span className="gradient-text">Your AI Creative</span>
                <br />
                <span className="text-foreground">Journey Starts Here</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                Experience seamless AI magic. Create stunning voices, images, videos,
                and automate your life with the most advanced AI assistant platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button
                  onClick={handleLogin}
                  className="gradient-button text-lg px-8 py-4 w-full sm:w-auto"
                  data-testid="button-login-hero"
                >
                  Start Creating
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="glass-card border-white/20 text-lg px-8 py-4 w-full sm:w-auto"
                  data-testid="button-watch-demo"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Right - Animated Orb */}
            <div className="flex-1 flex justify-center">
              <AnimatedOrb size="hero" isActive />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
              <span className="gradient-text">Powerful AI Tools</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, automate, and innovate with AI
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <GlassCard
                key={feature.title}
                variant="interactive"
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` } as React.CSSProperties}
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <GlassCard variant="elevated" className="text-center p-8 sm:p-12">
            <div className="relative mb-8 mx-auto w-fit">
              <AnimatedOrb size="md" isActive />
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of creators using LifeNavigator to unlock their potential
            </p>
            <Button
              onClick={handleLogin}
              className="gradient-button text-lg px-10 py-4"
              data-testid="button-login-cta"
            >
              Get Started Free
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-muted-foreground">
              LifeNavigator - AI Creative Assistant
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by advanced AI technology
          </p>
        </div>
      </footer>
    </div>
  );
}
