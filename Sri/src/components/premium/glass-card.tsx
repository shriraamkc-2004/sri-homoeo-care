import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stronger glass effect */
  strong?: boolean;
  /** Enable 3D tilt hover */
  tilt?: boolean;
  /** Soft lift only (no 3D rotation) */
  lift?: boolean;
  /** Extra glow accent */
  glow?: "primary" | "gold" | "none";
}

export function GlassCard({
  className,
  strong = false,
  tilt = false,
  lift = false,
  glow = "none",
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        strong ? "glass-strong" : "glass",
        tilt && "card-3d",
        lift && !tilt && "lift",
        glow === "primary" && "glow-primary",
        glow === "gold" && "glow-gold",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
