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
}

export interface AdjustablePreviewHandle {
  /** Returns a JPEG dataURL of the visible (panned/zoomed) region, max 1024px. */
  getAdjustedDataUrl: () => Promise<string>;
  /** Reset pan/zoom to defaults. */
  reset: () => void;
}

const MIN_SCALE = 1;     // image always covers container, no letterboxing
const MAX_SCALE = 4;     // max 4x zoom

export const AdjustablePreview = forwardRef<AdjustablePreviewHandle, AdjustablePreviewProps>(
  function AdjustablePreview({ src, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [imgLoaded, setImgLoaded] = useState(false);

    // Track active pointers (mouse + touch unified via Pointer Events)
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const gestureStartRef = useRef<{
      transform: typeof transform;
      pointerCount: number;
      // single-pointer drag baseline
      startX: number;
      startY: number;
      // two-pointer pinch baseline
      startDist: number;
      startMid: { x: number; y: number };
    } | null>(null);

    /** Clamp transform so the image always fully covers the container. */
    const clampTransform = useCallback((t: typeof transform): typeof transform => {
      const container = containerRef.current;
      const img = imgRef.current;
      if (!container || !img) return t;
      const W = container.clientWidth;
      const H = container.clientHeight;
      const iW = img.naturalWidth;
      const iH = img.naturalHeight;
      if (!W || !H || !iW || !iH) return t;

      // Compute the "object-cover" base size of the image inside the container
      const baseScale = Math.max(W / iW, H / iH);
      const drawnW = iW * baseScale * t.scale;
      const drawnH = iH * baseScale * t.scale;

      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale));

      // Center-anchored translation bounds: image must cover container
      const maxX = Math.max(0, (drawnW - W) / 2);
      const maxY = Math.max(0, (drawnH - H) / 2);

      return {
        scale,
        x: Math.min(maxX, Math.max(-maxX, t.x)),
        y: Math.min(maxY, Math.max(-maxY, t.y)),
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
        // Pinch zoom
        const newDist = distance(ptrs[0], ptrs[1]);
        const ratio = newDist / Math.max(1, g.startDist);
        const newScale = g.transform.scale * ratio;
        const newMid = midpoint(ptrs[0], ptrs[1]);
        const dx = newMid.x - g.startMid.x;
        const dy = newMid.y - g.startMid.y;
        setTransform(clampTransform({
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
        // Re-baseline the remaining pointers so the next move doesn't jump
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

    // Desktop: mousewheel = zoom
    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY;
      const factor = delta > 0 ? 0.9 : 1.1;
      setTransform((t) => clampTransform({ ...t, scale: t.scale * factor }));
    };

    // Re-clamp when image finishes loading
    useEffect(() => {
      if (imgLoaded) setTransform((t) => clampTransform(t));
    }, [imgLoaded, clampTransform]);

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

      // Center of image in container coords
      const imgCenterX = W / 2 + transform.x;
      const imgCenterY = H / 2 + transform.y;

      // Compute the source rect (in natural-image coords) that corresponds
      // to the visible container area
      const sx = (W / 2 - imgCenterX) / totalScale + iW / 2;
      const sy = (H / 2 - imgCenterY) / totalScale + iH / 2;
      const sW = W / totalScale;
      const sH = H / totalScale;

      // Target canvas size — cap at 1024 longest edge to stay under Claude vision limit
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

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sW, sH, 0, 0, cw, ch);
      return canvas.toDataURL("image/jpeg", 0.85);
    }, [transform]);

    useImperativeHandle(ref, () => ({
      getAdjustedDataUrl,
      reset: () => setTransform({ x: 0, y: 0, scale: 1 }),
    }), [getAdjustedDataUrl]);

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative bg-black rounded-2xl overflow-hidden select-none",
          "aspect-[4/5] w-full",
          className
        )}
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
            // Cover-fit the image base-size to the container, then apply user transform
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "center center",
            transition: gestureStartRef.current ? "none" : "transform 80ms ease-out",
          }}
        />
      </div>
    );
  }
);
