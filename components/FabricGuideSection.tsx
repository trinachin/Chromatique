"use client";

import { useEffect, useMemo, useState } from "react";
import { Leaf, Download, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FABRICS, type Fabric } from "@/lib/fabrics";
import { getFabricBackground } from "@/lib/fabric-swatches";
import {
  recommendFabrics,
  occasionFabrics,
  type Climate,
  type Lifestyle,
  type SkinSensitivity,
} from "@/lib/fabric-rules";
import type { ColourResult } from "@/lib/types";
import { generateFabricCard } from "@/lib/fabric-card";

interface Props {
  result: ColourResult;
}

const CLIMATE_OPTIONS: Climate[] = ["Tropical", "Mixed", "Temperate", "Cold"];
const LIFESTYLE_OPTIONS: Lifestyle[] = ["Office indoor", "Outdoor commute", "Active", "Mixed"];
const SKIN_OPTIONS: SkinSensitivity[] = ["Normal", "Sensitive"];

// Storage keys for persisting the picks
const LS_CLIMATE = "chromatique_fabric_climate";
const LS_LIFESTYLE = "chromatique_fabric_lifestyle";
const LS_SKIN = "chromatique_fabric_skin";

export function FabricGuideSection({ result }: Props) {
  const [climate, setClimate] = useState<Climate>("Tropical");
  const [lifestyle, setLifestyle] = useState<Lifestyle>("Mixed");
  const [skin, setSkin] = useState<SkinSensitivity>("Normal");
  const [encyclopediaOpen, setEncyclopediaOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hydrate from localStorage on first render
  useEffect(() => {
    const c = localStorage.getItem(LS_CLIMATE);
    const l = localStorage.getItem(LS_LIFESTYLE);
    const s = localStorage.getItem(LS_SKIN);
    if (c && CLIMATE_OPTIONS.includes(c as Climate)) setClimate(c as Climate);
    if (l && LIFESTYLE_OPTIONS.includes(l as Lifestyle)) setLifestyle(l as Lifestyle);
    if (s && SKIN_OPTIONS.includes(s as SkinSensitivity)) setSkin(s as SkinSensitivity);
  }, []);

  // Persist on change
  useEffect(() => { localStorage.setItem(LS_CLIMATE, climate); }, [climate]);
  useEffect(() => { localStorage.setItem(LS_LIFESTYLE, lifestyle); }, [lifestyle]);
  useEffect(() => { localStorage.setItem(LS_SKIN, skin); }, [skin]);

  const ctx = useMemo(
    () => ({ climate, lifestyle, skin, seasonFamily: result.seasonFamily }),
    [climate, lifestyle, skin, result.seasonFamily]
  );

  const recommendation = useMemo(() => recommendFabrics(ctx), [ctx]);
  const occasions = useMemo(() => occasionFabrics(ctx), [ctx]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const blob = await generateFabricCard(result, ctx, recommendation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chromatique-fabric-${climate.toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Could not generate fabric card", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--c-success)]"><Leaf className="w-4 h-4" /></span>
        <h2 className="font-display text-xl font-semibold text-[var(--c-ink)]">
          Fabric &amp; climate guide
        </h2>
      </div>

      {/* Pickers */}
      <div className="space-y-3">
        <PickerRow label="Climate" options={CLIMATE_OPTIONS} value={climate} onChange={(v) => setClimate(v as Climate)} />
        <PickerRow label="Lifestyle" options={LIFESTYLE_OPTIONS} value={lifestyle} onChange={(v) => setLifestyle(v as Lifestyle)} />
        <PickerRow label="Skin" options={SKIN_OPTIONS} value={skin} onChange={(v) => setSkin(v as SkinSensitivity)} />
      </div>

      {/* Why these work */}
      <div className="flex items-start gap-2 text-sm text-[var(--c-ink)] leading-relaxed bg-[var(--c-sand)]/60 rounded-xl p-3">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--c-accent)]" />
        <p>{recommendation.whyItWorks}</p>
      </div>

      {/* Your wardrobe anchors */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-3">
          Your wardrobe anchors
        </p>
        <div className="flex flex-wrap gap-4">
          {recommendation.anchors.map((f) => (
            <FabricChip key={f.slug} fabric={f} />
          ))}
        </div>
      </div>

      {/* Skip these */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-3">
          Skip these
        </p>
        <div className="flex flex-wrap gap-4">
          {recommendation.skip.map((f) => (
            <FabricChip key={f.slug} fabric={f} muted />
          ))}
        </div>
      </div>

      {/* By occasion */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-3">
          By occasion
        </p>
        <div className="space-y-4">
          {occasions.map((occ) => (
            <OccasionRow key={occ.occasion} title={occ.occasion} description={occ.description} fabricSlugs={occ.fabricSlugs} />
          ))}
        </div>
      </div>

      {/* Shopping notes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-2">
          Shopping notes
        </p>
        <ul className="space-y-1.5 text-sm text-[var(--c-ink-soft)] leading-relaxed">
          {(climate === "Tropical" ? TROPICAL_SHOPPING_TIPS : GENERAL_SHOPPING_TIPS).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-[var(--c-accent)] mt-0.5">·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Care in your climate */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-2">
          Care in your climate
        </p>
        <ul className="space-y-1.5 text-sm text-[var(--c-ink-soft)] leading-relaxed">
          {(climate === "Tropical" ? TROPICAL_CARE_TIPS : GENERAL_CARE_TIPS).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-[var(--c-accent)] mt-0.5">·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Encyclopedia */}
      <div className="pt-2 border-t border-[var(--c-line)]">
        <button
          type="button"
          onClick={() => setEncyclopediaOpen((v) => !v)}
          className="w-full flex items-center justify-between text-left py-2"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)]">
            Fabric encyclopedia ({FABRICS.length})
          </span>
          {encyclopediaOpen
            ? <ChevronUp className="w-4 h-4 text-[var(--c-ink-soft)]" />
            : <ChevronDown className="w-4 h-4 text-[var(--c-ink-soft)]" />}
        </button>
        {encyclopediaOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {FABRICS.map((f) => (
              <EncyclopediaCard key={f.slug} fabric={f} />
            ))}
          </div>
        )}
      </div>

      {/* Save card */}
      <div className="pt-2 border-t border-[var(--c-line)]">
        <Button
          onClick={handleSave}
          disabled={saving}
          variant="primary"
          size="md"
          className="w-full gap-2"
        >
          <Download className="w-4 h-4" />
          {saving ? "Creating your card…" : saved ? "Saved!" : "Save my fabric card"}
        </Button>
        <p className="text-[11px] text-[var(--c-ink-soft)]/70 text-center mt-2">
          A shareable infographic with your anchors, skips, and care notes.
        </p>
      </div>
    </section>
  );
}

// ─── small subcomponents ─────────────────────────────────────────────────

function PickerRow<T extends string>({
  label, options, value, onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-ink-soft)] w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              value === opt
                ? "bg-[var(--c-accent)] text-white border-[var(--c-accent)]"
                : "bg-[var(--c-bg)] text-[var(--c-ink-soft)] border-[var(--c-line)] hover:border-[var(--c-accent)]/50"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FabricChip({ fabric, muted = false }: { fabric: Fabric; muted?: boolean }) {
  const background = getFabricBackground(fabric.slug, fabric.category);
  return (
    <div className="flex flex-col items-center gap-1.5 w-20 flex-shrink-0">
      <div
        aria-hidden="true"
        className="w-16 h-16 rounded-xl border border-black/10 shadow-sm relative overflow-hidden"
        style={{ background }}
      >
        {muted && (
          <span className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.18)_4px,rgba(0,0,0,0.18)_5px)] pointer-events-none" />
        )}
      </div>
      <span className={cn(
        "text-xs font-medium text-center leading-tight",
        muted ? "text-[var(--c-ink-soft)]" : "text-[var(--c-ink)]"
      )}>
        {fabric.name}
      </span>
    </div>
  );
}

function OccasionRow({ title, description, fabricSlugs }: { title: string; description: string; fabricSlugs: string[] }) {
  const fabrics = fabricSlugs.map((slug) => FABRICS.find((f) => f.slug === slug)).filter(Boolean) as Fabric[];
  if (!fabrics.length) return null;
  return (
    <div className="bg-[var(--c-bg)] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[var(--c-ink)]">{title}</p>
      </div>
      <p className="text-[11px] text-[var(--c-ink-soft)] mb-3 leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-3">
        {fabrics.map((f) => (
          <div key={f.slug} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md border border-black/10 flex-shrink-0"
              style={{ background: getFabricBackground(f.slug, f.category) }}
              aria-hidden="true"
            />
            <span className="text-xs text-[var(--c-ink)]">{f.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EncyclopediaCard({ fabric }: { fabric: Fabric }) {
  return (
    <div className="flex gap-3 bg-[var(--c-bg)] rounded-xl p-3">
      <div
        className="w-12 h-12 rounded-md border border-black/10 flex-shrink-0"
        style={{ background: getFabricBackground(fabric.slug, fabric.category) }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--c-ink)]">{fabric.name}</p>
        {fabric.alternativeNames && (
          <p className="text-[10px] text-[var(--c-ink-soft)]/70 italic">
            also: {fabric.alternativeNames.join(", ")}
          </p>
        )}
        <p className="text-[11px] text-[var(--c-ink-soft)] mt-1 leading-snug">{fabric.why}</p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <PropPill label={`Breathes ${fabric.breathability}/5`} />
          <PropPill label={`Wicks ${fabric.wicking}/5`} />
          {fabric.tropicalFit >= 4 && <PropPill label="Tropical-ready" tone="success" />}
          {fabric.tropicalFit <= 2 && <PropPill label="Not for tropics" tone="warn" />}
        </div>
      </div>
    </div>
  );
}

function PropPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warn" }) {
  return (
    <span className={cn(
      "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
      tone === "success" && "bg-[var(--c-success)]/15 text-[var(--c-success)]",
      tone === "warn" && "bg-red-50 text-red-700",
      tone === "neutral" && "bg-[var(--c-sand)] text-[var(--c-ink-soft)]"
    )}>
      {label}
    </span>
  );
}

// ─── static copy by climate ──────────────────────────────────────────────

const TROPICAL_SHOPPING_TIPS = [
  "On labels, look for the word 'linen', 'Tencel' or 'Lyocell', or '100% cotton'.",
  "Tencel is often sold as 'Lyocell', they're the same fibre.",
  "Cotton-linen blends are easier to wear than pure linen if you hate wrinkles.",
  "Avoid 100% polyester or acrylic for daily wear, your skin will not thank you.",
  "Performance synthetics (Dri-FIT, Coolmax) are fine for sport, not for tea with friends.",
  "OEKO-TEX Standard 100 on the label means no harmful chemical residues.",
];

const GENERAL_SHOPPING_TIPS = [
  "Read the fibre composition label before checking the price tag.",
  "Higher natural-fibre percentage usually means better breath and longevity.",
  "OEKO-TEX Standard 100 means no harmful chemical residues.",
  "Blends with 5-10% elastane are fine, more becomes plasticky.",
];

const TROPICAL_CARE_TIPS = [
  "Air-dry, don't tumble. Tropical sun does the work for free and preserves fibres.",
  "Never store cotton or linen in plastic during the monsoon, mildew sets in fast.",
  "Linen wrinkles freely, that's the look. Ironing slightly damp gets the crispest finish.",
  "Wash silk by hand or on cold gentle, sweat residue stains quickly in heat.",
  "Use mild detergent. Bleach breaks down natural fibres fast in humidity.",
];

const GENERAL_CARE_TIPS = [
  "Wash in cold water when possible to preserve fibre length.",
  "Air-dry natural fibres to extend their life.",
  "Use mild detergent, harsh formulations break down most fibres.",
  "Store clean and dry to avoid moths and mildew.",
];
