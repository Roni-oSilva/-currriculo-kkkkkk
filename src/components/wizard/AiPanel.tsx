"use client";

import { useState } from "react";
import { Button, Notice, inputCls, Field } from "@/components/ui";
import type { ResumeData } from "@/lib/resume/schema";
import type { AiResult, Suggestion } from "@/lib/ai/service";

type Op = "summary" | "experience" | "review" | "tailor" | "full";

export function applySuggestion(data: ResumeData, s: Suggestion): ResumeData {
  const d = structuredClone(data);
  const { section, itemId, field } = s.target;
  if (section === "objective" && field === "summary") d.objective.summary = s.suggested;
  if (section === "experience") {
    const e = d.experience.find((x) => x.id === itemId);
    if (e && (field === "activities" || field === "achievements")) e[field] = s.suggested;
  }
  if (section === "projects") { const p = d.extras.projects.find((x) => x.id === itemId); if (p) p.description = s.suggested; }
  if (section === "volunteer") { const v = d.extras.volunteer.find((x) => x.id === itemId); if (v) v.description = s.suggested; }
  if (section === "other") d.extras.other = s.suggested;
  return d;
}

export function AiPanel({ resumeId, data, onApply, flush, hasConsent, aiEnabled }: {
  resumeId: string; data: ResumeData; onApply: (d: ResumeData) => void; flush: () => Promise<boolean>; hasConsent: boolean; aiEnabled: boolean;
}) {
  const [consent, setConsent] = useState(hasConsent);
  const [askConsent, setAskConsent] = useState(false);
  const [busy, setBusy] = useState<Op | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [job, setJob] = useState(data.objective.jobDescription);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);

  async function run(op: Op) {
    if (!consent) { setPendingOp(op); setAskConsent(true); return; }
    setBusy(op); setError(null);
    await flush();
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId, operation: op, jobDescription: op === "tailor" || job ? job : undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "ai_consent_required") { setConsent(false); setPendingOp(op); setAskConsent(true); return; }
        throw new Error(json.error ?? "Erro na IA");
      }
      setResult(json as AiResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function giveConsent() {
    const res = await fetch("/api/ai/consent", { method: "POST" });
    if (!res.ok) { setError("Não foi possível registrar o consentimento."); return; }
    setConsent(true); setAskConsent(false);
    if (pendingOp) void run(pendingOp);
  }

  const accept = (s: Suggestion) => {
    onApply(applySuggestion(data, s));
    setResult((r) => (r ? { ...r, suggestions: r.suggestions.filter((x) => x.id !== s.id) } : r));
  };
  const reject = (s: Suggestion) => setResult((r) => (r ? { ...r, suggestions: r.suggestions.filter((x) => x.id !== s.id) } : r));

  if (!aiEnabled) {
    return <Notice tone="warn">A IA ainda não foi configurada neste ambiente (veja docs/AI.md). Você pode continuar normalmente e ver a nota de aceitação abaixo.</Notice>;
  }

  const ops: [Op, string][] = [["summary", "Criar resumo profissional"], ["experience", "Melhorar experiências"], ["review", "Revisar texto e lacunas"], ["full", "Fazer tudo"]];

  return (
    <section aria-labelledby="ai-title" className="space-y-4 rounded-[24px] bg-white p-5 ring-1 ring-zinc-200">
      <h3 id="ai-title" className="text-lg font-extrabold">Melhorar com IA</h3>
      <p className="text-sm text-muted">A IA só reescreve o que você informou: não inventa empregos, datas, cursos, resultados ou habilidades. Você aprova cada sugestão antes de aplicar.</p>
      <div className="flex flex-wrap gap-2">
        {ops.map(([op, label]) => (
          <Button key={op} variant="outline" disabled={busy !== null} onClick={() => run(op)} className="!min-h-11 !px-4 !py-2 text-sm">{busy === op ? "Analisando…" : label}</Button>
        ))}
      </div>
      <details className="rounded-xl bg-paper p-3">
        <summary className="cursor-pointer font-bold">Adaptar à vaga (opcional)</summary>
        <div className="mt-3 space-y-3">
          <Field label="Descrição da vaga" htmlFor="job" hint="Cole o texto do anúncio. A IA destaca o que você já tem que combina com a vaga, sem acrescentar requisitos que você não possui.">
            <textarea id="job" value={job} onChange={(e) => setJob(e.target.value)} rows={5} maxLength={6000} className={inputCls} />
          </Field>
          <Button variant="primary" disabled={busy !== null || !job.trim()} onClick={() => run("tailor")} className="!min-h-11 text-sm">{busy === "tailor" ? "Adaptando…" : "Adaptar à vaga"}</Button>
        </div>
      </details>

      {askConsent ? (
        <div role="dialog" aria-modal="true" aria-labelledby="consent-title" className="space-y-3 rounded-2xl border-2 border-brand bg-chip/40 p-4">
          <h4 id="consent-title" className="font-extrabold">Autorizar envio à IA</h4>
          <p className="text-sm">Para usar a IA, enviaremos o conteúdo profissional do currículo (experiências, formação, cursos, habilidades, projetos e a vaga, se informada) a um provedor de IA. Não enviamos e-mail, telefone, endereço, links nem foto. Veja a <a className="underline" href="/privacidade" target="_blank">Política de Privacidade</a>.</p>
          <div className="flex gap-2">
            <Button onClick={giveConsent} className="!min-h-11 text-sm">Autorizar e continuar</Button>
            <Button variant="ghost" onClick={() => setAskConsent(false)} className="!min-h-11 text-sm">Agora não</Button>
          </div>
        </div>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      {result ? (
        <div className="space-y-3" aria-live="polite">
          {result.suggestions.length === 0 ? <Notice tone="info">Nenhuma sugestão pendente. {result.rejected ? `${result.rejected} sugestão(ões) descartada(s) por conter informações que você não forneceu.` : ""}</Notice> : null}
          {result.suggestions.map((s) => (
            <article key={s.id} className="space-y-2 rounded-2xl bg-paper p-4">
              <h4 className="font-extrabold">{s.label}</h4>
              {s.original ? <p className="whitespace-pre-wrap rounded-lg bg-white p-2 text-sm text-muted"><strong>Atual:</strong> {s.original}</p> : <p className="text-sm text-muted">Campo vazio hoje.</p>}
              <p className="whitespace-pre-wrap rounded-lg bg-emerald-50 p-2 text-sm"><strong>Sugestão:</strong> {s.suggested}</p>
              {s.reason ? <p className="text-xs text-muted">{s.reason}</p> : null}
              <div className="flex gap-2">
                <Button onClick={() => accept(s)} className="!min-h-11 text-sm">Aceitar</Button>
                <Button variant="ghost" onClick={() => reject(s)} className="!min-h-11 text-sm">Ignorar</Button>
              </div>
            </article>
          ))}
          {result.missing.length ? (
            <div className="rounded-2xl bg-amber-50 p-4 text-sm">
              <h4 className="font-extrabold">O que você poderia acrescentar</h4>
              <ul className="mt-1 list-disc pl-5">{result.missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
