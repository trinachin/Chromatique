"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ColourSwatch } from "@/components/ColourSwatch";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/ShareDialog";
import { MaterialChip } from "@/components/MaterialChip";
import { MakeupFeaturesSection } from "@/components/MakeupFeaturesSection";
import { RefreshCw, AlertTriangle, Sparkles, Share2, Download, Gem, Brush, Scissors } from "lucide-react";
import type { ColourResult } from "@/lib/types";
import { getSeasonProfile, getSeasonDetails, getTaggedPalette, SEASON_FAMILY_ACCENT } from "@/lib/seasons";
import { generateShareCard } from "@/lib/share-card";
import { encodeResult } from "@/lib/result-codec";
import { cn } from "@/lib/utils";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ColourResult | null>(null);
  const [ready, setReady] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("chromatique_result");
    if (!raw) {
      router.replace("/analyze");
      return;
    }
    try {
      const parsed: ColourResult = JSON.parse(raw);
      setResult(parsed);
      setTimeout(() => setReady(true), 100);

      // Encode the result into the URL itself so the page is shareable.
      // Zero backend, zero storage cost. The URL IS the database.
      // Skip if URL is already /r/* (we arrived from a shared link).
      if (!window.location.pathname.startsWith("/r/")) {
        try {
          const encoded = encodeResult(parsed);
          window.history.replaceState(null, "", `/r/${encoded}`);
        } catch {
          // If encoding fails, leave the URL as /result. Share will fall back
          // to the homepage URL, which still works as an entry point.
        }
      }
    } catch {
      router.replace("/analyze");
    }
  }, [router]);

  if (!result) return null;

  const familyAccent = SEASON_FAMILY_ACCENT[result.seasonFamily] ?? "var(--c-accent)";
  const description = getSeasonProfile(result.season)?.description ?? `You radiate in ${result.season} colours.`;
  const undertoneLabel = { warm: "Warm", cool: "Cool", neutral: "Neutral" }[result.undertone];
  const lowConfidence = result.confidence < 0.5;
  const details = getSeasonDetails(result.season);
  const taggedPalette = getTaggedPalette(result.season);

  // Save palette as image (download), distinct from social share dialog
  const handleSavePalette = async () => {
    try {
      const blob = await generateShareCard(result);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chromatique-${result.season.toLowerCase().replace(/\s+/g, "-")}-palette.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-10">

        {/* Low-confidence warning */}
        {lowConfidence && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Photo quality could be improved</p>
              <p className="mt-0.5 text-amber-700">
                {result.styleNote || "For a more accurate result, try a clearer photo in natural light without sunglasses or filters."}
              </p>
              <Link href="/analyze" className="mt-2 inline-block underline text-xs">
                Retake analysis →
              </Link>
            </div>
          </div>
        )}

        {/* Season hero */}
        <section
          className={cn(
            "rounded-3xl p-8 text-center transition-all duration-700",
            ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ backgroundColor: familyAccent + "18", border: `2px solid ${familyAccent}30` }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: familyAccent }}>
            Your colour season
          </p>
          <h1
            className="font-display text-4xl sm:text-5xl font-bold mb-3"
            style={{ color: familyAccent }}
          >
            {result.season}
          </h1>
          <p className="text-[var(--c-ink-soft)] text-sm leading-relaxed max-w-md mx-auto mb-5">
            {description}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Pill label={`${result.seasonFamily} family`} color={familyAccent} />
            <Pill label={`${undertoneLabel} undertone`} color={familyAccent} />
          </div>
        </section>

        {/* Your palette */}
        <section>
          <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="Your palette" />
          <p className="text-sm text-[var(--c-ink-soft)] mb-2">
            Colours that make you glow.
          </p>
          <p className="text-xs text-[var(--c-ink-soft)]/70 mb-6 flex items-center gap-1.5">
            <span className="text-[var(--c-accent)]">★</span>
            <span>Signature colour. Tap any swatch to copy its hex.</span>
          </p>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            {taggedPalette.map((swatch, i) => (
              <ColourSwatch
                key={swatch.hex + i}
                name={swatch.name}
                hex={swatch.hex}
                size="lg"
                delay={i * 60}
                hero={swatch.tier === "hero"}
              />
            ))}
          </div>
        </section>

        {/* Why these colours work */}
        {details && (
          <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)]">
            <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="Why these colours work" />
            <p className="text-[var(--c-ink)] leading-relaxed">{details.whyItWorks}</p>
          </section>
        )}

        {/* Colours to avoid */}
        <section>
          <SectionHeader
            icon={<span className="text-sm">✕</span>}
            title="Colours to avoid"
          />
          <p className="text-sm text-[var(--c-ink-soft)] mb-6">
            These clash with your undertone, worth skipping near your face.
          </p>
          <div className="flex flex-wrap gap-4">
            {result.avoid.map((swatch, i) => (
              <div key={swatch.hex + i} className="flex flex-col items-center gap-1.5 opacity-60">
                <div
                  className="w-14 h-14 rounded-xl border border-black/10 relative overflow-hidden"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.12)_4px,rgba(0,0,0,0.12)_5px)]" />
                </div>
                <span className="text-[10px] text-[var(--c-ink)] max-w-[56px] text-center leading-tight">
                  {swatch.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Metals */}
        {details && (
          <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)]">
            <SectionHeader icon={<Gem className="w-4 h-4" />} title="Your metals" />
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-success)] mb-2">Wear</p>
                <div className="flex flex-wrap gap-4">
                  {details.metals.best.map((m) => (
                    <MaterialChip key={m} label={m} category="metal" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">Avoid</p>
                <div className="flex flex-wrap gap-4">
                  {details.metals.avoid.map((m) => (
                    <MaterialChip key={m} label={m} category="metal" muted />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Makeup */}
        {details && (
          <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)]">
            <SectionHeader icon={<Brush className="w-4 h-4" />} title="Your makeup" />
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-2">Lipstick</p>
                <div className="flex flex-wrap gap-4">
                  {details.makeup.lips.map((m) => (
                    <MaterialChip key={m} label={m} category="lipstick" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-2">Blush</p>
                <div className="flex flex-wrap gap-4">
                  {details.makeup.blush.map((m) => (
                    <MaterialChip key={m} label={m} category="blush" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-2">Eyeliner</p>
                <div className="flex flex-wrap gap-4">
                  {details.makeup.eyeliner.map((m) => (
                    <MaterialChip key={m} label={m} category="eyeliner" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hair */}
        {details && (
          <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)]">
            <SectionHeader icon={<Scissors className="w-4 h-4" />} title="Best hair colours" />
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-success)] mb-2">Flattering</p>
                <div className="flex flex-wrap gap-4">
                  {details.hair.best.map((m) => (
                    <MaterialChip key={m} label={m} category="hair" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">Less flattering</p>
                <div className="flex flex-wrap gap-4">
                  {details.hair.avoid.map((m) => (
                    <MaterialChip key={m} label={m} category="hair" muted />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Makeup & Features (per ADD_RESEARCH) — only when Claude returned features */}
        {result.features && (
          <MakeupFeaturesSection features={result.features} result={result} />
        )}

        {/* Style note */}
        {result.styleNote && !lowConfidence && (
          <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)]">
            <SectionHeader icon={<Sparkles className="w-4 h-4" />} title="Your style note" />
            <p className="text-[var(--c-ink)] leading-relaxed">{result.styleNote}</p>
          </section>
        )}

        {/* Save palette for shopping */}
        <section className="rounded-2xl border border-[var(--c-line)] p-5 bg-[var(--c-sand)]/40 flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-base font-semibold text-[var(--c-ink)] mb-0.5">Save your palette</p>
            <p className="text-xs text-[var(--c-ink-soft)]">Download as an image to reference while shopping.</p>
          </div>
          <Button onClick={handleSavePalette} variant="secondary" size="sm" className="gap-2 flex-shrink-0">
            <Download className="w-4 h-4" />
            Save
          </Button>
        </section>

        {/* Coming soon teaser */}
        <section className="rounded-2xl border-2 border-dashed border-[var(--c-line)] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-ink-soft)] mb-4">
            Coming soon
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "🪞", label: "Body analysis" },
              { icon: "📐", label: "Fit guide" },
              { icon: "🌿", label: "Fabric picks" },
              { icon: "🛍️", label: "Product recs" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm text-[var(--c-ink-soft)] bg-[var(--c-sand)] rounded-xl px-3 py-2.5"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <Link href="/analyze" className="flex-1">
            <Button variant="secondary" size="md" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Try another photo
            </Button>
          </Link>
          <Button
            size="md"
            className="flex-1 gap-2"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="w-4 h-4" />
            Share my result
          </Button>
        </div>
      </main>

      <footer className="border-t border-[var(--c-line)] py-6">
        <div className="max-w-2xl mx-auto px-6 text-center text-xs text-[var(--c-ink-soft)]">
          Your photo was analysed and immediately discarded. We never store or train on it.
        </div>
      </footer>

      {/* Share dialog */}
      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        result={result}
        url={typeof window !== "undefined" ? window.location.href : "https://chromatique-trina1.vercel.app/"}
      />
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-xs font-semibold px-3 py-1 rounded-full"
      style={{ backgroundColor: color + "20", color }}
    >
      {label}
    </span>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[var(--c-accent)]">{icon}</span>
      <h2 className="font-display text-xl font-semibold text-[var(--c-ink)]">{title}</h2>
    </div>
  );
}
