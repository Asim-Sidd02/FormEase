/* Server-safe style helpers (no "use client") — importable from server and client components. */

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
export type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-strong shadow-sm shadow-black/10",
  secondary: "bg-surface-2 text-fg hover:bg-surface-3",
  outline: "border border-line-strong bg-surface text-fg hover:bg-surface-2 hover:border-subtle",
  ghost: "text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  accent: "bg-accent text-[#2a1800] hover:brightness-105",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-lg",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none select-none",
    variants[variant],
    sizes[size],
    extra,
  );
}

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] text-fg placeholder:text-subtle transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";
