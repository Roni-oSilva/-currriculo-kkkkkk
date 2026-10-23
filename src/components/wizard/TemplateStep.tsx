"use client";

import { useRef, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { ACCENT_COLORS, SECTION_LABELS, type ResumeDesign, type SectionKey, type TemplateId } from "@/lib/resume/schema";
import { TEMPLATE_LIST, getTemplate } from "@/lib/resume/templates";
import { CheckField } from "./fields";

export function TemplateStep({ design, onDesign, resumeId, hasPhoto, photoUrl, onPhoto, enabledTemplates }: {
  design: ResumeDesign; onDesign: (d: ResumeDesign) => void; resumeId: string; hasPhoto: boolean; photoUrl: string | null;
  onPhoto: (path: string, url: string | null) => void; enabledTemplates: string[];
}) {
  const t = getTemplate(design.template);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (id: TemplateId) => {
    const nt = getTemplate(id);
    onDesign({ ...design, template: id, accent: nt.defaultAccent, sectionOrder: [...nt.defaultOrder], showPhoto: nt.supportsPhoto ? design.showPhoto : false });
  };
  const move = (key: SectionKey, d: number) => {
    const order = [...design.sectionOrder];
    const i = order.indexOf(key), j = i + d;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    onDesign({ ...design, sectionOrder: order });
  };
  const toggle = (key: SectionKey) => {
    const h = design.hiddenSections.includes(key);
    onDesign({ ...design, hiddenSections: h ? design.hiddenSections.filter((k) => k !== key) : [...design.hiddenSections, key] });
  };

  async function upload(file: File) {
    setUploading(true); setErr(null);
    try {
      const fd = new FormData(); fd.append("photo", file);
      const res = await fetch(`/api/resumes/${resumeId}/photo`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha no envio");
      onPhoto(json.photoPath, json.photoUrl);
    } catch (e) { setErr((e as Error).message); } finally { setUploading(false); }
  }
  async function removePhoto() {
    const res = await fetch(`/api/resumes/${resumeId}/photo`, { method: "DELETE" });
    if (res.ok) { onPhoto("", null); onDesign({ ...design, showPhoto: false }); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-lg font-extrabold">Modelo</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TEMPLATE_LIST.filter((x) => enabledTemplates.includes(x.id)).map((x) => {
            const selected = x.id === design.template;
            return (
              <li key={x.id}>
                <button type="button" onClick={() => pick(x.id)} aria-pressed={selected}
                  className={`h-full w-full rounded-2xl p-4 text-left ring-2 transition ${selected ? "bg-chip/60 ring-brand" : "bg-white ring-zinc-200 hover:ring-brand"}`}>
                  <span className="flex flex-wrap items-center gap-2 font-extrabold">{x.name}{x.recommendedByHr ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Preferido por RH</span> : null}</span>
                  <span className="mt-1 block text-sm text-muted">{x.description}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-muted">{t.atsNote}</p>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-extrabold">Cor de destaque</h3>
        <div role="radiogroup" aria-label="Cor de destaque" className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={design.accent === c.id} aria-label={c.label} title={c.label}
              onClick={() => onDesign({ ...design, accent: c.id })} style={{ backgroundColor: c.hex }}
              className={`h-12 w-12 rounded-full ring-offset-2 ${design.accent === c.id ? "ring-4 ring-ink" : "ring-1 ring-zinc-300"}`} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-extrabold">Foto</h3>
        {!t.supportsPhoto ? <Notice tone="info">Este modelo não usa foto (ideal para ATS).</Notice> : (
          <>
            <Notice tone="warn">Dica de RH: evite foto, a menos que a vaga exija. Currículos sem foto são lidos com mais facilidade por ATS e evitam vieses.</Notice>
            <div className="flex flex-wrap items-center gap-4">
              {photoUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photoUrl} alt="Foto de perfil enviada" className="h-20 w-20 rounded-full object-cover" /> : null}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="photo-input"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
              <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()} className="!min-h-11 text-sm">{uploading ? "Enviando…" : hasPhoto ? "Trocar foto" : "Enviar foto (opcional)"}</Button>
              {hasPhoto ? <Button variant="ghost" onClick={removePhoto} className="!min-h-11 text-sm">Remover foto</Button> : null}
            </div>
            <p className="text-sm text-muted">JPG, PNG ou WebP, até 2 MB, mínimo 100×100 px. Guardamos a foto em armazenamento privado.</p>
            {err ? <Notice tone="error">{err}</Notice> : null}
            <CheckField label="Mostrar foto no currículo" checked={design.showPhoto && hasPhoto} onChange={(v) => onDesign({ ...design, showPhoto: v })} />
          </>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-lg font-extrabold">Ordem das seções</h3>
        <p className="mb-2 text-sm text-muted">Recomendado pelo RH: resumo → experiência → formação → habilidades e idiomas. Seções vazias não aparecem.</p>
        <ol className="space-y-2">
          {design.sectionOrder.map((k, i) => {
            const hidden = design.hiddenSections.includes(k);
            return (
              <li key={k} className="flex items-center justify-between gap-2 rounded-xl bg-white p-2 pl-4 ring-1 ring-zinc-200">
                <span className={`font-bold ${hidden ? "text-zinc-400 line-through" : ""}`}>{SECTION_LABELS[k]}</span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(k, -1)} disabled={i === 0} aria-label={`Subir ${SECTION_LABELS[k]}`} className="min-h-11 min-w-11 rounded-full ring-1 ring-zinc-300 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => move(k, 1)} disabled={i === design.sectionOrder.length - 1} aria-label={`Descer ${SECTION_LABELS[k]}`} className="min-h-11 min-w-11 rounded-full ring-1 ring-zinc-300 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => toggle(k)} className="min-h-11 rounded-full px-3 text-sm font-bold ring-1 ring-zinc-300">{hidden ? "Mostrar" : "Ocultar"}</button>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
