"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, RotateCcw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    setReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser doesn't support webcam access. Please upload a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not access camera.";
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("no camera")) {
        setError("No camera found. Please upload a photo instead.");
      } else {
        setError("Couldn't start the camera. Please upload a photo instead.");
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      startStream();
    } else {
      stopStream();
      setCapturedDataUrl(null);
      setError(null);
    }
    return () => stopStream();
  }, [open, startStream, stopStream]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    // Resize on capture, max 1024 longest edge for /api/analyze compatibility
    const MAX_EDGE = 1024;
    let cw = w;
    let ch = h;
    if (w > h && w > MAX_EDGE) {
      ch = Math.round((h * MAX_EDGE) / w);
      cw = MAX_EDGE;
    } else if (h > MAX_EDGE) {
      cw = Math.round((w * MAX_EDGE) / h);
      ch = MAX_EDGE;
    }

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the captured image so it matches the (mirrored) live preview
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, cw, ch);

    setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.85));
  }, []);

  const retake = () => {
    setCapturedDataUrl(null);
  };

  const confirm = () => {
    if (capturedDataUrl) {
      onCapture(capturedDataUrl);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--c-ink)]/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Take a photo"
    >
      <div className="bg-[var(--c-bg)] rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-line)]">
          <h2 className="font-display text-lg font-semibold text-[var(--c-ink)]">
            {capturedDataUrl ? "Looks good?" : "Take your photo"}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[var(--c-sand)] flex items-center justify-center text-[var(--c-ink-soft)] hover:text-[var(--c-ink)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative bg-black aspect-square w-full overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center text-white">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
                <p className="text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          ) : capturedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedDataUrl}
              alt="Captured selfie"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  "scale-x-[-1]", // mirror like a selfie camera
                  !ready && "opacity-0"
                )}
              />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                  <span className="animate-pulse-soft">Starting camera…</span>
                </div>
              )}
              {/* Face frame guide */}
              {ready && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-72 sm:w-64 sm:h-80 rounded-[40%] border-2 border-white/40" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-5 flex flex-col gap-3">
          {error ? (
            <Button onClick={onClose} variant="secondary" size="md" className="w-full">
              Close
            </Button>
          ) : capturedDataUrl ? (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={retake} variant="secondary" size="md" className="w-full gap-2">
                <RotateCcw className="w-4 h-4" />
                Retake
              </Button>
              <Button onClick={confirm} size="md" className="w-full gap-2">
                <Check className="w-4 h-4" />
                Use photo
              </Button>
            </div>
          ) : (
            <button
              onClick={capture}
              disabled={!ready}
              aria-label="Capture photo"
              className={cn(
                "mx-auto w-16 h-16 rounded-full border-4 border-[var(--c-accent)] flex items-center justify-center transition-all duration-150",
                ready ? "hover:scale-105 active:scale-95 bg-[var(--c-accent)]/10" : "opacity-40 cursor-not-allowed"
              )}
            >
              <Camera className="w-7 h-7 text-[var(--c-accent)]" />
            </button>
          )}
          {!capturedDataUrl && !error && (
            <p className="text-xs text-[var(--c-ink-soft)] text-center">
              Centre your face inside the oval, then tap the camera button.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
