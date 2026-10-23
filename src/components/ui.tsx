import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex select-none min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-bold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-60";
const variants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  light: "bg-white text-brand-dark hover:bg-chip",
  accent: "bg-accent text-navy hover:bg-accent-dark shadow-[0_6px_0_-2px_rgba(12,22,51,.25)]",
  outline: "border-2 border-brand text-brand hover:bg-brand hover:text-white",
  ghost: "text-ink hover:bg-black/5",
  danger: "bg-red-700 text-white hover:bg-red-800",
} as const;
type Variant = keyof typeof variants;

export function btn(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function LinkButton({ variant = "primary", className = "", ...p }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...p} className={btn(variant, className)} />;
}

export function Button({ variant = "primary", className = "", ...p }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" {...p} className={btn(variant, className)} />;
}

export function Marker({ children }: { children: ReactNode }) {
  return <span className="marker"><span className="marker-bg" aria-hidden />{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[28px] bg-paper p-5 shadow-sm sm:p-8 ${className}`}>{children}</div>;
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-xl font-extrabold ${light ? "text-white" : "text-ink"}`} aria-label="Currículo Certo — página inicial">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white" aria-hidden>CV</span>
      Currículo<span className={light ? "text-accent" : "text-brand"}>Certo</span>
    </Link>
  );
}

export const inputCls =
  "block w-full min-h-12 rounded-xl border-2 border-zinc-300 bg-white px-4 py-3 text-base text-ink placeholder:text-zinc-500 focus:border-brand focus:outline-none";

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink">{label}</label>
      {children}
      {hint ? <p className="text-sm text-muted">{hint}</p> : null}
      {error ? <p role="alert" className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: ReactNode }) {
  const tones = {
    info: "bg-chip/60 text-navy",
    warn: "bg-amber-100 text-amber-900",
    error: "bg-red-100 text-red-900",
    ok: "bg-emerald-100 text-emerald-900",
  };
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${tones[tone]}`}>{children}</div>;
}
