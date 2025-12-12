import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatedOrb } from "@/components/ui/animated-orb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassCard } from "@/components/ui/glass-card";
import { signUp, signInWithGoogle, signInWithGithub } from "@/lib/firebaseAuth";
import { Mail, Lock, User, Github, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignUp() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (!acceptedTerms) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and privacy policy",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password);
      toast({
        title: "Account created!",
        description: "Welcome to LifeNavigator. Your account has been created successfully.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "Successfully signed in with Google",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGithub();
      toast({
        title: "Welcome!",
        description: "Successfully signed in with GitHub",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to sign in with GitHub",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative flex items-center justify-center p-4 md:p-8">
      {/* Background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-background to-background" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-cyan-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] bg-pink-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        
        {/* Animated gradient waves */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-purple-500/20 to-transparent animate-gradient-shift" />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-400/40 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating 3D Orb - Desktop only */}
      <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <AnimatedOrb size="lg" isActive />
      </div>

      {/* Mobile Orb - Top */}
      <div className="lg:hidden absolute top-8 right-1/2 translate-x-1/2 z-10">
        <AnimatedOrb size="sm" isActive />
      </div>

      {/* Main Sign Up Card */}
      <div className="w-full max-w-md relative z-20">
        <GlassCard variant="elevated" className="p-8 md:p-10 backdrop-blur-2xl border-white/20 shadow-2xl shadow-purple-500/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4 border border-white/20 overflow-hidden">
              <img 
                src="/favicon.png" 
                alt="LifeNavigator Logo" 
                className="w-full h-full object-contain p-2"
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Create Your Account 🚀
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Unlock the full power of LifeNavigator AI
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground/80">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400/60" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white/5 border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 rounded-xl backdrop-blur-sm transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white/5 border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/50 rounded-xl backdrop-blur-sm transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white/5 border-pink-500/30 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/50 rounded-xl backdrop-blur-sm transition-all"
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/80">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400/60" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 h-12 bg-white/5 border-pink-500/30 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/50 rounded-xl backdrop-blur-sm transition-all"
                />
              </div>
            </div>

            {/* Terms & Privacy */}
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-1 border-purple-500/50 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  Privacy Policy
                </a>
              </Label>
            </div>

            {/* Create Account Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 hover:from-purple-600 hover:via-pink-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
            >
              {isLoading ? (
                "Creating Account..."
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            {/* Social Sign Up */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="h-12 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 rounded-xl backdrop-blur-sm transition-all"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                onClick={handleGithubSignIn}
                disabled={isLoading}
                variant="outline"
                className="h-12 bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 rounded-xl backdrop-blur-sm transition-all"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-purple-400 hover:text-purple-300 font-medium underline-offset-4 hover:underline transition-colors"
                >
                  Log In
                </button>
              </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

