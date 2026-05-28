"use client";

import { useRef } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdjustablePreview, type AdjustablePreviewHandle } from "@/components/AdjustablePreview";

interface AdjustPhotoModalProps {
  open: boolean;
  src: string | null;
  /** Returns the user's adjusted (pan/zoom/tilt) version as a dataURL. */
  onSave: (adjustedDataUrl: string) => void;
  onClose: () => void;
}

/**
 * Modal wrapper around AdjustablePreview for editing photos 2 + 3 in the
 * multi-photo flow. Photo 1 uses AdjustablePreview inline on the analyse page;
 * the extras use this modal so the 3-slot grid stays compact.
 */
export function AdjustPhotoModal({ open, src, onSave, onClose }: AdjustPhotoModalProps) {
  const previewRef = useRef<AdjustablePreviewHandle>(null);

  if (!open || !src) return null;

  const handleSave = async () => {
    try {
      const adjusted = await previewRef.current?.getAdjustedDataUrl();
      if (adjusted) onSave(adjusted);
    } catch {
      // Fall back to original if the adjusted capture fails for any reason
      onSave(src);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--c-ink)]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Adjust photo"
    >
      <div className="bg-[var(--c-bg)] rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-line)]">
          <h2 className="font-display text-lg font-semibold text-[var(--c-ink)]">
            Adjust your photo
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[var(--c-sand)] flex items-center justify-center text-[var(--c-ink-soft)] hover:text-[var(--c-ink)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-5 space-y-3">
          <div className="relative">
            <AdjustablePreview ref={previewRef} src={src} enableRotation />

            {/* Oval face-frame overlay matches the upload preview */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg
                viewBox="0 0 100 130"
                preserveAspectRatio="xMidYMid meet"
                className="h-[85%] w-auto opacity-70"
              >
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
          </div>

          <p className="text-[11px] text-[var(--c-ink-soft)] text-center leading-relaxed">
            Drag to pan · pinch to zoom · slide the tilt bar to straighten a tilted face
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 grid grid-cols-2 gap-3">
          <Button onClick={onClose} variant="secondary" size="md" className="w-full">
            Cancel
          </Button>
          <Button onClick={handleSave} size="md" className="w-full gap-2">
            <Check className="w-4 h-4" />
            Use this
          </Button>
        </div>
      </div>
    </div>
  );
}
