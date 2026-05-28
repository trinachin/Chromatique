"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { FabricGuideSection } from "@/components/FabricGuideSection";
import { CompositionChecker } from "@/components/CompositionChecker";
import { Thermometer, HeartPulse, ScanSearch, Sparkles, ArrowRight } from "lucide-react";
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

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 sm:px-6 py-10 sm:py-12 space-y-8">
        {/* Hero */}
        <section className="text-center">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--c-accent)] mb-4">
            <span className="w-6 h-px bg-[var(--c-accent)]" />
            Fabric &amp; climate guide
            <span className="w-6 h-px bg-[var(--c-accent)]" />
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--c-ink)] leading-tight mb-3">
            Dress for your body,
            <br />
            <em className="not-italic text-[var(--c-accent)]">not the magazine.</em>
          </h1>
          <p className="text-sm sm:text-base text-[var(--c-ink-soft)] max-w-md mx-auto leading-relaxed">
            Tell us how you run (hot or cold) and how your skin behaves. We&apos;ll surface fabrics that breathe, drape, and don&apos;t flare you up, with the science behind every pick.
          </p>
        </section>

        {/* USP callout — what makes this guide different */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <UspBadge
            icon={<Thermometer className="w-4 h-4" />}
            title="Hot or cold-prone"
            body="Body thermal preference biases your anchors. Silk, fine merino, TENCEL for cold-prone bodies; linen, hemp, seersucker for hot-prone."
          />
          <UspBadge
            icon={<HeartPulse className="w-4 h-4" />}
            title="Sensitive or dry"
            body="Sensitive mode filters out wool and pill-prone fabrics; Dry mode favours moisture-retaining silk, TENCEL, modal and pushes oil-stripping synthetics down."
          />
          <UspBadge
            icon={<ScanSearch className="w-4 h-4" />}
            title="Label parser"
            body="Paste any composition string for a plain-English verdict plus red-flag warnings sourced from textile science."
          />
        </section>

        {/* Table of contents — anchor links */}
        <nav className="bg-[var(--c-surface)]/60 rounded-2xl border border-[var(--c-line)] p-3 sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-ink-soft)] mb-2">
            On this page
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <TocLink href="#about-you" label="01 · About you" />
            <TocLink href="#your-fabrics" label="02 · Your fabrics" />
            <TocLink href="#check-label" label="03 · Check a label" />
            <TocLink href="#learn" label="04 · Learn the rules" />
          </div>
        </nav>

        {/* The guide itself (sections 01, 02, 04) */}
        <FabricGuideSection result={result ?? undefined} />

        {/* Composition Checker (section 03) */}
        <section
          id="check-label"
          className="bg-[var(--c-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--c-line)] space-y-4 scroll-mt-20"
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl font-bold text-[var(--c-line)] leading-none">03</span>
            <div className="flex items-center gap-2">
              <span className="text-[var(--c-accent)]"><ScanSearch className="w-4 h-4" /></span>
              <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--c-ink)]">
                Check a fabric label
              </h2>
            </div>
          </div>
          <p className="text-sm text-[var(--c-ink-soft)] leading-relaxed">
            Standing in a shop or scrolling a product page? Paste the composition string and get a plain-English verdict on comfort, care, and tropical climate fit, with red-flag warnings sourced from textile science.
          </p>
          <CompositionChecker />
        </section>

        {/* If they haven't done analysis yet, prompt them */}
        {!result && (
          <section className="bg-[var(--c-success)]/8 rounded-2xl p-5 sm:p-6 border border-[var(--c-success)]/20">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 flex-shrink-0 mt-1 text-[var(--c-success)]" />
              <div className="flex-1">
                <p className="font-semibold text-[var(--c-ink)] mb-1">
                  Want colour to match your fabric picks?
                </p>
                <p className="text-sm text-[var(--c-ink-soft)] leading-relaxed mb-3">
                  Run a 60-second colour analysis. We&apos;ll suggest which of your fabrics work best in your season palette.
                </p>
                <Link href="/analyze">
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--c-success)] hover:underline">
                    Start colour analysis
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </section>
        )}

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

function UspBadge({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-[var(--c-surface)] border border-[var(--c-line)] p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[var(--c-accent)]">{icon}</span>
        <p className="text-xs font-semibold text-[var(--c-ink)]">{title}</p>
      </div>
      <p className="text-[11px] text-[var(--c-ink-soft)] leading-relaxed">{body}</p>
    </div>
  );
}

function TocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-2.5 py-1 rounded-full border border-[var(--c-line)] bg-[var(--c-bg)] text-[var(--c-ink-soft)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-ink)] transition-colors"
    >
      {label}
    </a>
  );
}
