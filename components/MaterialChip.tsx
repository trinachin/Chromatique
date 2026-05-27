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
  /** Apply muted/avoid styling: 60% opacity + diagonal stripe overlay. */
  muted?: boolean;
}

/**
 * Square swatch + label below, matching the visual rhythm of ColourSwatch
 * in the palette section. Metals use a metallic gradient; everything else
 * uses a solid hex with a soft diagonal sheen to add depth.
 */
export function MaterialChip({ label, category, muted = false }: MaterialChipProps) {
  const background = getBackground(category, label);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5",
        muted && "opacity-60"
      )}
    >
      <div
        aria-hidden="true"
        className="w-16 h-16 rounded-xl border border-black/10 shadow-sm relative overflow-hidden"
        style={{ background }}
      >
        {/* Specular highlight to add subtle depth */}
        <span
          className="absolute top-1.5 left-1.5 w-4 h-2 rounded-full bg-white/40 blur-[1px] pointer-events-none"
        />
        {/* Avoid stripe overlay (matches /result "Colours to avoid" pattern) */}
        {muted && (
          <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.12)_4px,rgba(0,0,0,0.12)_5px)] pointer-events-none" />
        )}
      </div>
      <span className="text-xs font-medium text-[var(--c-ink)] text-center max-w-[80px] leading-tight">
        {label}
      </span>
    </div>
  );
}

function getBackground(category: Category, label: string): string {
  switch (category) {
    case "metal":
      // Multi-stop metallic gradient already includes shine
      return getMetalGradient(label);
    case "lipstick": {
      const hex = getLipstickHex(label);
      // Subtle vertical gradient suggests glossy bullet sheen
      return `linear-gradient(160deg, ${tint(hex, 18)} 0%, ${hex} 45%, ${shade(hex, -12)} 100%)`;
    }
    case "blush": {
      const hex = getBlushHex(label);
      // Soft radial blush gradient
      return `radial-gradient(circle at 30% 30%, ${tint(hex, 25)} 0%, ${hex} 50%, ${shade(hex, -12)} 100%)`;
    }
    case "eyeliner": {
      const hex = getEyelinerHex(label);
      return `linear-gradient(160deg, ${tint(hex, 12)} 0%, ${hex} 50%, ${shade(hex, -15)} 100%)`;
    }
    case "hair": {
      const hex = getHairHex(label);
      // Vertical gradient suggests hair strand light-to-shadow
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
