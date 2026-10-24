"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Revela o bloco ao entrar na tela. Sem JS (ou acima da dobra) o conteúdo já aparece normalmente. */
export function Reveal({ children, delay = 0, className = "", id, as: Tag = "div" }: { children: ReactNode; id?: string; delay?: number; className?: string; as?: "div" | "li" | "section" | "article" }) {
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
  return <T ref={ref} id={id} className={`reveal ${className}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>{children}</T>;
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
      <circle cx="40" cy="40" r="34" fill="#fff" stroke="#0b0f0d" strokeWidth="3" />
      <circle cx="29" cy="34" r="4" fill="#0b0f0d" /><circle cx="51" cy="34" r="4" fill="#0b0f0d" />
      <path d="M24 48 Q40 64 56 48" fill="none" stroke="#0b0f0d" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Barra de progresso de rolagem e sombra do cabeçalho ao rolar. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, h.scrollTop / max) : 0})`;
      h.classList.toggle("scrolled", h.scrollTop > 8);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1"><div ref={bar} className="h-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} /></div>;
}

/** Título com palavras entrando em sequência. */
export function Words({ text, className = "", start = 0 }: { text: string; className?: string; start?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className={`inline-block overflow-hidden align-bottom ${className}`}>
          <span className="word-in inline-block" style={{ "--d": `${start + i * 70}ms` } as React.CSSProperties}>{w}&nbsp;</span>
        </span>
      ))}
    </>
  );
}

/** Faixa de itens em movimento contínuo e suave. */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="marquee-row flex shrink-0 items-center gap-10 pr-10">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-10 whitespace-nowrap text-sm font-bold uppercase tracking-widest text-white/80">
          {t}<span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return <div className="marquee overflow-hidden py-4">{<div className="flex w-max">{row(false)}{row(true)}</div>}</div>;
}
