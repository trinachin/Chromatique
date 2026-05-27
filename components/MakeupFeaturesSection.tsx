"use client";

import { useState } from "react";
import { Sparkles, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlushDiagram, EyelinerDiagram } from "@/components/FeatureDiagram";
import {
  EYELINER_TECHNIQUE,
  EYESHADOW_TECHNIQUE,
  BLUSH_TECHNIQUE,
  CONTOUR_TECHNIQUE,
  LIP_TECHNIQUE,
  BROW_TECHNIQUE,
  NOSE_TECHNIQUE,
  BROW_DESCRIPTOR,
} from "@/lib/feature-techniques";
import type { FacialFeatures, ColourResult } from "@/lib/types";
import { generateMakeupCard } from "@/lib/makeup-card";

interface Props {
  features: FacialFeatures;
  result: ColourResult;
}

export function MakeupFeaturesSection({ features, result }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const blob = await generateMakeupCard(result, features);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chromatique-makeup-${result.season.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Could not generate makeup card", err);
    } finally {
      setSaving(false);
    }
  };

  const undertoneLabels: Record<string, string> = {
    warm: "Warm", cool: "Cool", neutral: "Neutral", olive: "Olive",
  };

  return (
    <section className="bg-[var(--c-surface)] rounded-2xl p-6 border border-[var(--c-line)] space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[var(--c-accent)]"><Sparkles className="w-4 h-4" /></span>
        <h2 className="font-display text-xl font-semibold text-[var(--c-ink)]">
          Makeup &amp; features
        </h2>
      </div>

      {/* Adult notice (per ADD_RESEARCH age-gating) */}
      <div className="flex items-start gap-2 text-xs text-[var(--c-ink-soft)] bg-[var(--c-sand)]/60 rounded-xl p-3 leading-relaxed">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <p>
          Adult guidance. We don&apos;t recommend full-face makeup for users under 13.
          Teens (13-17): light look only (tinted balm, mascara, brow gel, cream blush).
        </p>
      </div>

      {/* Notes — Claude-generated, framed as appreciation */}
      {features.notes && (
        <p className="text-sm text-[var(--c-ink)] leading-relaxed italic">
          &ldquo;{features.notes}&rdquo;
        </p>
      )}

      {/* Your features grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-3">
          Your features
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FeaturePill label="Eyes" value={features.eyeShape} />
          <FeaturePill label="Nose" value={features.noseType} />
          <FeaturePill label="Lips" value={features.lipShape} />
          <FeaturePill label="Face" value={features.faceShape} />
          <FeaturePill label="Brows" value={features.browShape} />
          <FeaturePill label="Undertone" value={undertoneLabels[features.refinedUndertone] ?? features.refinedUndertone} />
          <FeaturePill label="Skin" value={features.skinTexture} />
        </div>
        <p className="text-[11px] text-[var(--c-ink-soft)]/70 mt-2 italic">
          {BROW_DESCRIPTOR[features.browShape]}
        </p>
      </div>

      {/* Eye technique with diagram */}
      <TechniqueRow
        label="Eyeliner for your eyes"
        technique={EYELINER_TECHNIQUE[features.eyeShape]}
        diagram={<EyelinerDiagram eyeShape={features.eyeShape} className="w-full h-auto max-w-[140px]" />}
      />

      {/* Eyeshadow */}
      <TechniqueRow
        label="Eyeshadow placement"
        technique={EYESHADOW_TECHNIQUE[features.eyeShape]}
      />

      {/* Blush with face diagram */}
      <TechniqueRow
        label="Blush placement"
        technique={BLUSH_TECHNIQUE[features.faceShape]}
        diagram={<BlushDiagram faceShape={features.faceShape} className="w-full h-auto max-w-[110px]" />}
      />

      {/* Contour */}
      <TechniqueRow
        label="Contour for your face shape"
        technique={CONTOUR_TECHNIQUE[features.faceShape]}
      />

      {/* Brow */}
      <TechniqueRow
        label="Brow shape"
        technique={BROW_TECHNIQUE[features.faceShape]}
      />

      {/* Nose */}
      <TechniqueRow
        label="Nose enhancement"
        technique={NOSE_TECHNIQUE[features.noseType]}
      />

      {/* Lips */}
      <TechniqueRow
        label="Lip technique"
        technique={LIP_TECHNIQUE[features.lipShape]}
      />

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
          {saving ? "Creating your card..." : saved ? "Saved!" : "Save my makeup card"}
        </Button>
        <p className="text-[11px] text-[var(--c-ink-soft)]/70 text-center mt-2">
          A shareable infographic with all your features and techniques.
        </p>
      </div>
    </section>
  );
}

function FeaturePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--c-bg)] rounded-xl p-3 border border-[var(--c-line)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--c-ink-soft)] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[var(--c-ink)] leading-tight">{value}</p>
    </div>
  );
}

function TechniqueRow({
  label,
  technique,
  diagram,
}: {
  label: string;
  technique: { name: string; description: string };
  diagram?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 items-start">
      {diagram && <div className="flex-shrink-0">{diagram}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[var(--c-ink-soft)] mb-1">{label}</p>
        <p className="text-sm font-semibold text-[var(--c-ink)] mb-1">{technique.name}</p>
        <p className="text-xs text-[var(--c-ink-soft)] leading-relaxed">{technique.description}</p>
      </div>
    </div>
  );
}
