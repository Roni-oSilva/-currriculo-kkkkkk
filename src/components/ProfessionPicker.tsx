"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Notice, inputCls } from "./ui";
import { PROFESSIONS, PROFESSION_CATEGORIES, TEMPLATE_REASON, searchProfessions, type Profession } from "@/lib/resume/professions";
import { TEMPLATE_LIST, TEMPLATES } from "@/lib/resume/templates";
import type { TemplateId } from "@/lib/resume/schema";

const POPULAR = ["Faxineira / Diarista", "Vendedor(a) de loja", "Auxiliar administrativo", "Motorista de aplicativo / Taxista", "Operador(a) de caixa", "Técnico(a) de enfermagem", "Recepcionista", "Babá", "Auxiliar de produção / Embalador(a)", "Desenvolvedor(a) de software"];
const PAGE = 18;

export function ProfessionPicker({ enabledTemplates }: { enabledTemplates: string[] }) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Profession | null>(null);
  const [custom, setCustom] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const available = TEMPLATE_LIST.filter((t) => enabledTemplates.includes(t.id));
  const safeTemplate = (id: TemplateId) => (enabledTemplates.includes(id) ? id : (available[0]?.id ?? "classic"));

  // A lista atualiza enquanto digita; o botão "Buscar" e o Enter apenas confirmam.
  const live = input.trim();
  const results = useMemo(() => searchProfessions(live, category || undefined), [live, category]);
  const popular = useMemo(() => POPULAR.map((n) => PROFESSIONS.find((p) => p.name === n)).filter((p): p is Profession => Boolean(p)), []);
  const showing = live || category ? results : [];

  function scrollToResult() {
    requestAnimationFrame(() => document.getElementById("recomendacao")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function choose(p: Profession) { setSelected(p); setCustom(null); setTemplate(safeTemplate(p.template)); scrollToResult(); }
  function chooseCustom(text: string) { setSelected(null); setCustom(text); setTemplate(safeTemplate("classic")); scrollToResult(); }
  function submitSearch(e: React.FormEvent) { e.preventDefault(); setQuery(live); setLimit(PAGE); searchRef.current?.blur(); }

  async function create() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/resumes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template, profession: selected?.id, role: custom ?? undefined }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível criar o currículo.");
      router.push(`/resume/${json.id}/edit`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  }

  const t = TEMPLATES[template];
  const recommended = selected?.template === template;
  const chosen = selected || custom !== null;
  void query;

  return (
    <div className="space-y-4">
      <section className="space-y-5 rounded-[28px] bg-paper p-5 sm:p-8" aria-labelledby="prof-title">
        <div className="anim-up">
          <h1 id="prof-title" className="text-3xl font-extrabold">Qual é a sua profissão?</h1>
          <p className="mt-1 text-muted">Digite o seu trabalho e indicamos o modelo mais adequado. Você pode trocar o modelo depois.</p>
        </div>

        <form onSubmit={submitSearch} role="search" className="flex gap-2">
          <div className="relative flex-1">
            <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <label htmlFor="prof-search" className="sr-only">Buscar profissão</label>
            <input ref={searchRef} id="prof-search" type="search" autoComplete="off" value={input} onChange={(e) => { setInput(e.target.value); setLimit(PAGE); }}
              placeholder="Ex.: faxineira, vendedor, motorista, enfermeiro…" className={`${inputCls} !min-h-14 !rounded-full !pl-12 text-lg`} />
          </div>
          <Button type="submit" className="!min-h-14 shrink-0">Buscar</Button>
        </form>

        {!live && !category ? (
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">Mais procuradas</h2>
              <ul className="flex flex-wrap gap-2">
                {popular.map((p) => (
                  <li key={p.id}><button type="button" onClick={() => choose(p)} className="min-h-11 rounded-full bg-white px-4 text-sm font-bold ring-1 ring-zinc-300 transition hover:-translate-y-0.5 hover:bg-chip">{p.name}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted">Ou escolha uma área</h2>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {PROFESSION_CATEGORIES.map((c) => (
                  <li key={c}><button type="button" onClick={() => { setCategory(c); setLimit(PAGE); }} className="flex min-h-12 w-full items-center justify-between rounded-2xl bg-white px-4 text-left text-sm font-bold ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:ring-brand">
                    {c}<span className="text-xs font-semibold text-muted">{PROFESSIONS.filter((p) => p.category === c).length}</span></button></li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-3" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              {category ? <button type="button" onClick={() => setCategory("")} className="min-h-10 rounded-full bg-brand px-4 text-sm font-bold text-white">{category} ✕</button> : null}
              <p className="text-sm font-semibold text-muted">{showing.length} {showing.length === 1 ? "resultado" : "resultados"}{live ? ` para “${live}”` : ""}</p>
              <button type="button" onClick={() => { setInput(""); setCategory(""); }} className="ml-auto min-h-10 text-sm font-bold text-brand underline">Limpar busca</button>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {showing.slice(0, limit).map((p, i) => (
                <li key={p.id} className="card-in" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                  <button type="button" onClick={() => choose(p)} aria-pressed={selected?.id === p.id}
                    className={`flex min-h-16 w-full flex-col items-start justify-center rounded-2xl p-3 text-left ring-2 transition hover:-translate-y-0.5 ${selected?.id === p.id ? "bg-chip/70 ring-brand" : "bg-white ring-zinc-200 hover:ring-brand"}`}>
                    <span className="font-extrabold">{p.name}</span>
                    <span className="text-xs text-muted">{p.category}</span>
                  </button>
                </li>
              ))}
            </ul>
            {showing.length > limit ? <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)} className="!min-h-11 text-sm">Ver mais ({showing.length - limit})</Button> : null}
            {live ? (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
                <p className="text-sm font-semibold">{showing.length ? "Não é nenhuma dessas?" : "Não encontramos essa profissão na lista."}</p>
                <Button variant="outline" onClick={() => chooseCustom(live)} className="mt-2 !min-h-11 text-sm">Usar “{live}” como a minha profissão</Button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {chosen ? (
        <section id="recomendacao" className="step-enter scroll-mt-24 space-y-5 rounded-[28px] bg-paper p-5 sm:p-8" aria-live="polite">
          {selected ? (
            <>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-brand">{selected.category}</p>
                <h2 className="text-2xl font-extrabold">Currículo ideal para {selected.name}</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-[minmax(0,240px)_1fr]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={template} src={`/examples/${template}.png`} alt={`Exemplo do modelo ${t.name}`} className="fade-img w-full rounded-xl border bg-white shadow-md" />
                <div className="space-y-3">
                  <p className="flex flex-wrap items-center gap-2 text-lg font-extrabold">
                    {t.name}
                    {recommended ? <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-900">Recomendado para você</span> : <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-900">Escolha manual</span>}
                  </p>
                  <p className="text-muted">{recommended ? TEMPLATE_REASON[template] : t.description}</p>
                  <div>
                    <h3 className="font-extrabold">Competências comuns na área</h3>
                    <p className="text-sm text-muted">Você poderá adicionar as que fizerem parte da sua experiência.</p>
                    <ul className="mt-2 flex flex-wrap gap-2">{selected.keywords.map((k) => <li key={k} className="rounded-full bg-chip px-3 py-1 text-sm font-bold text-navy">{k}</li>)}</ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div><h2 className="text-2xl font-extrabold">Currículo para {custom}</h2><p className="text-muted">Escolha o modelo que mais combina com o seu perfil. Na dúvida, o Clássico é o mais aceito.</p></div>
          )}

          <div>
            <h3 className="mb-2 font-extrabold">{selected ? "Prefere outro modelo?" : "Escolha o modelo"}</h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {available.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setTemplate(x.id)} aria-pressed={template === x.id}
                    className={`h-full w-full rounded-2xl p-2 text-left ring-2 transition hover:-translate-y-0.5 ${template === x.id ? "bg-chip/70 ring-brand" : "bg-white ring-zinc-200 hover:ring-brand"}`}>
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
          <Button onClick={create} disabled={busy} variant="accent" className="w-full sm:w-auto">{busy ? "Criando…" : "Começar meu currículo"}</Button>
        </section>
      ) : null}
    </div>
  );
}
