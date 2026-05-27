import Link from "next/link";

export function Navbar() {
  return (
    <header className="w-full border-b border-[var(--c-line)] bg-[var(--c-bg)]">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide text-[var(--c-ink)] lowercase">
          chromatique
        </Link>
        <nav className="hidden sm:flex gap-6 text-sm text-[var(--c-ink-soft)]">
          <Link href="/#how-it-works" className="hover:text-[var(--c-ink)] transition-colors">How it works</Link>
          <Link href="/analyze" className="hover:text-[var(--c-ink)] transition-colors">Start free</Link>
        </nav>
      </div>
    </header>
  );
}
