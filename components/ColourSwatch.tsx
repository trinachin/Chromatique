"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ColourSwatchProps {
  name: string;
  hex: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  delay?: number;
  /** Marks signature/statement colours with a small star badge. */
  hero?: boolean;
}

export function ColourSwatch({ name, hex, size = "md", className, delay = 0, hero = false }: ColourSwatchProps) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyHex = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // silently ignore copy failures
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 cursor-pointer animate-swatch-reveal opacity-0",
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={copyHex}
      title="Tap to copy hex code"
    >
      <div className="relative">
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
        {hero && (
          <span
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--c-accent)] text-white text-[10px] font-bold flex items-center justify-center shadow-sm border-2 border-[var(--c-bg)]"
            aria-label="Hero colour"
            title="Signature colour for your season"
          >
            ★
          </span>
        )}
      </div>
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
      <span
        className={cn(
          "text-[10px] font-mono uppercase tracking-wide transition-colors duration-200",
          copied ? "text-[var(--c-success)] font-semibold" : "text-[var(--c-ink-soft)]/60"
        )}
      >
        {copied ? "Copied!" : hex.toUpperCase()}
      </span>
    </div>
  );
}
