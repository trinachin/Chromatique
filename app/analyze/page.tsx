"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "upload" | "analysing" | "error";

export default function AnalyzePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);

  const STEPS = [
    "Reading skin undertone…",
    "Mapping colour depth…",
    "Calibrating contrast…",
    "Matching your season…",
    "Building your palette…",
  ];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Photo too large — please use a file under 15 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const analyse = async () => {
    if (!preview) return;
    setStage("analysing");
    setAnalysisStep(0);

    // Animate through steps
    const stepInterval = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1800);

    try {
      const [, rest] = preview.split(",");
      const mediaType = preview.split(";")[0].split(":")[1];
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: rest, mediaType }),
      });
      clearInterval(stepInterval);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Analysis failed");
      }
      const result = await res.json();
      sessionStorage.setItem("chromatique_result", JSON.stringify(result));
      router.push("/result");
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  };

  if (stage === "analysing") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <AnalysingAnimation />
          <p className="font-display text-2xl font-semibold text-[var(--c-ink)] mt-8 mb-3">
            Analysing your colours…
          </p>
          <p className="text-sm text-[var(--c-ink-soft)] h-5 transition-all duration-500">
            {STEPS[analysisStep]}
          </p>
          <p className="mt-6 text-xs text-[var(--c-ink-soft)]/60 max-w-xs">
            Your photo is processed securely and discarded immediately after analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-[var(--c-ink)] mb-2">
            Upload your selfie
          </h1>
          <p className="text-sm text-[var(--c-ink-soft)]">
            For the best result: natural light, no sunglasses, no heavy filters.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden",
            dragOver
              ? "border-[var(--c-accent)] bg-[var(--c-accent)]/5"
              : preview
              ? "border-[var(--c-line)]"
              : "border-[var(--c-line)] hover:border-[var(--c-accent)]/50 hover:bg-[var(--c-sand)]/30"
          )}
          style={{ minHeight: 280 }}
          onClick={() => !preview && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Your selfie"
                className="w-full max-h-80 object-cover rounded-2xl"
              />
              <button
                onClick={(e) => { e.stopPropagation(); setPreview(null); }}
                className="absolute top-3 right-3 bg-[var(--c-ink)]/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[var(--c-ink)] transition-colors"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--c-sand)] flex items-center justify-center">
                <Upload className="w-6 h-6 text-[var(--c-accent)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--c-ink)] mb-1">
                  Drag & drop or tap to upload
                </p>
                <p className="text-xs text-[var(--c-ink-soft)]">JPG, PNG, WebP · Max 15 MB</p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={onInputChange}
          className="sr-only"
        />

        {/* Camera button on mobile */}
        {!preview && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--c-line)] text-sm text-[var(--c-ink-soft)] hover:bg-[var(--c-sand)] transition-colors"
          >
            <Camera className="w-4 h-4" />
            Take a photo
          </button>
        )}

        {/* Error */}
        {(errorMsg || stage === "error") && (
          <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Couldn't complete analysis</p>
              <p className="mt-0.5 text-red-600">{errorMsg}</p>
              <button
                onClick={() => { setStage("upload"); setErrorMsg(""); }}
                className="mt-2 underline text-xs"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-line)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-ink-soft)] mb-3">
            Tips for the best result
          </p>
          <ul className="space-y-1.5 text-sm text-[var(--c-ink-soft)]">
            {[
              "Face the light source (window or open sky)",
              "Remove sunglasses, heavy makeup, or filters",
              "Make sure your face fills most of the frame",
              "Works beautifully on all skin tones",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="text-[var(--c-accent)] mt-0.5">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Analyse button */}
        {preview && (
          <Button
            onClick={analyse}
            size="lg"
            className="w-full mt-6"
          >
            Analyse my colours →
          </Button>
        )}

        <p className="mt-4 text-center text-xs text-[var(--c-ink-soft)]/60">
          Your photo is analysed and immediately discarded. Never stored. Never trained on.
        </p>
      </main>
    </div>
  );
}

function AnalysingAnimation() {
  const seasonColors = [
    "#F4C06A", "#E8956D", "#C2683B", "#9BBDD4",
    "#8BA8C0", "#4A6B8A", "#C4A0B8", "#6B4A7E",
    "#D4934A", "#5C7A57", "#D4A857", "#8B3A5C",
  ];

  return (
    <div className="relative w-32 h-32">
      <div className="w-full h-full rounded-full border-4 border-[var(--c-line)] grid grid-cols-4 grid-rows-3 overflow-hidden animate-pulse-soft">
        {seasonColors.map((c, i) => (
          <div
            key={i}
            style={{ backgroundColor: c }}
            className="transition-opacity duration-1000"
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-[var(--c-bg)] border-2 border-[var(--c-line)] flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[var(--c-accent)] animate-spin" />
        </div>
      </div>
    </div>
  );
}
