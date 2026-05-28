"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

interface AdjustablePreviewProps {
  src: string;
  className?: string;
  /** Show the rotation/tilt slider below the preview. Default true. */
  enableRotation?: boolean;
}

export interface AdjustablePreviewHandle {
  /** Returns a JPEG dataURL of the visible (panned/zoomed/rotated) region, max 1024px. */
  getAdjustedDataUrl: () => Promise<string>;
  /** Reset pan/zoom/rotation to defaults. */
  reset: () => void;
}

const MIN_USER_SCALE = 1;     // user can't zoom below "fully cover" baseline
const MAX_USER_SCALE = 4;     // max 4x zoom
const MAX_ROTATION = 45;      // ±45° tilt range

interface Transform {
  x: number;
  y: number;
  scale: number;      // user-applied zoom multiplier (on top of cover-fit base)
  rotation: number;   // degrees, positive = clockwise
}

/**
 * Compute the minimum scale multiplier required to keep an axis-aligned
 * rectangle (the container) covered when the image is rotated by `angle`.
 *
 * For a container of width W and height H, after rotation θ the image
 * (originally W×H at cover-fit baseline) must grow enough that its rotated
 * bounding box still covers the container. The required factor is:
 *   max( (W|cos θ| + H|sin θ|) / W,
 *        (W|sin θ| + H|cos θ|) / H )
 */
function minScaleForRotation(angleDeg: number, w: number, h: number): number {
  const rad = (Math.abs(angleDeg) * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return Math.max((w * c + h * s) / w, (w * s + h * c) / h);
}

export const AdjustablePreview = forwardRef<AdjustablePreviewHandle, AdjustablePreviewProps>(
  function AdjustablePreview({ src, className, enableRotation = true }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1, rotation: 0 });
    const [imgLoaded, setImgLoaded] = useState(false);

    // Pointer + gesture tracking (mouse + touch unified via Pointer Events)
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const gestureStartRef = useRef<{
      transform: Transform;
      pointerCount: number;
      startX: number;
      startY: number;
      startDist: number;
      startMid: { x: number; y: number };
    } | null>(null);

    /** Clamp transform so the image always fully covers the container,
     *  taking the current rotation into account. */
    const clampTransform = useCallback((t: Transform): Transform => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return t;
      const W = container.clientWidth;
      const H = container.clientHeight;
      const iW = img.naturalWidth;
      const iH = img.naturalHeight;
      if (!W || !H || !iW || !iH) return t;

      const baseScale = Math.max(W / iW, H / iH);
      const rotationMin = minScaleForRotation(t.rotation, W, H);
      // Effective minimum user-scale to keep cover at this rotation
      const effectiveMin = Math.max(MIN_USER_SCALE, rotationMin);
      const scale = Math.min(MAX_USER_SCALE, Math.max(effectiveMin, t.scale));

      const drawnW = iW * baseScale * scale;
      const drawnH = iH * baseScale * scale;

      // After rotation, the cover-area shrinks slightly. Tighten pan bounds.
      const rad = (Math.abs(t.rotation) * Math.PI) / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      // Maximum translation that still keeps rotated image covering container
      const maxX = Math.max(0, (drawnW * c - H * s - W) / 2 + (drawnW - W) / 2);
      const maxY = Math.max(0, (drawnH * c - W * s - H) / 2 + (drawnH - H) / 2);
      // Use the simpler (drawn - container)/2 as upper bound; rotation case
      // is conservatively clipped further by the calculation above.
      const finalMaxX = Math.max(0, Math.min(maxX, (drawnW - W) / 2));
      const finalMaxY = Math.max(0, Math.min(maxY, (drawnH - H) / 2));

      const rotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, t.rotation));

      return {
        scale,
        rotation,
        x: Math.min(finalMaxX, Math.max(-finalMaxX, t.x)),
        y: Math.min(finalMaxY, Math.max(-finalMaxY, t.y)),
      };
    }, []);

    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(b.x - a.x, b.y - a.y);

    const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      container.setPointerCapture(e.pointerId);

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const ptrs = Array.from(pointersRef.current.values());
      if (ptrs.length === 1) {
        gestureStartRef.current = {
          transform,
          pointerCount: 1,
          startX: ptrs[0].x,
          startY: ptrs[0].y,
          startDist: 0,
          startMid: { x: 0, y: 0 },
        };
      } else if (ptrs.length === 2) {
        gestureStartRef.current = {
          transform,
          pointerCount: 2,
          startX: 0,
          startY: 0,
          startDist: distance(ptrs[0], ptrs[1]),
          startMid: midpoint(ptrs[0], ptrs[1]),
        };
      }
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const g = gestureStartRef.current;
      if (!g) return;

      const ptrs = Array.from(pointersRef.current.values());

      if (g.pointerCount === 1 && ptrs.length === 1) {
        // Pan
        const dx = ptrs[0].x - g.startX;
        const dy = ptrs[0].y - g.startY;
        setTransform(clampTransform({
          ...g.transform,
          x: g.transform.x + dx,
          y: g.transform.y + dy,
        }));
      } else if (g.pointerCount === 2 && ptrs.length === 2) {
        // Pinch zoom (rotation stays under user slider control)
        const newDist = distance(ptrs[0], ptrs[1]);
        const ratio = newDist / Math.max(1, g.startDist);
        const newScale = g.transform.scale * ratio;
        const newMid = midpoint(ptrs[0], ptrs[1]);
        const dx = newMid.x - g.startMid.x;
        const dy = newMid.y - g.startMid.y;
        setTransform(clampTransform({
          ...g.transform,
          x: g.transform.x + dx,
          y: g.transform.y + dy,
          scale: newScale,
        }));
      }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size === 0) {
        gestureStartRef.current = null;
      } else {
        const ptrs = Array.from(pointersRef.current.values());
        if (ptrs.length === 1) {
          gestureStartRef.current = {
            transform,
            pointerCount: 1,
            startX: ptrs[0].x,
            startY: ptrs[0].y,
            startDist: 0,
            startMid: { x: 0, y: 0 },
          };
        }
      }
    };

    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY;
      const factor = delta > 0 ? 0.9 : 1.1;
      setTransform((t) => clampTransform({ ...t, scale: t.scale * factor }));
    };

    // Re-clamp when image finishes loading (uses container dims that may not
    // have been valid before)
    useEffect(() => {
      if (imgLoaded) setTransform((t) => clampTransform(t));
    }, [imgLoaded, clampTransform]);

    const onRotationChange = (next: number) => {
      setTransform((t) => clampTransform({ ...t, rotation: next }));
    };

    const getAdjustedDataUrl = useCallback(async (): Promise<string> => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) throw new Error("Preview not ready");

      const W = container.clientWidth;
      const H = container.clientHeight;
      const iW = img.naturalWidth;
      const iH = img.naturalHeight;
      const baseScale = Math.max(W / iW, H / iH);
      const totalScale = baseScale * transform.scale;
      const drawnW = iW * totalScale;
      const drawnH = iH * totalScale;

      // Output canvas matches container, capped at 1024 longest edge
      const MAX_EDGE = 1024;
      let cw = W;
      let ch = H;
      if (W > H && W > MAX_EDGE) {
        ch = Math.round((H * MAX_EDGE) / W);
        cw = MAX_EDGE;
      } else if (H > MAX_EDGE) {
        cw = Math.round((W * MAX_EDGE) / H);
        ch = MAX_EDGE;
      }

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Black background covers any (clipped) corner area
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);

      // Map container coords → canvas coords
      const sX = cw / W;
      const sY = ch / H;

      // Build transform: translate to image center, rotate, draw centered.
      // The image's centre in container coords is (W/2 + transform.x, H/2 + transform.y).
      const cxCanvas = (W / 2 + transform.x) * sX;
      const cyCanvas = (H / 2 + transform.y) * sY;
      const rad = (transform.rotation * Math.PI) / 180;

      ctx.save();
      ctx.translate(cxCanvas, cyCanvas);
      ctx.rotate(rad);
      // Draw image centered at the (translated, rotated) origin
      const dW = drawnW * sX;
      const dH = drawnH * sY;
      ctx.drawImage(img, -dW / 2, -dH / 2, dW, dH);
      ctx.restore();

      return canvas.toDataURL("image/jpeg", 0.85);
    }, [transform]);

    useImperativeHandle(ref, () => ({
      getAdjustedDataUrl,
      reset: () => setTransform({ x: 0, y: 0, scale: 1, rotation: 0 }),
    }), [getAdjustedDataUrl]);

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div
          ref={containerRef}
          className="relative bg-black rounded-2xl overflow-hidden select-none aspect-[4/5] w-full"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Your selfie"
            onLoad={() => setImgLoaded(true)}
            draggable={false}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none w-auto h-auto object-cover pointer-events-none"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
              transformOrigin: "center center",
              transition: gestureStartRef.current ? "none" : "transform 80ms ease-out",
            }}
          />
        </div>

        {enableRotation && (
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-ink-soft)] w-10">
              Tilt
            </span>
            <input
              type="range"
              min={-MAX_ROTATION}
              max={MAX_ROTATION}
              step={1}
              value={transform.rotation}
              onChange={(e) => onRotationChange(Number(e.target.value))}
              aria-label="Tilt photo"
              className="flex-1 accent-[var(--c-accent)] h-6"
            />
            <button
              type="button"
              onClick={() => onRotationChange(0)}
              className="text-[10px] font-semibold uppercase tracking-wider text-[var(--c-ink-soft)] hover:text-[var(--c-ink)] w-10 text-right"
              aria-label="Reset tilt"
            >
              {transform.rotation === 0 ? "0°" : "Reset"}
            </button>
          </div>
        )}
      </div>
    );
  }
);
