"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { CameraModal } from "@/components/CameraModal";
import { AdjustablePreview, type AdjustablePreviewHandle } from "@/components/AdjustablePreview";
import { AdjustPhotoModal } from "@/components/AdjustPhotoModal";
import { Upload, Camera, X, AlertCircle, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { analyzeImageQuality, type QualityReport } from "@/lib/image-quality";
import { voteResults } from "@/lib/vote-results";
import type { ColourResult } from "@/lib/types";

type Stage =
  | "upload"
  | "analysing"
  | "low_confidence"
  | "collecting_extra"
  | "analysing_extra"
  | "error";

const HIGH_CONFIDENCE_THRESHOLD = 0.7;

export default function AnalyzePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const adjustableRef = useRef<AdjustablePreviewHandle>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [quality, setQuality] = useState<QualityReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [ignoreWarning, setIgnoreWarning] = useState(false);
  // Multi-photo aggregation state
  const [firstResult, setFirstResult] = useState<ColourResult | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<string[]>([]); // dataURLs of photos 2 and 3
  const extraFileInputRef = useRef<HTMLInputElement>(null);
  const extraCameraInputRef = useRef<HTMLInputElement>(null);
  const [showExtraCamera, setShowExtraCamera] = useState(false);
  // Adjust-photo modal state for editing extras (pan/zoom/tilt)
  const [adjustModalIndex, setAdjustModalIndex] = useState<number | null>(null);

  // Desktop "Take a photo" opens the webcam modal; mobile uses the native
  // input[capture] which triggers the system camera app instead.
  useEffect(() => {
    const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isTouchPrimary = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    setIsDesktop(!isMobileUA && !isTouchPrimary);
  }, []);

  // Run quality check whenever a new preview lands
  useEffect(() => {
    if (!preview) {
      setQuality(null);
      setIgnoreWarning(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    analyzeImageQuality(preview)
      .then((report) => {
        if (cancelled) return;
        setQuality(report);
        setIgnoreWarning(false);
      })
      .catch(() => {
        // Quality check failure shouldn't block analysis, just skip warnings
        if (!cancelled) setQuality(null);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preview]);

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
      // Capture the adjusted (panned/zoomed) view if available; otherwise send the
      // original preview as-is. The adjusted version is what the user actually sees
      // inside the oval, so Claude analyses the same framing.
      let imageDataUrl = preview;
      if (adjustableRef.current) {
        try {
          imageDataUrl = await adjustableRef.current.getAdjustedDataUrl();
        } catch {
          // fall through to original preview if cropping fails
        }
      }
      const [, rest] = imageDataUrl.split(",");
      const mediaType = imageDataUrl.split(";")[0].split(":")[1];
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
      const result: ColourResult = await res.json();
      setFirstResult(result);

      if (result.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
        // Confident enough, ship directly
        sessionStorage.setItem("chromatique_result", JSON.stringify(result));
        // Stash the analysed photo so /result can show a small thumbnail + Save.
        // Privacy: this lives only in the user's sessionStorage; never sent to
        // a server, never included in the shared /r/ URL.
        sessionStorage.setItem("chromatique_photo", imageDataUrl);
        router.push("/result");
      } else {
        // Low confidence, offer to take 2 more photos for aggregation
        setStage("low_confidence");
      }
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  };

  /** Submit photos 2 + 3 in parallel, vote across all 3, route to result. */
  const finalAnalyseMulti = async () => {
    if (!firstResult || extraPhotos.length < 1) return;
    setStage("analysing_extra");
    setAnalysisStep(0);
    const stepInterval = setInterval(() => {
      setAnalysisStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1800);

    try {
      const analyseDataUrl = async (dataUrl: string): Promise<ColourResult> => {
        const [, rest] = dataUrl.split(",");
        const mediaType = dataUrl.split(";")[0].split(":")[1];
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: rest, mediaType }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Analysis failed");
        }
        return res.json();
      };

      // Run all available extras in parallel (1 or 2)
      const extras = await Promise.all(extraPhotos.map(analyseDataUrl));

      clearInterval(stepInterval);
      const voted = voteResults([firstResult, ...extras]);
      // Persist agreement metadata too (result page can display "confirmed by 3 photos")
      const enriched = {
        ...voted.result,
        aggregation: {
          inputCount: voted.inputCount,
          agreement: voted.agreement,
        },
      };
      sessionStorage.setItem("chromatique_result", JSON.stringify(enriched));
      // Stash the FIRST photo only (the user's primary capture) for the /result thumbnail.
      // Privacy: never sent to a server, never in the shared /r/ URL.
      if (preview) sessionStorage.setItem("chromatique_photo", preview);
      router.push("/result");
    } catch (err) {
      clearInterval(stepInterval);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  };

  /** Handle extra-photo file selection, resize + push into extraPhotos. */
  const handleExtraFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 25 * 1024 * 1024) return;
    try {
      const resized = await resizeImage(file);
      setExtraPhotos((prev) => (prev.length < 2 ? [...prev, resized] : prev));
    } catch {
      // Quietly skip, user can try again
    }
  }, []);

  const onExtraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExtraFile(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  /** Keep first photo, discard low-confidence aggregation, ship the result. */
  const useFirstAnyway = () => {
    if (!firstResult) return;
    sessionStorage.setItem("chromatique_result", JSON.stringify(firstResult));
    if (preview) sessionStorage.setItem("chromatique_photo", preview);
    router.push("/result");
  };

  if (stage === "analysing" || stage === "analysing_extra") {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
          <AnalysingAnimation />
          <p className="font-display text-2xl font-semibold text-[var(--c-ink)] mt-8 mb-3">
            {stage === "analysing_extra" ? "Cross-checking 3 photos…" : "Analysing your colours…"}
          </p>
          <p className="text-sm text-[var(--c-ink-soft)] h-5 transition-all duration-500">
            {STEPS[analysisStep]}
          </p>
          <p className="mt-6 text-xs text-[var(--c-ink-soft)]/60 max-w-xs">
            Your photos are processed securely and discarded immediately after analysis.
          </p>
        </div>
      </div>
    );
  }

  // Low-confidence first result, offer to take 2 more photos
  if (stage === "low_confidence" && firstResult && preview) {
    const confPct = Math.round(firstResult.confidence * 100);
    return (
      <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-accent)] mb-3">
              Best guess so far
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--c-ink)] mb-2">
              {firstResult.season}
            </h1>
            <p className="text-sm text-[var(--c-ink-soft)]">
              {confPct}% confident. Try 2 more photos for a definitive read.
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Your first selfie"
            className="w-32 h-32 object-cover rounded-2xl mx-auto mb-8 border border-[var(--c-line)]"
          />

          <Button
            onClick={() => {
              setExtraPhotos([]);
              setStage("collecting_extra");
            }}
            size="lg"
            className="w-full mb-3"
          >
            Take 2 more photos →
          </Button>
          <Button
            onClick={useFirstAnyway}
            variant="secondary"
            size="md"
            className="w-full"
          >
            Use this result anyway
          </Button>

          <p className="mt-6 text-center text-xs text-[var(--c-ink-soft)]/70">
            Different angles &amp; lighting help us cross-check the season.
            Best with varied photos (e.g. by a window + a different room).
          </p>
        </main>
      </div>
    );
  }

  // Collecting extra photos (slots 2 + 3)
  if (stage === "collecting_extra" && firstResult && preview) {
    const slots = [preview, extraPhotos[0] ?? null, extraPhotos[1] ?? null];
    const ready = extraPhotos.length >= 1;
    const totalPhotos = 1 + extraPhotos.length;
    return (
      <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--c-ink)] mb-2">
              {!ready
                ? "Add at least 1 more photo"
                : extraPhotos.length === 1
                  ? "Ready when you are"
                  : "Ready to cross-check"}
            </h1>
            <p className="text-sm text-[var(--c-ink-soft)]">
              {!ready
                ? "1 more for a cross-check, 2 more for highest confidence."
                : extraPhotos.length === 1
                  ? `We'll cross-check ${totalPhotos} photos. Add 1 more for highest confidence.`
                  : "We'll analyse all 3 photos and return the consensus."}
            </p>
          </div>

          {/* 3 slots — tap a filled photo (2 or 3) to adjust pan/zoom/tilt */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {slots.map((src, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed",
                  src
                    ? idx === 0
                      ? "border-transparent"
                      : "border-transparent cursor-pointer"
                    : "border-[var(--c-line)] bg-[var(--c-sand)]/40 cursor-pointer hover:border-[var(--c-accent)]"
                )}
                onClick={() => {
                  if (idx === 0) return; // photo 1 is edited inline on the upload step
                  if (src) {
                    // Open adjust modal for filled slots 2 or 3
                    setAdjustModalIndex(idx - 1);
                    return;
                  }
                  // Empty slot, open file picker (mobile) or webcam (desktop)
                  if (isDesktop) {
                    setShowExtraCamera(true);
                  } else {
                    extraFileInputRef.current?.click();
                  }
                }}
              >
                {src ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx > 0 && (
                      <>
                        {/* "Edit" hint overlay on tap-to-adjust slots */}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-[var(--c-ink)]/70 px-2 py-1 rounded-full">
                            Adjust
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExtraPhotos((prev) => prev.filter((_, i) => i !== idx - 1));
                          }}
                          className="absolute top-1.5 right-1.5 bg-[var(--c-ink)]/70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-[var(--c-ink)]"
                          aria-label="Remove this photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--c-ink-soft)]">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Photo {idx + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--c-ink-soft)]/70 mb-6 text-center">
            Tap photos 2 or 3 to adjust pan, zoom, and tilt.
          </p>

          {/* Hidden inputs for extra photos */}
          <input
            ref={extraFileInputRef}
            type="file"
            accept="image/*"
            onChange={onExtraInputChange}
            className="sr-only"
          />
          <input
            ref={extraCameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={onExtraInputChange}
            className="sr-only"
          />

          {/* Mobile: also offer camera */}
          {!isDesktop && extraPhotos.length < 2 && (
            <Button
              onClick={() => extraCameraInputRef.current?.click()}
              variant="secondary"
              size="md"
              className="w-full mb-3 gap-2"
            >
              <Camera className="w-4 h-4" />
              Take a photo
            </Button>
          )}

          <Button
            onClick={finalAnalyseMulti}
            size="lg"
            className="w-full"
            disabled={!ready}
          >
            {ready
              ? `Analyse ${1 + extraPhotos.length} photo${extraPhotos.length === 0 ? "" : "s"} →`
              : "Add at least 1 photo to continue"}
          </Button>

          <button
            onClick={() => setStage("low_confidence")}
            className="mt-4 w-full text-xs text-[var(--c-ink-soft)] underline"
          >
            ← Back
          </button>

          {/* Desktop webcam modal for extras */}
          <CameraModal
            open={showExtraCamera}
            onClose={() => setShowExtraCamera(false)}
            onCapture={(dataUrl) => {
              setExtraPhotos((prev) => (prev.length < 2 ? [...prev, dataUrl] : prev));
            }}
          />

          {/* Adjust pan/zoom/tilt modal for filled photos 2 + 3 */}
          <AdjustPhotoModal
            open={adjustModalIndex !== null}
            src={adjustModalIndex !== null ? extraPhotos[adjustModalIndex] ?? null : null}
            onClose={() => setAdjustModalIndex(null)}
            onSave={(adjusted) => {
              if (adjustModalIndex === null) return;
              setExtraPhotos((prev) => {
                const next = [...prev];
                next[adjustModalIndex] = adjusted;
                return next;
              });
              setAdjustModalIndex(null);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12">
        {/* Feedback chips, pinned to top so issues are visible without scrolling */}
        {(errorMsg || stage === "error") && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
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

        {preview && quality && quality.severity !== "ok" && (
          <div
            className={cn(
              "mb-6 flex items-start gap-3 p-4 rounded-xl border text-sm",
              quality.severity === "block"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-amber-50 border-amber-200 text-amber-800"
            )}
          >
            {quality.severity === "block" ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">
                {quality.severity === "block"
                  ? "Photo can't be analysed"
                  : "Photo quality could be better"}
              </p>
              <ul className="mt-1 space-y-1">
                {quality.issues.map((issue, i) => (
                  <li key={i} className={quality.severity === "block" ? "text-red-700" : "text-amber-700"}>
                    {issue.message}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-4">
                <button
                  onClick={() => setPreview(null)}
                  className="underline text-xs font-medium"
                >
                  Try a different photo
                </button>
                {quality.severity === "warn" && !ignoreWarning && (
                  <button
                    onClick={() => setIgnoreWarning(true)}
                    className="underline text-xs"
                  >
                    Use anyway
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {preview && quality && quality.severity === "ok" && !checking && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-[var(--c-success)]/10 border border-[var(--c-success)]/30 text-[var(--c-success)] text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Photo looks good for analysis
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-bold text-[var(--c-ink)] mb-2">
            Upload your selfie
          </h1>
          <p className="text-sm text-[var(--c-ink-soft)]">
            For the best result: natural light, no glasses, no heavy makeup.
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
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <AdjustablePreview ref={adjustableRef} src={preview} />

              {/* Oval face-frame guide, sits ABOVE the adjustable image (non-interactive) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMid meet" className="h-[85%] w-auto opacity-70">
                  <ellipse
                    cx="50"
                    cy="65"
                    rx="34"
                    ry="48"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeDasharray="3 2"
                    style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.5))" }}
                  />
                </svg>
              </div>

              {/* Hint label */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[var(--c-ink)]/70 text-white text-[11px] font-medium px-3 py-1.5 rounded-full pointer-events-none">
                Drag to align · pinch to zoom
              </div>

              {/* Remove / retake */}
              <button
                onClick={(e) => { e.stopPropagation(); setPreview(null); }}
                className="absolute top-3 right-3 bg-[var(--c-ink)]/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-[var(--c-ink)] transition-colors z-10"
                aria-label="Remove photo and retake"
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
              "Skin conditions don't affect your result. We read your underlying undertone, not surface marks",
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
            className="w-full mt-4"
            disabled={
              checking ||
              quality?.severity === "block" ||
              (quality?.severity === "warn" && !ignoreWarning)
            }
          >
            {checking
              ? "Checking photo…"
              : quality?.severity === "block"
                ? "Photo unusable, try another"
                : "Analyse my colours →"}
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
