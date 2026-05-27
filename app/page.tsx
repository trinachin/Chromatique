import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ComingSoonCard } from "@/components/ComingSoonCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, Clock } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--c-accent)] mb-6">
            <span className="w-6 h-px bg-[var(--c-accent)]" />
            AI Personal Colour Analysis
            <span className="w-6 h-px bg-[var(--c-accent)]" />
          </p>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--c-ink)] leading-tight mb-6">
            Discover the colours
            <br />
            <em className="not-italic text-[var(--c-accent)]">made for you.</em>
          </h1>

          <p className="text-base sm:text-lg text-[var(--c-ink-soft)] max-w-xl mx-auto leading-relaxed mb-10">
            Upload a selfie. Get your personal colour season, a curated palette, and fabric guidance, beautifully tailored to you.
          </p>

          <Link href="/analyze">
            <Button size="lg" className="shadow-lg">
              Start my free analysis
            </Button>
          </Link>

          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-[var(--c-ink-soft)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--c-success)]" />
              Photo analysed &amp; immediately discarded
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--c-accent)]" />
              12-season Korean colour system
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--c-olive)]" />
              Results in under 60 seconds
            </span>
          </div>
        </section>

        {/* Colour wheel visual */}
        <section className="flex justify-center pb-16 px-6">
          <ColourWheelArt />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-[var(--c-surface)] border-y border-[var(--c-line)]">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--c-ink)] text-center mb-12">
              How it works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload your selfie",
                  body: "A clear face photo in natural light. No filter, no sunglasses.",
                },
                {
                  step: "02",
                  title: "AI analyses your colours",
                  body: "Our engine reads skin undertone, depth, and contrast across all skin tones.",
                },
                {
                  step: "03",
                  title: "Get your palette",
                  body: "Your colour season, 8–12 flattering shades, and fabric guidance for your climate.",
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="text-center sm:text-left">
                  <div className="font-display text-4xl font-bold text-[var(--c-line)] mb-2">{step}</div>
                  <h3 className="font-semibold text-[var(--c-ink)] mb-1">{title}</h3>
                  <p className="text-sm text-[var(--c-ink-soft)] leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coming soon modules */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-ink-soft)] text-center mb-3">
            The full vision
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--c-ink)] text-center mb-10">
            More intelligence, coming soon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComingSoonCard
              icon="🪞"
              title="Body Type Analysis"
              description="Discover your body shape and the silhouettes that celebrate it. Respectful, inclusive, and actionable."
            />
            <ComingSoonCard
              icon="📐"
              title="Fit Intelligence"
              description="Per-brand sizing and fit guidance. Never order the wrong size again."
            />
            <ComingSoonCard
              icon="🌿"
              title="Fabric & Climate Guide"
              description="Tropical-smart fabric picks for Singapore and SEA. Linen, Tencel, and more, matched to the humidity."
            />
            <ComingSoonCard
              icon="🛍️"
              title="Product Picks"
              description="Curated pieces filtered to your exact palette and season from local and global retailers."
            />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-[var(--c-ink)]">
          <div className="max-w-3xl mx-auto px-6 py-16 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to find your colours?
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-sm">
              Free, private, and takes less than a minute. Your photo is analysed and immediately discarded. Never stored. Never trained on.
            </p>
            <Link href="/analyze">
              <Button className="bg-white! text-[var(--c-ink)]! hover:bg-[var(--c-sand)]!" size="lg">
                Start free analysis
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--c-line)] py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--c-ink-soft)]">
          <span className="font-display font-semibold tracking-wide lowercase text-[var(--c-ink)]">chromatique</span>
          <span>© 2026 · Your photo is analysed and immediately discarded. Never stored, never trained on.</span>
        </div>
      </footer>
    </div>
  );
}

function ColourWheelArt() {
  const quadrants = [
    { colors: ["#F4C06A", "#E8956D", "#F7E0B5", "#D4A857"] },
    { colors: ["#9BBDD4", "#C4A0B8", "#B8D4D8", "#8BA8C0"] },
    { colors: ["#C2683B", "#8B4A2B", "#D4934A", "#7E5A3A"] },
    { colors: ["#4A6B8A", "#8B3A5C", "#2C3E6B", "#6B4A7E"] },
  ];

  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64">
      <div className="w-full h-full rounded-full overflow-hidden border-4 border-[var(--c-line)] shadow-xl grid grid-cols-2 grid-rows-2">
        {quadrants.map(({ colors }, qi) => (
          <div key={qi} className="grid grid-cols-2 grid-rows-2">
            {colors.map((c, ci) => (
              <div key={ci} style={{ backgroundColor: c }} />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--c-bg)] border-4 border-[var(--c-line)] flex flex-col items-center justify-center shadow text-center leading-tight">
          <span className="font-display text-sm font-bold text-[var(--c-ink)]">12</span>
          <span className="font-display text-[9px] font-semibold text-[var(--c-ink-soft)] uppercase tracking-wide">seasons</span>
        </div>
      </div>
    </div>
  );
}
