// Single source of truth for the public site URL.
//
// When the production domain changes (Vercel subdomain rename, custom domain),
// change PUBLIC_URL here. Every page metadata, OG image, share fallback URL,
// and saveable card footer reads from this constant.
//
// Why a constant and not just process.env.VERCEL_URL:
//   - VERCEL_URL is per-deployment (e.g. chromatique-xyz123.vercel.app), not
//     the canonical production domain users actually see.
//   - For things rendered into images (canvas footers, OG cards) we want a
//     human-friendly URL, not the deployment-specific one.

/** The canonical user-facing domain. No trailing slash. */
export const PUBLIC_URL = "https://chromatique-trina1.vercel.app";

/** Hostname-only form for footer text in saveable cards. */
export const PUBLIC_HOST = PUBLIC_URL.replace(/^https?:\/\//, "");
