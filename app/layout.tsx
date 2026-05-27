import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chromatique-trina1.vercel.app"),
  title: "Chromatique · Discover Your Colour Season",
  description:
    "AI-powered personal colour analysis. Upload a selfie and discover your unique colour season, palette, and styling guidance in seconds.",
  openGraph: {
    title: "Chromatique · Discover Your Colour Season",
    description: "Upload a selfie → get your colour season, palette, and styling guidance powered by AI.",
    type: "website",
    siteName: "Chromatique",
    locale: "en_SG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chromatique · Discover Your Colour Season",
    description: "Upload a selfie → get your colour season, palette, and styling guidance powered by AI.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F6F1EA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
