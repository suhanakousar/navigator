import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AnimatedOrb } from "@/components/ui/animated-orb";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl" />
      </div>

      <div className="text-center">
        <AnimatedOrb size="lg" className="mx-auto mb-8" />
        
        <h1 className="text-7xl md:text-9xl font-display font-bold gradient-text mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">
          Lost in the void
        </h2>
        
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved to another dimension.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button className="gradient-button" data-testid="button-go-home">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="glass-card border-white/20"
            data-testid="button-go-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
