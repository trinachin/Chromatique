"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Leaf, Download, ChevronDown, ChevronUp, Info,
  ShoppingBag, ExternalLink, Thermometer, HeartPulse, Sun, Briefcase, AlertTriangle, Sparkles,
} from "lucide-react";
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
  type BodyThermal,
} from "@/lib/fabric-rules";
import type { ColourResult } from "@/lib/types";
import { generateFabricCard } from "@/lib/fabric-card";
import { buildShopLinks } from "@/lib/fabric-shop-links";

interface Props {
  /** Optional: when present, the fabric card gets the season family accent + subline. */
  result?: ColourResult;
}

const CLIMATE_OPTIONS: Climate[] = ["Tropical", "Mixed", "Temperate", "Cold"];
const LIFESTYLE_OPTIONS: Lifestyle[] = ["Office indoor", "Outdoor commute", "Active", "Mixed"];
const SKIN_OPTIONS: SkinSensitivity[] = ["Normal", "Sensitive", "Dry"];
const BODY_THERMAL_OPTIONS: BodyThermal[] = ["Hot-prone", "Balanced", "Cold-prone"];

// Storage keys for persisting the picks
const LS_CLIMATE = "chromatique_fabric_climate";
const LS_LIFESTYLE = "chromatique_fabric_lifestyle";
const LS_SKIN = "chromatique_fabric_skin";
const LS_THERMAL = "chromatique_fabric_thermal";

export function FabricGuideSection({ result }: Props) {
  const [climate, setClimate] = useState<Climate>("Tropical");
  const [lifestyle, setLifestyle] = useState<Lifestyle>("Mixed");
  const [skin, setSkin] = useState<SkinSensitivity>("Normal");
  const [bodyThermal, setBodyThermal] = useState<BodyThermal>("Balanced");
  const [encyclopediaOpen, setEncyclopediaOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [occasionsOpen, setOccasionsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Hydrate from localStorage on first render
  useEffect(() => {
    const c = localStorage.getItem(LS_CLIMATE);
    const l = localStorage.getItem(LS_LIFESTYLE);
    const s = localStorage.getItem(LS_SKIN);
    const t = localStorage.getItem(LS_THERMAL);
    if (c && CLIMATE_OPTIONS.includes(c as Climate)) setClimate(c as Climate);
    if (l && LIFESTYLE_OPTIONS.includes(l as Lifestyle)) setLifestyle(l as Lifestyle);
    if (s && SKIN_OPTIONS.includes(s as SkinSensitivity)) setSkin(s as SkinSensitivity);
    // Migration: anyone with the legacy "Eczema" value gets bumped to "Sensitive"
    // (the closer match — eczema users tend to react to the same chemical
    // finishes and friction triggers that the Sensitive weights target).
    else if (s === "Eczema") setSkin("Sensitive");
    if (t && BODY_THERMAL_OPTIONS.includes(t as BodyThermal)) setBodyThermal(t as BodyThermal);
    // Migration: legacy "Runs hot" / "Runs cold" / "Average" → new labels
    else if (t === "Runs hot") setBodyThermal("Hot-prone");
    else if (t === "Runs cold") setBodyThermal("Cold-prone");
    else if (t === "Average") setBodyThermal("Balanced");
  }, []);

  // Persist on change
  useEffect(() => { localStorage.setItem(LS_CLIMATE, climate); }, [climate]);
  useEffect(() => { localStorage.setItem(LS_LIFESTYLE, lifestyle); }, [lifestyle]);
  useEffect(() => { localStorage.setItem(LS_SKIN, skin); }, [skin]);
  useEffect(() => { localStorage.setItem(LS_THERMAL, bodyThermal); }, [bodyThermal]);

  const ctx = useMemo(
    () => ({ climate, lifestyle, skin, bodyThermal, seasonFamily: result?.seasonFamily }),
    [climate, lifestyle, skin, bodyThermal, result?.seasonFamily]
  );

  const recommendation = useMemo(() => recommendFabrics(ctx), [ctx]);
  const occasions = useMemo(() => occasionFabrics(ctx), [ctx]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const blob = await generateFabricCard(result ?? null, ctx, recommendation);
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
    <div className="space-y-6">
      {/* ─── STEP 1: Tell us about you ──────────────────────────────────── */}
      <section
        id="about-you"
        className="bg-[var(--c-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--c-line)] space-y-4 scroll-mt-20"
      >
        <StepHeader number="01" icon={<HeartPulse className="w-4 h-4" />} title="Tell us about you" />
        <div className="space-y-3">
          <PickerRow
            label="Climate"
            icon={<Sun className="w-3.5 h-3.5" />}
            options={CLIMATE_OPTIONS}
            value={climate}
            onChange={(v) => setClimate(v as Climate)}
            helper="Where you spend most of your day"
          />
          <PickerRow
            label="Body"
            icon={<Thermometer className="w-3.5 h-3.5" />}
            options={BODY_THERMAL_OPTIONS}
            value={bodyThermal}
            onChange={(v) => setBodyThermal(v as BodyThermal)}
            helper="Do you tend to overheat or feel cold easily?"
            highlight
          />
          <PickerRow
            label="Skin"
            icon={<HeartPulse className="w-3.5 h-3.5" />}
            options={SKIN_OPTIONS}
            value={skin}
            onChange={(v) => setSkin(v as SkinSensitivity)}
            helper="Sensitive includes eczema/reactive; Dry favours moisture-retaining smooth fibres"
            highlight
          />
          <PickerRow
            label="Day"
            icon={<Briefcase className="w-3.5 h-3.5" />}
            options={LIFESTYLE_OPTIONS}
            value={lifestyle}
            onChange={(v) => setLifestyle(v as Lifestyle)}
            helper="Your typical day shape"
          />
        </div>
      </section>

      {/* ─── STEP 2: What works for YOU ─────────────────────────────────── */}
      <section
        id="your-fabrics"
        className="bg-[var(--c-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--c-line)] space-y-5 scroll-mt-20"
      >
        <StepHeader number="02" icon={<Leaf className="w-4 h-4" />} title="What works for you" />

        {/* Personal reason chips */}
        {recommendation.personalReasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recommendation.personalReasons.map((r) => (
              <span key={r} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[var(--c-success)]/10 text-[var(--c-success)] border border-[var(--c-success)]/20">
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Why */}
        <div className="flex items-start gap-2 text-sm text-[var(--c-ink)] leading-relaxed bg-[var(--c-sand)]/60 rounded-xl p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--c-accent)]" />
          <p>{recommendation.whyItWorks}</p>
        </div>

        {/* Anchors */}
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

        {/* Skip */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-3">
            Skip these
          </p>
          <div className="flex flex-wrap gap-4">
            {recommendation.skip.map((f) => (
              <FabricChip key={f.slug} fabric={f} muted />
            ))}
          </div>
          {/* Red-flag note: only show when the user has actually flagged a skin
              concern. Otherwise it's noise on a default page load. */}
          {(skin === "Sensitive" || skin === "Dry") &&
            recommendation.skip.find((f) => f.redFlag) && (
              <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 rounded-lg p-2.5 border border-red-200">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>{recommendation.skip.find((f) => f.redFlag)?.redFlag}</span>
              </div>
            )}
        </div>

        {/* By occasion (collapsible) */}
        <div className="border-t border-[var(--c-line)] pt-3">
          <button
            type="button"
            onClick={() => setOccasionsOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)]">
              By occasion
            </span>
            {occasionsOpen
              ? <ChevronUp className="w-4 h-4 text-[var(--c-ink-soft)]" />
              : <ChevronDown className="w-4 h-4 text-[var(--c-ink-soft)]" />}
          </button>
          {occasionsOpen && (
            <div className="space-y-3 mt-3">
              {occasions.map((occ) => (
                <OccasionRow
                  key={occ.occasion}
                  title={occ.occasion}
                  description={occ.description}
                  fabricSlugs={occ.fabricSlugs}
                />
              ))}
            </div>
          )}
        </div>

        {/* Where to shop (collapsible) */}
        <div className="border-t border-[var(--c-line)] pt-3">
          <button
            type="button"
            onClick={() => setShopOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              Where to shop your anchors
            </span>
            {shopOpen
              ? <ChevronUp className="w-4 h-4 text-[var(--c-ink-soft)]" />
              : <ChevronDown className="w-4 h-4 text-[var(--c-ink-soft)]" />}
          </button>
          {shopOpen && (
            <div className="space-y-2.5 mt-3">
              <p className="text-[11px] text-[var(--c-ink-soft)]/80 leading-relaxed">
                Live searches on each retailer for your fabric. No affiliate, no curation, no inventory tracking.
              </p>
              {recommendation.anchors.slice(0, 5).map((f) => (
                <ShopRow key={f.slug} fabric={f} lifestyle={lifestyle} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── STEP 3: Learn — encyclopedia + tips ───────────────────────── */}
      <section
        id="learn"
        className="bg-[var(--c-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--c-line)] space-y-5 scroll-mt-20"
      >
        <StepHeader number="03" icon={<Sparkles className="w-4 h-4" />} title="Learn the rules" />

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

        {/* Care */}
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
        <div className="border-t border-[var(--c-line)] pt-3">
          <button
            type="button"
            onClick={() => setEncyclopediaOpen((v) => !v)}
            className="w-full flex items-center justify-between text-left"
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
                <EncyclopediaCard
                  key={f.slug}
                  fabric={f}
                  skin={skin}
                  climate={climate}
                  bodyThermal={bodyThermal}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Save card ──────────────────────────────────────────────── */}
      <section className="bg-[var(--c-surface)] rounded-2xl p-5 sm:p-6 border border-[var(--c-line)]">
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
      </section>
    </div>
  );
}

// ─── small subcomponents ─────────────────────────────────────────────────

function StepHeader({ number, icon, title }: { number: string; icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-display text-2xl font-bold text-[var(--c-line)] leading-none">{number}</span>
      <div className="flex items-center gap-2">
        <span className="text-[var(--c-accent)]">{icon}</span>
        <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--c-ink)]">{title}</h2>
      </div>
    </div>
  );
}

function PickerRow<T extends string>({
  label, icon, options, value, onChange, helper, highlight = false,
}: {
  label: string;
  icon?: React.ReactNode;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  helper?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-ink-soft)] flex items-center gap-1">
          {icon}
          {label}
          {highlight && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-1.5 py-0.5 rounded">
              Personalised
            </span>
          )}
        </span>
      </div>
      {helper && (
        <p className="text-[11px] text-[var(--c-ink-soft)]/70 mb-2">{helper}</p>
      )}
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

function EncyclopediaCard({ fabric, skin, climate, bodyThermal }: {
  fabric: Fabric;
  skin: SkinSensitivity;
  climate: Climate;
  bodyThermal: BodyThermal;
}) {
  // Show metadata pills, but reserve red-toned "risk" / "not for X" pills for
  // the specific user contexts that make them relevant. The educational
  // success pills are always fine, they're how users learn what each fabric
  // is good for.
  const showSensitivePill = skin === "Sensitive" || skin === "Dry";
  const showTropicalRisk = climate === "Tropical";
  const showHotPronePill = bodyThermal === "Hot-prone" || bodyThermal === "Balanced";
  const showColdPronePill = bodyThermal === "Cold-prone" || bodyThermal === "Balanced";

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
          {fabric.eczemaFriendly >= 5 && <PropPill label="Smooth for sensitive skin" tone="success" />}
          {showSensitivePill && fabric.eczemaFriendly <= 2 && (
            <PropPill label="Skin irritant risk" tone="warn" />
          )}
          {skin === "Dry" && fabric.dryFriendly >= 5 && <PropPill label="Moisture-retaining" tone="success" />}
          {skin === "Dry" && fabric.dryFriendly <= 2 && <PropPill label="Strips moisture" tone="warn" />}
          {showHotPronePill && fabric.thermalFit.hotRunner >= 5 && (
            <PropPill label="Great if you overheat" tone="success" />
          )}
          {showColdPronePill && fabric.thermalFit.coldRunner >= 5 && (
            <PropPill label="Great if you feel cold" tone="success" />
          )}
          {fabric.tropicalFit >= 4 && <PropPill label="Tropical-ready" tone="success" />}
          {showTropicalRisk && fabric.tropicalFit <= 2 && <PropPill label="Not for tropics" tone="warn" />}
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

function ShopRow({ fabric, lifestyle }: { fabric: Fabric; lifestyle: Lifestyle }) {
  const links = buildShopLinks(fabric.slug, lifestyle);
  return (
    <div className="bg-[var(--c-bg)] rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-6 h-6 rounded-md border border-black/10 flex-shrink-0"
          style={{ background: getFabricBackground(fabric.slug, fabric.category) }}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-[var(--c-ink)]">{fabric.name}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {links.map((l) => (
          <a
            key={l.retailerId}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--c-line)] bg-[var(--c-surface)] text-[var(--c-ink-soft)] hover:border-[var(--c-accent)]/50 hover:text-[var(--c-ink)] transition-colors"
          >
            {l.retailerName}
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── static copy by climate ──────────────────────────────────────────────

const TROPICAL_SHOPPING_TIPS = [
  "On labels, look for the word 'linen', 'Tencel' or 'Lyocell', or '100% cotton'.",
  "Tencel is often sold as 'Lyocell', they're the same fibre.",
  "Cotton-linen blends are easier to wear than pure linen if you hate wrinkles.",
  "180-220 GSM is the sweet spot for daily-wear cotton tees.",
  "OEKO-TEX Standard 100 on the label means no harmful chemical residues, friendlier for sensitive skin.",
  "Avoid 100% polyester or acrylic for daily wear, your skin will not thank you.",
  "Performance synthetics (Dri-FIT, Coolmax) are fine for sport, not for tea with friends.",
];

const GENERAL_SHOPPING_TIPS = [
  "Read the fibre composition label before checking the price tag.",
  "Higher natural-fibre percentage usually means better breath and longevity.",
  "OEKO-TEX Standard 100 means no harmful chemical residues.",
  "Blends with 2-8% elastane are smart stretch; more than 15% bags out fast.",
  "100% does not mean better. 100% linen is great. 100% acrylic is not.",
];

const TROPICAL_CARE_TIPS = [
  "Air-dry, don't tumble. Tropical sun does the work for free and preserves fibres.",
  "Never store cotton or linen in plastic during the monsoon, mildew sets in fast.",
  "Linen wrinkles freely, that's the look. Ironing slightly damp gets the crispest finish.",
  "Wash silk by hand or on cold gentle, sweat residue stains quickly in heat.",
  "Use mild detergent. Bleach breaks down natural fibres fast in humidity.",
  "Keep closet humidity below 60% with silica gel or a small dehumidifier.",
];

const GENERAL_CARE_TIPS = [
  "Wash in cold water when possible to preserve fibre length.",
  "Air-dry natural fibres to extend their life.",
  "Use mild detergent, harsh formulations break down most fibres.",
  "Store clean and dry to avoid moths and mildew.",
];
