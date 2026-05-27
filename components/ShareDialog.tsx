"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Download, Copy, Check, Share2, MessageCircle, Send } from "lucide-react";

// X (formerly Twitter) logo isn't shipped in this lucide-react version
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateShareCard } from "@/lib/share-card";
import type { ColourResult } from "@/lib/types";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  result: ColourResult;
  url: string; // public URL to share
}

export function ShareDialog({ open, onClose, result, url }: ShareDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect native share support
  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setCanNativeShare(true);
    }
  }, []);

  // Generate the card when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGenerating(true);
    setError(null);
    generateShareCard(result)
      .then((b) => {
        if (cancelled) return;
        setBlob(b);
        setImageUrl(URL.createObjectURL(b));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not create share card");
      })
      .finally(() => !cancelled && setGenerating(false));
    return () => {
      cancelled = true;
    };
  }, [open, result]);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const shareText = `My colour season is ${result.season}. Find yours at Chromatique:`;

  const handleNativeShare = useCallback(async () => {
    if (!blob) return;
    const file = new File([blob], `chromatique-${slugify(result.season)}.png`, { type: "image/png" });
    try {
      // Try with image attached first
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My colour season is ${result.season}`,
          text: shareText,
          url,
          files: [file],
        });
        return;
      }
      // Fall back to link-only share
      await navigator.share({ title: `My colour season is ${result.season}`, text: shareText, url });
    } catch (err) {
      // User cancelled the share — not an error worth surfacing
      if ((err as Error)?.name === "AbortError") return;
      setError("Couldn't open the share sheet. Try the buttons below.");
    }
  }, [blob, result.season, shareText, url]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `chromatique-${slugify(result.season)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [imageUrl, result.season]);

  const handleCopyLink = useCallback(async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy. Try selecting the URL.");
    } finally {
      setCopying(false);
    }
  }, [url]);

  if (!open) return null;

  const encodedText = encodeURIComponent(`${shareText} ${url}`);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(shareText);

  const platforms = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedText}`,
      color: "#25D366",
    },
    {
      name: "Telegram",
      icon: Send,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "#0088CC",
    },
    {
      name: "X",
      icon: XLogo,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "#000000",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--c-ink)]/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Share your result"
    >
      <div className="bg-[var(--c-bg)] rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-line)]">
          <h2 className="font-display text-lg font-semibold text-[var(--c-ink)]">
            Share your colours
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
        <div className="p-5 bg-[var(--c-sand)]/40 flex items-center justify-center min-h-[280px]">
          {generating && (
            <div className="text-sm text-[var(--c-ink-soft)] animate-pulse-soft">
              Creating your card…
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 text-center px-4">{error}</div>
          )}
          {imageUrl && !generating && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Your shareable colour card"
              className="max-h-[360px] w-auto rounded-xl shadow-lg"
            />
          )}
        </div>

        {/* Actions */}
        <div className="p-5 flex flex-col gap-3">
          {/* Native share (mobile-first) */}
          {canNativeShare && (
            <Button
              onClick={handleNativeShare}
              disabled={!blob}
              size="md"
              className="w-full gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}

          {/* Platform-specific buttons (great for desktop, also work on mobile) */}
          <div className="grid grid-cols-3 gap-2">
            {platforms.map(({ name, icon: Icon, href, color }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-[var(--c-line)] hover:border-[var(--c-accent)] hover:shadow-sm transition-all text-xs font-medium text-[var(--c-ink)]"
              >
                <Icon className="w-5 h-5" style={{ color }} />
                {name}
              </a>
            ))}
          </div>

          {/* Save + Copy row */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Button
              onClick={handleDownload}
              disabled={!imageUrl}
              variant="secondary"
              size="md"
              className="w-full gap-2"
            >
              <Download className="w-4 h-4" />
              Save image
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              size="md"
              className={cn("w-full gap-2", copied && "bg-[var(--c-success)]/10")}
            >
              {copied ? <Check className="w-4 h-4 text-[var(--c-success)]" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : copying ? "..." : "Copy link"}
            </Button>
          </div>

          <p className="text-xs text-[var(--c-ink-soft)]/70 text-center mt-2">
            For Instagram: save the image, then post it from the app. The share sheet on mobile also has &quot;Add to Story&quot;.
          </p>
        </div>
      </div>
    </div>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
