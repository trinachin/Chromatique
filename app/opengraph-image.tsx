import { ImageResponse } from "next/og";
import { PUBLIC_HOST } from "@/lib/site-config";

// Static Open Graph image rendered at build time. Next.js auto-injects:
//   <meta property="og:image" content="/opengraph-image" />
// which makes link previews on WhatsApp / Telegram / iMessage / X / Slack
// pull this branded card instead of nothing.

export const alt = "Chromatique. Discover your colour season.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#F6F1EA";        // warm paper
const INK = "#1F1B16";       // near-black
const INK_SOFT = "#6B6258";
const ACCENT = "#C2683B";    // terracotta
const LINE = "#E3D9CC";

// Mixed palette spanning all 4 season families
const SWATCHES = [
  "#F4C06A", // spring honey
  "#E8956D", // spring coral
  "#C2683B", // autumn terracotta
  "#9C3B2A", // autumn brick
  "#A04362", // summer berry
  "#9BBDD4", // summer powder
  "#8FA6D9", // summer periwinkle
  "#4A6B8A", // winter navy
  "#1F7A60", // winter emerald
  "#5A2A8C", // winter purple
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
          padding: "72px 80px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Soft radial accent in top-right corner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 600,
            height: 600,
            background: `radial-gradient(circle at top right, ${ACCENT}22, transparent 70%)`,
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: ACCENT,
            marginBottom: 36,
          }}
        >
          <div style={{ width: 48, height: 2, background: ACCENT }} />
          AI Personal Colour Analysis
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 148,
            fontWeight: 700,
            fontStyle: "italic",
            letterSpacing: -2,
            color: INK,
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Chromatique
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 44,
            fontWeight: 400,
            color: INK_SOFT,
            lineHeight: 1.25,
            maxWidth: 880,
            marginBottom: 64,
          }}
        >
          <span>Discover the colours</span>
          <span style={{ color: ACCENT, fontStyle: "italic" }}>made for you.</span>
        </div>

        {/* Spacer pushes the swatch row to the bottom */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Swatch row + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `1px solid ${LINE}`,
            paddingTop: 32,
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {SWATCHES.map((hex, i) => (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: hex,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 24,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
              color: INK_SOFT,
              display: "flex",
              alignItems: "center",
            }}
          >
            {PUBLIC_HOST}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
