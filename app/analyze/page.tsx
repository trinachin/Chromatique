"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CameraModal } from "@/components/CameraModal";
import { Upload, Camera, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "upload" | "analysing" | "error";

export default function AnalyzePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect desktop on mount, desktop "Take a photo" opens the webcam modal,
  // mobile uses the native input[capture] which triggers the system camera app.
  useEffect(() => {
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isTouchPrimary = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setIsDesktop(!isMobileUA && !isTouchPrimary);
  }, []);

  const STEPS = [
    "Reading skin undertone…",
    "Mapping colour depth…",
    "Calibrating contrast…",
    "Matching your season…",
    "Building your palette…",
  ];

  // Resize image client-side to keep under Claude vision's ~5MB limit
  // Max 1024px on longest edge, JPEG q=0.85 → typically 100-400 KB
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_EDGE = 1024;
          let { width, height } = img;
          if (width > height && width > MAX_EDGE) {
            height = Math.round((height * MAX_EDGE) / width);
            width = MAX_EDGE;
          } else if (height > MAX_EDGE) {
            width = Math.round((width * MAX_EDGE) / height);
            height = MAX_EDGE;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("Could not read image"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (JPG, PNG, WebP, HEIC).");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg("Photo too large, please use a file under 25 MB.");
      return;
    }
    try {
      const resized = await resizeImage(file);
      setPreview(resized);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Could not read the photo. Please try a different file.");
    }
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
                  Tap to upload or take a photo
                </p>
                <p className="text-xs text-[var(--c-ink-soft)]">JPG, PNG, WebP · Max 15 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Default file input, no capture attribute, so iOS shows action sheet
            (Take Photo / Choose from Library / Browse Files) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onInputChange}
          className="sr-only"
        />

        {/* Separate camera-only input for the "Take a photo" button */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={onInputChange}
          className="sr-only"
        />

        {/* Take a photo, desktop opens webcam modal, mobile uses native input[capture] */}
        {!preview && (
          <button
            onClick={() => {
              if (isDesktop) {
                setShowCameraModal(true);
              } else {
                cameraInputRef.current?.click();
              }
            }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--c-line)] text-sm text-[var(--c-ink-soft)] hover:bg-[var(--c-sand)] transition-colors"
          >
            <Camera className="w-4 h-4" />
            Take a photo
          </button>
        )}

        {/* Desktop webcam capture modal */}
        <CameraModal
          open={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={(dataUrl) => {
            setPreview(dataUrl);
            setErrorMsg("");
          }}
        />

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
              "Remove glasses and heavy makeup",
              "Make sure your face fills most of the frame",
              "Upload photos with no filters",
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
