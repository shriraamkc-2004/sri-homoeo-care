import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Soft entrance — Originkit-style fade/rise without extra deps */
export function FadeRise({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const style = {
    animationDelay: `${delayMs}ms`,
  } as CSSProperties;
  return (
    <div className={cn("animate-fade-rise", className)} style={style}>
      {children}
    </div>
  );
}

/** Magnetic hover surface for CTAs */
export function MagneticSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("magnetic-surface transition-transform duration-300 will-change-transform", className)}>{children}</div>;
}

/** Glass panel used across portals */
export function GlassPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
