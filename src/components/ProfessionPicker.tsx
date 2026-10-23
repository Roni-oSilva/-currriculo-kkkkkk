"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Notice, inputCls } from "./ui";
import { PROFESSIONS, PROFESSION_CATEGORIES, TEMPLATE_REASON, searchProfessions, type Profession } from "@/lib/resume/professions";
import { TEMPLATE_LIST, TEMPLATES } from "@/lib/resume/templates";
import type { TemplateId } from "@/lib/resume/schema";

export function ProfessionPicker({ enabledTemplates }: { enabledTemplates: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<Profession | null>(null);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const list = useMemo(() => searchProfessions(query, category || undefined), [query, category]);
  const available = TEMPLATE_LIST.filter((t) => enabledTemplates.includes(t.id));
  const safeTemplate = (id: TemplateId) => (enabledTemplates.includes(id) ? id : (available[0]?.id ?? "classic"));

  function choose(p: Profession) {
    setSelected(p); setManual(false); setTemplate(safeTemplate(p.template));
    requestAnimationFrame(() => document.getElementById("recomendacao")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function chooseManual() {
    setSelected(null); setManual(true); setTemplate(safeTemplate("classic"));
    requestAnimationFrame(() => document.getElementById("recomendacao")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function create() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/resumes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, profession: selected?.id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível criar o currículo.");
      router.push(`/resume/${json.id}/edit`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  const t = TEMPLATES[template];
  const recommended = selected?.template === template;

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-[28px] bg-paper p-5 sm:p-8" aria-labelledby="prof-title">
        <div>
          <h1 id="prof-title" className="text-3xl font-extrabold">Qual é a sua profissão?</h1>
          <p className="mt-1 text-muted">Indicamos o modelo de currículo mais adequado para cada área. Você poderá trocar de modelo a qualquer momento.</p>
        </div>
        <div>
          <label htmlFor="prof-search" className="sr-only">Buscar profissão</label>
          <input id="prof-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busque sua profissão (ex.: enfermeiro, vendedor, desenvolvedor)" className={inputCls} />
        </div>
        <div role="group" aria-label="Áreas" className="flex flex-wrap gap-2">
          {["", ...PROFESSION_CATEGORIES].map((c) => (
            <button key={c || "todas"} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
              className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${category === c ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-zinc-300 hover:bg-chip"}`}>{c || "Todas as áreas"}</button>
          ))}
        </div>
        <p className="text-sm font-semibold text-muted" aria-live="polite">{list.length} de {PROFESSIONS.length} profissões</p>
        <ul className="grid max-h-[26rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => choose(p)} aria-pressed={selected?.id === p.id}
                className={`card-in flex min-h-14 w-full flex-col items-start justify-center rounded-2xl p-3 text-left ring-2 transition ${selected?.id === p.id ? "bg-chip/70 ring-brand" : "bg-white ring-zinc-200 hover:-translate-y-0.5 hover:ring-brand"}`}>
                <span className="font-extrabold">{p.name}</span>
                <span className="text-xs text-muted">{p.category} · {TEMPLATES[p.template].name}</span>
              </button>
            </li>
          ))}
          {!list.length ? <li className="rounded-2xl bg-white p-4 text-sm text-muted sm:col-span-2 lg:col-span-3">Nenhuma profissão encontrada. Use a opção abaixo para escolher o modelo manualmente.</li> : null}
        </ul>
        <Button variant="outline" onClick={chooseManual} className="!min-h-11 text-sm">Minha profissão não está na lista</Button>
      </section>

      {selected || manual ? (
        <section id="recomendacao" className="step-enter scroll-mt-24 space-y-5 rounded-[28px] bg-paper p-5 sm:p-8" aria-live="polite">
          {selected ? (
            <>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand">{selected.category}</p>
                <h2 className="text-2xl font-extrabold">Currículo ideal para {selected.name}</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(0,260px)_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={template} src={`/examples/${template}.png`} alt={`Exemplo do modelo ${t.name}`} className="fade-img w-full rounded-xl border bg-white shadow-md" />
                <div className="space-y-3">
                  <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                    {t.name}
                    {recommended ? <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">Modelo recomendado para {selected.name}</span> : <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">Escolha manual</span>}
                  </p>
                  <p className="text-muted">{recommended ? TEMPLATE_REASON[template] : t.description}</p>
                  <p className="text-sm text-muted">{t.atsNote}</p>
                  <div>
                    <h3 className="font-extrabold">Competências e palavras-chave comuns na área</h3>
                    <p className="text-sm text-muted">Sugestões para você considerar. Inclua apenas as que realmente fazem parte da sua experiência.</p>
                    <ul className="mt-2 flex flex-wrap gap-2">{selected.keywords.map((k) => <li key={k} className="rounded-full bg-chip px-3 py-1 text-sm font-bold text-navy">{k}</li>)}</ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div><h2 className="text-2xl font-extrabold">Escolha o modelo do seu currículo</h2><p className="text-muted">Selecione o formato que melhor representa o seu perfil.</p></div>
          )}

          <div>
            <h3 className="mb-2 font-extrabold">{selected ? "Prefere outro modelo?" : "Modelos disponíveis"}</h3>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {available.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setTemplate(x.id)} aria-pressed={template === x.id}
                    className={`h-full w-full rounded-2xl p-2 text-left ring-2 transition ${template === x.id ? "bg-chip/70 ring-brand" : "bg-white ring-zinc-200 hover:ring-brand"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/examples/${x.id}.png`} alt="" loading="lazy" className="mb-2 aspect-[1/1.2] w-full rounded-lg border object-cover object-top" />
                    <span className="block text-sm font-extrabold">{x.name}</span>
                    {selected?.template === x.id ? <span className="text-xs font-bold text-emerald-800">Recomendado</span> : selected?.alt === x.id ? <span className="text-xs font-bold text-muted">Alternativa</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {err ? <Notice tone="error">{err}</Notice> : null}
          <Button onClick={create} disabled={busy} variant="accent" className="w-full sm:w-auto">{busy ? "Criando…" : `Criar currículo com o modelo ${t.name}`}</Button>
        </section>
      ) : null}
    </div>
  );
}
