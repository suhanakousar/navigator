import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import SignUp from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import VoiceAssistant from "@/pages/voice-assistant";
import VoiceStudio from "@/pages/voice-studio";
import ImageStudio from "@/pages/image-studio";
import VideoStudio from "@/pages/video-studio";
import Projects from "@/pages/projects";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Public routes (accessible without auth)
  if (!isLoading) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/signup" component={SignUp} />
        {/* Public routes - accessible without auth */}
        <Route path="/projects/:id" component={Projects} />
        
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Landing} />
            <Route component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Dashboard} />
            <Route path="/assistant" component={VoiceAssistant} />
            <Route path="/voice-studio" component={VoiceStudio} />
            <Route path="/image-studio" component={ImageStudio} />
            <Route path="/video-studio" component={VideoStudio} />
            <Route path="/projects" component={Projects} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </>
        )}
      </Switch>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
