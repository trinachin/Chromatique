import { cn } from "@/lib/utils";

interface ComingSoonCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export function ComingSoonCard({ icon, title, description, className }: ComingSoonCardProps) {
  return (
    <div
      className={cn(
        "relative bg-[var(--c-surface)] border border-[var(--c-line)] rounded-2xl p-6 overflow-hidden",
        className
      )}
    >
      <div className="absolute top-3 right-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--c-ink-soft)] bg-[var(--c-sand)] px-2 py-1 rounded-full">
          Soon
        </span>
      </div>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display text-lg font-semibold text-[var(--c-ink)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--c-ink-soft)] leading-relaxed">{description}</p>
    </div>
  );
}
