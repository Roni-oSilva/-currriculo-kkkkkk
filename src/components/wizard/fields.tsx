"use client";

import { useState, type ReactNode } from "react";
import { Field, inputCls } from "@/components/ui";

export function TextField({ label, value, onChange, hint, type = "text", placeholder, autoComplete, maxLength, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string; type?: string; placeholder?: string; autoComplete?: string; maxLength?: number;
  inputMode?: "text" | "tel" | "email" | "url" | "numeric";
}) {
  const id = `f-${label.replace(/\W+/g, "-")}-${type}`;
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        autoComplete={autoComplete} maxLength={maxLength} inputMode={inputMode} className={inputCls} />
    </Field>
  );
}

export function AreaField({ label, value, onChange, hint, rows = 4, maxLength }: { label: string; value: string; onChange: (v: string) => void; hint?: string; rows?: number; maxLength?: number }) {
  const id = `a-${label.replace(/\W+/g, "-")}`;
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} maxLength={maxLength} className={inputCls} />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  const id = `s-${label.replace(/\W+/g, "-")}`;
  return (
    <Field label={label} htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => <option key={o} value={o}>{o || "Selecione"}</option>)}
      </select>
    </Field>
  );
}

export function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 text-base font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-6 w-6 accent-[var(--color-brand)]" />
      {label}
    </label>
  );
}

const small = "min-h-10 min-w-10 rounded-full bg-white px-3 text-sm font-bold text-ink ring-1 ring-zinc-300 hover:bg-chip disabled:opacity-40";

/** Bloco recolhível para campos menos usados (mantém o formulário curto). */
export function Collapsible({ title, hint, count, children, defaultOpen = false }: { title: string; hint?: string; count?: number; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen || undefined} className="group rounded-2xl bg-white ring-1 ring-zinc-200 open:shadow-sm">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-extrabold">
        <span className="flex flex-wrap items-center gap-2">{title}{count ? <span className="rounded-full bg-chip px-2 py-0.5 text-xs text-navy">{count}</span> : null}{hint ? <span className="text-sm font-semibold text-muted">{hint}</span> : null}</span>
        <span aria-hidden className="text-xl text-brand transition-transform duration-300 group-open:rotate-45">+</span>
      </summary>
      <div className="step-enter space-y-4 px-4 pb-4">{children}</div>
    </details>
  );
}

/** Lista editável em sanfona: só o item mais recente fica aberto. Adicionar, editar, remover e reordenar. */
export function ListEditor<T extends { id: string }>({ items, onChange, newItem, addLabel, itemLabel, children, emptyHint }: {
  items: T[]; onChange: (items: T[]) => void; newItem: () => T; addLabel: string; itemLabel: (it: T, i: number) => string;
  children: (it: T, update: (patch: Partial<T>) => void, i: number) => ReactNode; emptyHint?: string;
}) {
  const move = (i: number, d: number) => {
    const next = [...items];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {items.length === 0 && emptyHint ? <p className="rounded-xl bg-white p-3 text-sm text-muted ring-1 ring-zinc-200">{emptyHint}</p> : null}
      {items.map((it, i) => (
        <details key={it.id} open={i === items.length - 1} className="group rounded-2xl bg-white ring-1 ring-zinc-200 open:shadow-sm">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2">
            <span className="font-extrabold text-brand-dark">{itemLabel(it, i)}</span>
            <span aria-hidden className="text-xl text-brand transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          <div className="step-enter space-y-4 px-4 pb-4">
            {children(it, (patch) => onChange(items.map((x) => (x.id === it.id ? { ...x, ...patch } : x))), i)}
            <div className="flex flex-wrap gap-2 border-t pt-3">
              <button type="button" className={small} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover para cima">Subir</button>
              <button type="button" className={small} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Mover para baixo">Descer</button>
              <button type="button" className={`${small} !text-red-700`} onClick={() => onChange(items.filter((x) => x.id !== it.id))}>Remover</button>
            </div>
          </div>
        </details>
      ))}
      <button type="button" onClick={() => onChange([...items, newItem()])} className="min-h-12 w-full rounded-2xl border-2 border-dashed border-brand px-4 py-2.5 font-extrabold text-brand transition hover:bg-chip/50">
        + {addLabel}
      </button>
    </div>
  );
}

/** Campo de lista de termos: Enter ou vírgula adiciona; toque para remover. */
export function TagInput({ label, values, onChange, hint }: { label: string; values: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const [text, setText] = useState("");
  const commit = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...values, ...parts])].slice(0, 40));
    setText("");
  };
  const id = `t-${label.replace(/\W+/g, "-")}`;
  return (
    <Field label={label} hint={hint ?? "Digite e pressione Enter ou vírgula para adicionar."} htmlFor={id}>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button key={v} type="button" onClick={() => onChange(values.filter((x) => x !== v))}
            className="min-h-10 rounded-full bg-chip px-3 text-sm font-bold text-navy" aria-label={`Remover ${v}`}>{v} ×</button>
        ))}
      </div>
      <input id={id} value={text} onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setText(e.target.value))}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(text); } }} onBlur={() => commit(text)} className={inputCls} />
    </Field>
  );
}
