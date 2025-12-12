import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive";
  glow?: "none" | "purple" | "cyan" | "magenta";
  noPadding?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = "none", noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border transition-all duration-300",
          {
            "bg-white/5 backdrop-blur-xl border-white/10": variant === "default",
            "bg-white/10 backdrop-blur-xl border-white/15": variant === "elevated",
            "bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] cursor-pointer": variant === "interactive",
          },
          {
            "shadow-glass": variant === "default",
            "shadow-glass-sm": variant === "elevated",
          },
          {
            "": glow === "none",
            "shadow-neon-purple hover:shadow-neon-purple": glow === "purple",
            "shadow-neon-cyan hover:shadow-neon-cyan": glow === "cyan",
            "shadow-neon-magenta hover:shadow-neon-magenta": glow === "magenta",
          },
          !noPadding && "p-6",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const GlassCardHeader = forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
);

GlassCardHeader.displayName = "GlassCardHeader";

export interface GlassCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const GlassCardTitle = forwardRef<HTMLHeadingElement, GlassCardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
);

GlassCardTitle.displayName = "GlassCardTitle";

export interface GlassCardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const GlassCardDescription = forwardRef<HTMLParagraphElement, GlassCardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);

GlassCardDescription.displayName = "GlassCardDescription";

export interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {}

const GlassCardContent = forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-4", className)} {...props} />
  )
);

GlassCardContent.displayName = "GlassCardContent";

export interface GlassCardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const GlassCardFooter = forwardRef<HTMLDivElement, GlassCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4 gap-2", className)}
      {...props}
    />
  )
);

GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};
