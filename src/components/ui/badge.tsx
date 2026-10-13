"use client";

import { cn } from "@/lib/utils";

export interface BadgeProps {
  variant?: "default" | "secondary" | "destructive";
  className?: string;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const variants = {
    default: "bg-background/70 text-text_primary",
    secondary: "bg-border/60 text-text_secondary",
    destructive: "bg-destructive/70 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}