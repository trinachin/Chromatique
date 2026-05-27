"use client";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-[var(--c-accent)] text-white hover:bg-[var(--c-accent-deep)] active:scale-[0.98] shadow-sm":
              variant === "primary",
            "bg-[var(--c-sand)] text-[var(--c-ink)] hover:bg-[var(--c-line)] active:scale-[0.98]":
              variant === "secondary",
            "bg-transparent text-[var(--c-ink-soft)] hover:text-[var(--c-ink)] hover:bg-[var(--c-sand)]":
              variant === "ghost",
          },
          {
            "text-sm px-4 py-2":    size === "sm",
            "text-base px-6 py-3":  size === "md",
            "text-lg px-8 py-4":    size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
