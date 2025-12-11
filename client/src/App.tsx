import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import VoiceAssistant from "@/pages/voice-assistant";
import VoiceStudio from "@/pages/voice-studio";
import ImageStudio from "@/pages/image-studio";
import VideoStudio from "@/pages/video-studio";
import Documents from "@/pages/documents";
import Automations from "@/pages/automations";
import Projects from "@/pages/projects";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated routes
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/assistant" component={VoiceAssistant} />
      <Route path="/voice-studio" component={VoiceStudio} />
      <Route path="/image-studio" component={ImageStudio} />
      <Route path="/video-studio" component={VideoStudio} />
      <Route path="/documents" component={Documents} />
      <Route path="/automations" component={Automations} />
      <Route path="/projects" component={Projects} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
