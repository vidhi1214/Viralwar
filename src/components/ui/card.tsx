"use client";

import { cn } from "@/lib/utils";

export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn("rounded-lg border", className)}>{children}</div>
  );
}