"use client";

import { useState, useMemo } from "react";
import { Search, AlertTriangle, CheckCircle2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseComposition, type CompositionResult, type ClimateFitVerdict } from "@/lib/composition-parser";

// Lets the user paste a fibre composition string (or pick an example) and
// returns the 3-line plain-English verdict from FABRIC_RESEARCH §6b.

const EXAMPLES: { label: string; value: string }[] = [
  { label: "Daily tee blend", value: "60% cotton, 35% polyester, 5% elastane" },
  { label: "100% linen shirt", value: "100% Linen, 180 GSM" },
  { label: "Cheap acrylic sweater", value: "95% Acrylic, 5% Wool" },
  { label: "Athletic legging", value: "78% Polyester, 18% Nylon, 4% Elastane" },
  { label: "TENCEL cotton premium tee", value: "50% TENCEL Lyocell, 50% Cotton" },
];

export function CompositionChecker() {
  const [input, setInput] = useState("");
  const result = useMemo<CompositionResult | null>(() => {
    if (!input.trim()) return null;
    return parseComposition(input);
  }, [input]);

  const showVerdict = result && result.fibres.length > 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-ink-soft)] pointer-events-none" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="60% cotton, 35% polyester, 5% elastane"
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-[var(--c-line)] bg-[var(--c-bg)] text-sm text-[var(--c-ink)] placeholder:text-[var(--c-ink-soft)]/60 focus:outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-accent)]/20"
          aria-label="Paste a fabric composition label"
        />
        {input && (
          <button
            type="button"
            onClick={() => setInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-ink-soft)] hover:text-[var(--c-ink)]"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Examples (only when input is empty) */}
      {!input && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[var(--c-ink-soft)]/70 self-center mr-1">
            Try
          </span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => setInput(ex.value)}
              className="text-xs px-2.5 py-1 rounded-full border border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-ink-soft)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-ink)] transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      )}

      {/* Verdict */}
      {showVerdict && (
        <div className="space-y-3 mt-3">
          {/* Detected fibres summary */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="uppercase tracking-wider text-[10px] text-[var(--c-ink-soft)]/70">
              Detected
            </span>
            {result.fibres.map((f) => (
              <span
                key={f.raw}
                className="px-2 py-0.5 rounded-full bg-[var(--c-sand)] text-[var(--c-ink)] text-[11px] font-medium"
              >
                {f.pct}% {f.fibre}
              </span>
            ))}
            {result.weightHint && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--c-bg)] border border-[var(--c-line)] text-[var(--c-ink-soft)] text-[11px]">
                {result.weightHint}
              </span>
            )}
          </div>

          {/* The 3-line verdict */}
          <VerdictLine label="Comfort" body={result.comfort} />
          <VerdictLine label="Care" body={result.care} />
          <VerdictLine label="Climate fit (SEA)" body={result.climateFit} tone={toneFor(result.climateFitVerdict)} />

          {/* Green flags (positives) */}
          {result.greenFlags.length > 0 && (
            <div className="space-y-1.5">
              {result.greenFlags.map((g, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-[var(--c-success)] bg-[var(--c-success)]/10 rounded-lg p-2.5 border border-[var(--c-success)]/30">
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          )}

          {/* Red flags */}
          {result.redFlags.length > 0 && (
            <div className="space-y-1.5">
              {result.redFlags.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg p-2.5 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setInput("")}
            className="text-xs"
          >
            Check another label
          </Button>
        </div>
      )}

      {input.trim() && result && result.fibres.length === 0 && (
        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            We didn&apos;t recognise any fibres. Try a string like
            <code className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
              60% cotton, 35% polyester, 5% elastane
            </code>
            .
          </span>
        </div>
      )}
    </div>
  );
}

function VerdictLine({ label, body, tone = "neutral" }: { label: string; body: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  return (
    <div className="bg-[var(--c-bg)] rounded-xl p-3 border border-[var(--c-line)]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-ink-soft)] mb-1 flex items-center gap-1.5">
        {label}
        {tone === "good" && <CheckCircle2 className="w-3 h-3 text-[var(--c-success)]" />}
        {tone === "warn" && <AlertTriangle className="w-3 h-3 text-amber-600" />}
        {tone === "bad" && <AlertTriangle className="w-3 h-3 text-red-600" />}
      </p>
      <p className={cn(
        "text-sm leading-relaxed",
        tone === "good" && "text-[var(--c-ink)]",
        tone === "warn" && "text-amber-800",
        tone === "bad" && "text-red-700",
        tone === "neutral" && "text-[var(--c-ink)]"
      )}>
        {body}
      </p>
    </div>
  );
}

function toneFor(v: ClimateFitVerdict): "good" | "warn" | "bad" | "neutral" {
  if (v === "excellent" || v === "good") return "good";
  if (v === "risky") return "warn";
  if (v === "avoid") return "bad";
  return "neutral";
}
