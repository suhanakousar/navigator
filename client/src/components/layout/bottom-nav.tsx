import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Plus,
  FolderOpen,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Chat", url: "/assistant", icon: MessageSquare },
  { title: "Create", url: "#create", icon: Plus, isAction: true },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface BottomNavProps {
  onCreateClick?: () => void;
}

export function BottomNav({ onCreateClick }: BottomNavProps) {
  const [location] = useLocation();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  return (
    <>
      {/* Create menu overlay */}
      {showCreateMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCreateMenu(false)}
        />
      )}

      {/* Create menu */}
      {showCreateMenu && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="glass-card-elevated p-4 rounded-2xl min-w-[200px]">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/voice-studio">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 w-full"
                  onClick={() => setShowCreateMenu(false)}
                  data-testid="create-voice"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-xs">Voice</span>
                </Button>
              </Link>
              <Link href="/image-studio">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 w-full"
                  onClick={() => setShowCreateMenu(false)}
                  data-testid="create-image"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <span className="text-xs">Image</span>
                </Button>
              </Link>
              <Link href="/video-studio">
                <Button
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 w-full"
                  onClick={() => setShowCreateMenu(false)}
                  data-testid="create-video"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <span className="text-xs">Video</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="bottom-nav md:hidden" data-testid="bottom-nav">
        {navItems.map((item) => {
          const isActive = !item.isAction && location === item.url;
          const isCreate = item.isAction;

          if (isCreate) {
            return (
              <button
                key={item.title}
                onClick={() => {
                  setShowCreateMenu(!showCreateMenu);
                  onCreateClick?.();
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-2 -mt-6 relative",
                  "transition-all duration-200"
                )}
                data-testid="button-create"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-purple-500 to-pink-500",
                  "shadow-lg shadow-purple-500/30",
                  "transition-transform duration-200",
                  showCreateMenu && "rotate-45"
                )}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </button>
            );
          }

          return (
            <Link key={item.title} href={item.url}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center p-2 min-w-[60px]",
                  "transition-colors duration-200",
                  isActive ? "text-purple-400" : "text-muted-foreground"
                )}
                data-testid={`nav-mobile-${item.title.toLowerCase()}`}
              >
                <item.icon className={cn(
                  "w-5 h-5 mb-1",
                  isActive && "animate-scale-in"
                )} />
                <span className="text-xs">{item.title}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
