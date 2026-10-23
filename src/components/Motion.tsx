"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Revela o bloco ao entrar na tela. Sem JS (ou acima da dobra) o conteúdo já aparece normalmente. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: ReactNode; delay?: number; className?: string; as?: "div" | "li" | "section" | "article" }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;
    el.classList.add("reveal-hidden");
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { el.classList.remove("reveal-hidden"); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const T = Tag as any;
  return <T ref={ref} className={`reveal ${className}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>{children}</T>;
}

/** Número que "sobe" até o valor final (usado na nota do exemplo). */
export function CountUp({ to, decimals = 1, duration = 1400, className = "" }: { to: number; decimals?: number; duration?: number; className?: string }) {
  const [v, setV] = useState(to);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setV(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span className={className}>{v.toFixed(decimals).replace(".", ",")}</span>;
}

/** Selo decorativo (inspirado nos adesivos do layout de referência). */
export function Sticker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" aria-hidden className={`float ${className}`} style={{ "--r": "-8deg" } as React.CSSProperties}>
      <circle cx="40" cy="40" r="34" fill="#fff" stroke="#1c1c21" strokeWidth="3" />
      <circle cx="29" cy="34" r="4" fill="#1c1c21" /><circle cx="51" cy="34" r="4" fill="#1c1c21" />
      <path d="M24 48 Q40 64 56 48" fill="none" stroke="#1c1c21" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
