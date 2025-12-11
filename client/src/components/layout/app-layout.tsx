import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { BottomNav } from "./bottom-nav";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showHeader?: boolean;
}

export function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
  const { theme, setTheme } = useTheme();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main content area */}
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          {showHeader && (
            <header className="flex items-center justify-between gap-4 h-14 px-4 border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <SidebarTrigger
                  className="hidden md:flex"
                  data-testid="button-sidebar-toggle"
                />
                {title && (
                  <h1 className="text-lg font-semibold truncate">{title}</h1>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  data-testid="button-theme-toggle"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </header>
          )}

          <main className="flex-1 overflow-auto custom-scrollbar pb-20 md:pb-0">
            {children}
          </main>
        </SidebarInset>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </SidebarProvider>
  );
}
