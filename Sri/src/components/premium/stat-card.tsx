import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  accent?: "primary" | "gold" | "default";
  className?: string;
  style?: React.CSSProperties;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "default",
  className,
  style,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5 card-3d group relative overflow-hidden",
        className,
      )}
      style={style}
    >
      {/* Subtle gradient wash */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          accent === "primary" && "bg-gradient-to-br from-primary/10 to-transparent",
          accent === "gold" && "bg-gradient-to-br from-[oklch(0.82_0.12_85)]/10 to-transparent",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "font-display text-3xl font-bold tracking-tight",
              accent === "primary" && "text-gradient-primary",
              accent === "gold" && "text-gradient-gold",
              accent === "default" && "text-foreground",
            )}
          >
            {value}
          </p>
          {trend && (
            <p className="text-xs text-muted-foreground">{trend}</p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              accent === "primary" && "bg-primary/15 text-primary",
              accent === "gold" && "bg-[oklch(0.82_0.12_85)]/15 text-[oklch(0.82_0.12_85)]",
              accent === "default" && "bg-secondary text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
