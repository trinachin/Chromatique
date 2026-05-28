"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { decodeResult } from "@/lib/result-codec";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Public per-result share URL. Decodes the base64url payload, stashes the
 * resulting ColourResult in sessionStorage so /result can render it, then
 * router-replaces to /result.
 */
export default function SharedResultPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const result = decodeResult(id);
    if (!result) {
      setError("This result link is invalid or corrupted. Please ask for a new link.");
      return;
    }
    sessionStorage.setItem("chromatique_result", JSON.stringify(result));
    router.replace("/result");
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--c-bg)]">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-md mx-auto">
        {error ? (
          <>
            <AlertCircle className="w-10 h-10 text-red-600 mb-4" />
            <h1 className="font-display text-2xl font-semibold text-[var(--c-ink)] mb-2">
              We couldn&apos;t load this result
            </h1>
            <p className="text-sm text-[var(--c-ink-soft)] mb-6 leading-relaxed">{error}</p>
            <Link href="/analyze">
              <Button size="md">Start your own analysis</Button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-[var(--c-line)] border-t-[var(--c-accent)] animate-spin mb-4" />
            <p className="text-sm text-[var(--c-ink-soft)]">Loading your colours…</p>
          </>
        )}
      </main>
    </div>
  );
}
