"use client";
import { cn } from "@/lib/utils";
import {
  getMetalGradient,
  getLipstickHex,
  getBlushHex,
  getEyelinerHex,
  getHairHex,
} from "@/lib/material-swatches";

type Category = "metal" | "lipstick" | "blush" | "eyeliner" | "hair";

interface MaterialChipProps {
  label: string;
  category: Category;
  /** Apply muted/avoid styling: diagonal stripe overlay + muted label only. Swatch colour stays accurate. */
  muted?: boolean;
}

/**
 * Square swatch (matches /result palette size) + label below. Fixed width so
 * varying label lengths don't change the column rhythm.
 */
export function MaterialChip({ label, category, muted = false }: MaterialChipProps) {
  const background = getBackground(category, label);

  return (
    <div className="flex flex-col items-center gap-1.5 w-20 flex-shrink-0">
      <div
        aria-hidden="true"
        className="w-16 h-16 rounded-xl border border-black/10 shadow-sm relative overflow-hidden"
        style={{ background }}
      />
      <span
        className={cn(
          "text-xs font-medium text-center leading-tight",
          // Muted = slightly lighter label colour only. Swatch shows the true
          // color so "Bright copper" actually reads as copper, "Black" reads
          // as black, etc. The "LESS FLATTERING" section header (red) is what
          // communicates the avoid context.
          muted ? "text-[var(--c-ink-soft)]" : "text-[var(--c-ink)]"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function getBackground(category: Category, label: string): string {
  switch (category) {
    case "metal":
      return getMetalGradient(label);
    case "lipstick": {
      const hex = getLipstickHex(label);
      return `linear-gradient(160deg, ${tint(hex, 18)} 0%, ${hex} 45%, ${shade(hex, -12)} 100%)`;
    }
    case "blush": {
      const hex = getBlushHex(label);
      return `radial-gradient(circle at 30% 30%, ${tint(hex, 25)} 0%, ${hex} 50%, ${shade(hex, -12)} 100%)`;
    }
    case "eyeliner": {
      const hex = getEyelinerHex(label);
      return `linear-gradient(160deg, ${tint(hex, 12)} 0%, ${hex} 50%, ${shade(hex, -15)} 100%)`;
    }
    case "hair": {
      const hex = getHairHex(label);
      return `linear-gradient(180deg, ${tint(hex, 18)} 0%, ${hex} 50%, ${shade(hex, -15)} 100%)`;
    }
  }
}

function tint(hex: string, amount: number): string {
  return adjust(hex, amount);
}
function shade(hex: string, amount: number): string {
  return adjust(hex, amount);
}
function adjust(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const factor = amount / 100;
  const newR = Math.max(0, Math.min(255, Math.round(r + (factor > 0 ? (255 - r) * factor : r * factor))));
  const newG = Math.max(0, Math.min(255, Math.round(g + (factor > 0 ? (255 - g) * factor : g * factor))));
  const newB = Math.max(0, Math.min(255, Math.round(b + (factor > 0 ? (255 - b) * factor : b * factor))));
  return `#${[newR, newG, newB].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
