"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ColourSwatchProps {
  name: string;
  hex: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
}

export function ColourSwatch({ name, hex, size = "md", className, delay = 0 }: ColourSwatchProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 cursor-default animate-swatch-reveal opacity-0",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "rounded-xl transition-transform duration-200 shadow-sm border border-black/5",
          {
            "w-12 h-12":   size === "sm",
            "w-16 h-16":   size === "md",
            "w-20 h-20":   size === "lg",
          },
          hovered && "scale-110 shadow-md"
        )}
        style={{ backgroundColor: hex }}
        aria-label={`${name}: ${hex}`}
      />
      <span className={cn(
        "text-center text-[var(--c-ink)] font-medium leading-tight",
        {
          "text-[10px] max-w-[48px]":  size === "sm",
          "text-xs    max-w-[64px]":   size === "md",
          "text-sm    max-w-[80px]":   size === "lg",
        }
      )}>
        {name}
      </span>
    </div>
  );
}
