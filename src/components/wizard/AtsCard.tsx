"use client";

import { useMemo } from "react";
import { scoreResume } from "@/lib/resume/ats";
import type { ResumeData, ResumeDesign } from "@/lib/resume/schema";
import { getTemplate } from "@/lib/resume/templates";

const ICON = { ok: "✅", warn: "⚠️", bad: "❌" } as const;

/** Nota de 0 a 10 de chance de aceitação (RH/ATS) para o modelo escolhido, com dicas. */
export function AtsCard({ data, design, pageCount }: { data: ResumeData; design: ResumeDesign; pageCount?: number }) {
  const report = useMemo(() => scoreResume(data, design, pageCount), [data, design, pageCount]);
  const t = getTemplate(design.template);
  const color = report.verdict === "alta" ? "bg-emerald-600" : report.verdict === "boa" ? "bg-amber-500" : "bg-red-600";
  return (
    <section aria-labelledby="ats-title" className="anim-pop space-y-4 rounded-[24px] bg-white p-5 ring-1 ring-zinc-200">
      <div className="flex items-center gap-4">
        <div className={`grid h-24 w-24 shrink-0 place-items-center rounded-3xl text-white ${color}`} aria-label={`Nota ${report.score.toString().replace(".", ",")} de 10`}>
          <span className="text-4xl font-extrabold">{report.score.toFixed(1).replace(".", ",")}<span className="text-base">/10</span></span>
        </div>
        <div>
          <h3 id="ats-title" className="text-lg font-extrabold">Chance de aceitação — {t.name}</h3>
          <p className="font-semibold text-muted">{report.headline}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {report.items.map((i) => (
          <li key={i.id} className="anim-up rounded-xl bg-paper p-3 text-sm" style={{ "--d": `${report.items.indexOf(i) * 50}ms` } as React.CSSProperties}>
            <p className="font-extrabold">{ICON[i.status]} {i.title} <span className="font-semibold text-muted">({i.points.toFixed(1).replace(".", ",")}/{i.max.toFixed(1).replace(".", ",")})</span></p>
            <p className="mt-0.5 text-muted">{i.tip}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Estimativa baseada em boas práticas de RH e leitura por ATS (estrutura, resumo, experiência, formação, habilidades, tamanho e modelo). Não garante aprovação. Ajuste e a nota se atualiza na hora.</p>
    </section>
  );
}
