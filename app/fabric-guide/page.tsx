"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { FabricGuideSection } from "@/components/FabricGuideSection";
import type { ColourResult } from "@/lib/types";

// Standalone Fabric & Climate Guide. Works without a colour analysis result,
// but if the user has one in this session we use it to personalise the
// fabric card's accent and footer.

export default function FabricGuidePage() {
  const [result, setResult] = useState<ColourResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("chromatique_result");
      if (raw) setResult(JSON.parse(raw) as ColourResult);
    } catch {
      // No-op, the guide works without a result.
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-6">
        {/* Hero */}
        <section className="text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-accent)] mb-4">
            <span className="w-6 h-px bg-[var(--c-accent)]" />
            Fabric &amp; climate guide
            <span className="w-6 h-px bg-[var(--c-accent)]" />
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--c-ink)] leading-tight mb-3">
            Dress for your climate,
            <br />
            <em className="not-italic text-[var(--c-accent)]">not the magazine.</em>
          </h1>
          <p className="text-sm sm:text-base text-[var(--c-ink-soft)] max-w-md mx-auto leading-relaxed">
            Pick your climate, lifestyle, and skin type. We&apos;ll surface the fabrics that breathe, drape, and last, and the ones to skip.
          </p>
        </section>

        {/* The actual guide */}
        <FabricGuideSection result={result ?? undefined} />

        {/* Footer note */}
        <p className="text-center text-xs text-[var(--c-ink-soft)]/70">
          Your picks are saved on this device only. No account, no tracking.
        </p>
      </main>

      <footer className="border-t border-[var(--c-line)] py-6 mt-12">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--c-ink-soft)]">
          <span className="font-display font-semibold tracking-wide lowercase text-[var(--c-ink)]">chromatique</span>
          <span>© 2026 · Built for SEA climates first</span>
        </div>
      </footer>
    </div>
  );
}
