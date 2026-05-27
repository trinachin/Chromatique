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
  /** Apply muted/avoid styling. */
  muted?: boolean;
}

/**
 * Pill that combines a category-specific swatch (metal sheen / lipstick bullet
 * / blush dot / eyeliner pencil tip / hair strand) with the text label.
 */
export function MaterialChip({ label, category, muted = false }: MaterialChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[var(--c-surface)] border border-[var(--c-line)] text-sm",
        muted ? "text-[var(--c-ink-soft)] opacity-70" : "text-[var(--c-ink)]"
      )}
    >
      <Swatch category={category} label={label} />
      {label}
    </span>
  );
}

function Swatch({ category, label }: { category: Category; label: string }) {
  if (category === "metal") {
    return (
      <span
        aria-hidden="true"
        className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0 shadow-inner relative overflow-hidden"
        style={{ background: getMetalGradient(label) }}
      >
        {/* Tiny specular highlight to enhance the metallic feel */}
        <span
          className="absolute top-[3px] left-[5px] w-[6px] h-[3px] rounded-full bg-white/70 blur-[0.5px]"
        />
      </span>
    );
  }

  if (category === "lipstick") {
    const hex = getLipstickHex(label);
    return (
      <span
        aria-hidden="true"
        className="w-4 h-6 rounded-[3px] flex-shrink-0 border border-black/10 relative overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${hex} 0%, ${shade(hex, -10)} 100%)`,
        }}
      >
        {/* Glossy highlight strip on a lipstick bullet */}
        <span
          className="absolute top-[2px] left-[2px] w-[2px] bottom-[2px] rounded-full bg-white/35"
        />
      </span>
    );
  }

  if (category === "blush") {
    const hex = getBlushHex(label);
    return (
      <span
        aria-hidden="true"
        className="w-6 h-6 rounded-full flex-shrink-0"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${tint(hex, 25)} 0%, ${hex} 55%, ${shade(hex, -15)} 100%)`,
        }}
      />
    );
  }

  if (category === "eyeliner") {
    const hex = getEyelinerHex(label);
    return (
      <span
        aria-hidden="true"
        className="w-7 h-2.5 rounded-full flex-shrink-0 border border-black/10"
        style={{
          background: `linear-gradient(90deg, ${shade(hex, -20)} 0%, ${hex} 50%, ${shade(hex, -10)} 100%)`,
        }}
      />
    );
  }

  // hair
  const hex = getHairHex(label);
  return (
    <span
      aria-hidden="true"
      className="w-4 h-7 rounded-[2px] flex-shrink-0 border border-black/10 overflow-hidden relative"
      style={{
        background: `linear-gradient(180deg, ${tint(hex, 15)} 0%, ${hex} 50%, ${shade(hex, -15)} 100%)`,
      }}
    >
      {/* Subtle vertical strand lines */}
      <span
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "repeating-linear-gradient(90deg, transparent 0px, transparent 1px, rgba(0,0,0,0.25) 1px, rgba(0,0,0,0.25) 2px)",
        }}
      />
    </span>
  );
}

/** Lighten a hex by `amount` percentage points (0-100). */
function tint(hex: string, amount: number): string {
  return adjust(hex, amount);
}

/** Darken a hex by `amount` percentage points (negative). */
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
