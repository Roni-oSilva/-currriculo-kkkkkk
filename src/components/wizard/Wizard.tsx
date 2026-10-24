"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Notice } from "@/components/ui";
import { EDUCATION_LEVELS, JOB_TYPES, LANGUAGE_LEVELS, type ResumeData, type ResumeDesign } from "@/lib/resume/schema";
import { minimumDataIssues } from "@/lib/resume/schema";
import { AreaField, CheckField, Collapsible, ListEditor, SelectField, TagInput, TextField } from "./fields";
import { useAutosave, type SaveStatus } from "./useAutosave";
import { TemplateStep } from "./TemplateStep";
import { AiPanel } from "./AiPanel";
import { AtsCard } from "./AtsCard";
import { findProfessionByRole } from "@/lib/resume/professions";
import { generateSummary } from "@/lib/resume/summary";
import { scoreResume } from "@/lib/resume/ats";

const STEPS = [
  { label: "Você", tip: "Só o essencial: nome, um contato e a vaga que você quer. O resto é opcional e fica em “Mais campos”." },
  { label: "Experiência", tip: "Da mais recente para a mais antiga. Sem experiência? Pule esta etapa e use o modelo Primeiro emprego." },
  { label: "Estudos", tip: "Escolaridade e cursos. Informe o ano de conclusão (ou a previsão)." },
  { label: "Habilidades", tip: "Liste em texto o que você sabe fazer e os idiomas, sem barras ou porcentagens de nível." },
  { label: "Extras", tip: "Totalmente opcional. Abra só o que fizer sentido para você." },
  { label: "Modelo", tip: "Escolha o visual, a cor e a foto. Clássico e Minimalista são os mais aceitos por RH." },
  { label: "Revisão", tip: "Veja a nota, aplique as recomendações e confira a prévia. Você pode voltar e mudar quando quiser." },
] as const;

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "Salvo", dirty: "Alterações pendentes…", saving: "Salvando…", offline: "Sem conexão — salvaremos ao voltar", error: "Falha ao salvar — tentando de novo",
};

const UFS = ["", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const CNH = ["", "A", "B", "AB", "C", "D", "E"];
const AVAIL = ["", "Imediata", "A combinar", "Integral", "Meio período", "Fins de semana", "Turnos / escalas"];

const uid = () => crypto.randomUUID();

export interface WizardProps {
  resumeId: string;
  initial: { title: string; data: ResumeData; design: ResumeDesign };
  photoUrl: string | null;
  aiEnabled: boolean;
  aiConsent: boolean;
  enabledTemplates: string[];
}

export function Wizard({ resumeId, initial, photoUrl: initialPhotoUrl, aiEnabled, aiConsent, enabledTemplates }: WizardProps) {
  const router = useRouter();
  const [payload, setPayload] = useState(initial);
  const [step, setStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const { status, flush, error: saveError } = useAutosave(`/api/resumes/${resumeId}`, payload);

  const { data, design } = payload;
  const setData = useCallback((fn: (d: ResumeData) => ResumeData) => setPayload((p) => ({ ...p, data: fn(p.data) })), []);
  const personal = (patch: Partial<ResumeData["personal"]>) => setData((d) => ({ ...d, personal: { ...d.personal, ...patch } }));
  const objective = (patch: Partial<ResumeData["objective"]>) => setData((d) => ({ ...d, objective: { ...d.objective, ...patch } }));
  const skills = (patch: Partial<ResumeData["skills"]>) => setData((d) => ({ ...d, skills: { ...d.skills, ...patch } }));
  const extras = (patch: Partial<ResumeData["extras"]>) => setData((d) => ({ ...d, extras: { ...d.extras, ...patch } }));

  const issues = useMemo(() => minimumDataIssues(data), [data]);
  const profession = useMemo(() => findProfessionByRole(data.objective.targetRole), [data.objective.targetRole]);
  const [goingToPreview, setGoing] = useState(false);
  const [summaryVariant, setSummaryVariant] = useState(0);
  const [summaryMsg, setSummaryMsg] = useState<string | null>(null);
  const score = useMemo(() => scoreResume(data, design), [data, design]);
  const nextTip = useMemo(() => [...score.items].sort((a, b) => b.max - b.points - (a.max - a.points))[0], [score]);

  function makeSummary(length: "short" | "detailed") {
    if (!data.objective.keywords.length && !data.skills.technical.length) {
      setSummaryMsg("Adicione ao menos uma palavra-chave (ex.: atendimento, organização) para gerar o resumo.");
      return;
    }
    setSummaryMsg(null);
    objective({ summary: generateSummary(data, length, summaryVariant) });
    setSummaryVariant((v) => v + 1);
  }

  async function goPreview() {
    setGoing(true);
    const ok = await flush();
    if (ok) router.push(`/resume/${resumeId}/preview`);
    else setGoing(false); // o motivo aparece no aviso vermelho abaixo
  }

  const allSkills = [...data.skills.technical, ...data.skills.tools, ...data.skills.soft, ...data.skills.domain];

  const body = (() => {
    switch (step) {
      case 0: return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><TextField label="Nome completo" value={data.personal.fullName} onChange={(v) => personal({ fullName: v })} autoComplete="name" /></div>
            <div className="col-span-2 sm:col-span-1"><TextField label="Telefone / WhatsApp" type="tel" inputMode="tel" value={data.personal.phone} onChange={(v) => personal({ phone: v })} autoComplete="tel" /></div>
            <div className="col-span-2 sm:col-span-1"><TextField label="E-mail" type="email" inputMode="email" value={data.personal.email} onChange={(v) => personal({ email: v })} autoComplete="email" /></div>
            <TextField label="Cidade" value={data.personal.city} onChange={(v) => personal({ city: v })} autoComplete="address-level2" />
            <SelectField label="Estado (UF)" value={data.personal.state} onChange={(v) => personal({ state: v })} options={UFS} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Vaga ou cargo desejado" value={data.objective.targetRole} onChange={(v) => objective({ targetRole: v })} />
            <SelectField label="Tipo de vaga" value={data.objective.jobType} onChange={(v) => objective({ jobType: v })} options={JOB_TYPES} />
            <div className="space-y-3 rounded-2xl bg-chip/40 p-4 sm:col-span-2">
              <h3 className="font-extrabold">Resumo profissional</h3>
              <TagInput label="Palavras-chave sobre você" values={data.objective.keywords} onChange={(v) => objective({ keywords: v })} hint="Digite e aperte Enter. Ex.: atendimento, organização, vendas, limpeza." />
              {profession ? (
                <ul className="flex flex-wrap gap-2" aria-label="Sugestões da sua profissão">
                  {profession.keywords.filter((k) => !data.objective.keywords.includes(k)).slice(0, 6).map((k) => (
                    <li key={k}><button type="button" onClick={() => objective({ keywords: [...data.objective.keywords, k] })} className="min-h-9 rounded-full bg-white px-3 text-xs font-bold text-navy ring-1 ring-brand transition hover:-translate-y-0.5">+ {k}</button></li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => makeSummary("short")} className="!min-h-11 text-sm">Gerar resumo curto</Button>
                <Button variant="primary" onClick={() => makeSummary("detailed")} className="!min-h-11 text-sm">Gerar resumo detalhado</Button>
              </div>
              {summaryMsg ? <Notice tone="warn">{summaryMsg}</Notice> : null}
              <AreaField label="Seu resumo (você pode editar)" rows={5} maxLength={1500} value={data.objective.summary} onChange={(v) => objective({ summary: v })} hint="Criado só com o que você informou. Clique em gerar de novo para outra redação." />
            </div>
          </div>
          <Collapsible title="Mais campos" hint="CNH, disponibilidade, LinkedIn…">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="CNH (categoria)" value={data.personal.cnh} onChange={(v) => personal({ cnh: v })} options={CNH} />
              <SelectField label="Disponibilidade" value={data.personal.availability} onChange={(v) => personal({ availability: v })} options={AVAIL} />
              <TextField label="LinkedIn" type="url" inputMode="url" value={data.personal.linkedin} onChange={(v) => personal({ linkedin: v })} placeholder="https://linkedin.com/in/seu-nome" />
              <TextField label="Portfólio ou site" type="url" inputMode="url" value={data.personal.website} onChange={(v) => personal({ website: v })} />
              <TextField label="Área de atuação" value={data.objective.area} onChange={(v) => objective({ area: v })} />
              <TextField label="Endereço (opcional)" value={data.personal.address} onChange={(v) => personal({ address: v })} hint="Cidade e estado já bastam." />
            </div>
            <h3 className="font-extrabold">Outros links</h3>
            <ListEditor items={data.personal.otherLinks.map((l, i) => ({ ...l, id: String(i) }))}
              onChange={(l) => personal({ otherLinks: l.map(({ label, url }) => ({ label, url })) })}
              newItem={() => ({ id: uid(), label: "", url: "" })} addLabel="Adicionar link" itemLabel={(l, i) => l.label || `Link ${i + 1}`}>
              {(l, up) => (<div className="grid gap-3 sm:grid-cols-2"><TextField label="Nome (ex.: GitHub)" value={l.label} onChange={(v) => up({ label: v })} /><TextField label="URL" type="url" value={l.url} onChange={(v) => up({ url: v })} /></div>)}
            </ListEditor>
          </Collapsible>
        </div>
      );
      case 1: return (
        <ListEditor items={data.experience} onChange={(experience) => setData((d) => ({ ...d, experience }))}
          newItem={() => ({ id: uid(), company: "", role: "", city: "", start: "", end: "", current: false, activities: "", achievements: "" })}
          addLabel="Adicionar experiência" emptyHint="Nenhuma experiência ainda. Toque em “Adicionar experiência” ou siga para a próxima etapa."
          itemLabel={(e, i) => [e.role, e.company].filter(Boolean).join(" — ") || `Experiência ${i + 1}`}>
          {(e, up) => (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1"><TextField label="Cargo" value={e.role} onChange={(v) => up({ role: v })} /></div>
                <div className="col-span-2 sm:col-span-1"><TextField label="Empresa" value={e.company} onChange={(v) => up({ company: v })} /></div>
                <TextField label="Início" type="month" value={e.start} onChange={(v) => up({ start: v })} />
                <TextField label="Término" type="month" value={e.current ? "" : e.end} onChange={(v) => up({ end: v })} />
                <div className="col-span-2"><CheckField label="Trabalho aqui atualmente" checked={e.current} onChange={(v) => up({ current: v, end: v ? "" : e.end })} /></div>
              </div>
              <AreaField label="O que você fazia" rows={3} value={e.activities} onChange={(v) => up({ activities: v })} hint="Uma atividade por linha." />
              <Collapsible title="Resultados e cidade" hint="opcional">
                <TextField label="Cidade" value={e.city} onChange={(v) => up({ city: v })} />
                <AreaField label="Resultados e conquistas" rows={3} value={e.achievements} onChange={(v) => up({ achievements: v })} hint="Só o que é verdade. Números ajudam (ex.: “atendia 40 clientes por dia”)." />
              </Collapsible>
            </>
          )}
        </ListEditor>
      );
      case 2: return (
        <div className="space-y-6">
          <section className="space-y-2"><h3 className="text-lg font-extrabold">Escolaridade</h3>
            <ListEditor items={data.education} onChange={(education) => setData((d) => ({ ...d, education }))}
              newItem={() => ({ id: uid(), institution: "", course: "", level: "", start: "", end: "", current: false })}
              addLabel="Adicionar escolaridade" itemLabel={(e, i) => e.course || e.level || e.institution || `Formação ${i + 1}`}>
              {(e, up) => (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField label="Nível" value={e.level} onChange={(v) => up({ level: v })} options={EDUCATION_LEVELS} />
                    <TextField label="Curso (se houver)" value={e.course} onChange={(v) => up({ course: v })} />
                    <TextField label="Escola ou instituição" value={e.institution} onChange={(v) => up({ institution: v })} />
                    <TextField label="Conclusão (ou previsão)" type="month" value={e.current ? "" : e.end} onChange={(v) => up({ end: v })} />
                    <div className="sm:col-span-2"><CheckField label="Ainda estou cursando" checked={e.current} onChange={(v) => up({ current: v, end: v ? "" : e.end })} /></div>
                  </div>
                </>
              )}
            </ListEditor>
          </section>
          <section className="space-y-2"><h3 className="text-lg font-extrabold">Cursos e certificados</h3>
            <ListEditor items={data.courses} onChange={(courses) => setData((d) => ({ ...d, courses }))}
              newItem={() => ({ id: uid(), name: "", institution: "", hours: "", completedAt: "", certificateUrl: "" })}
              addLabel="Adicionar curso" itemLabel={(c, i) => c.name || `Curso ${i + 1}`}>
              {(c, up) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Nome do curso" value={c.name} onChange={(v) => up({ name: v })} />
                  <TextField label="Instituição" value={c.institution} onChange={(v) => up({ institution: v })} />
                  <TextField label="Carga horária (horas)" inputMode="numeric" value={c.hours} onChange={(v) => up({ hours: v.replace(/\D/g, "") })} />
                  <TextField label="Conclusão" type="month" value={c.completedAt} onChange={(v) => up({ completedAt: v })} />
                </div>
              )}
            </ListEditor>
          </section>
        </div>
      );
      case 3: return (
        <div className="space-y-5">
          {profession ? (
            <div className="rounded-2xl bg-chip/50 p-4">
              <h3 className="font-extrabold">Comuns na área de {profession.name}</h3>
              <p className="mb-2 text-sm text-muted">Toque para adicionar apenas o que você realmente sabe fazer.</p>
              <ul className="flex flex-wrap gap-2">
                {profession.keywords.filter((k) => !allSkills.includes(k)).map((k) => (
                  <li key={k}><button type="button" onClick={() => skills({ technical: [...data.skills.technical, k] })} className="min-h-10 rounded-full bg-white px-3 text-sm font-bold text-navy ring-1 ring-brand transition hover:-translate-y-0.5">+ {k}</button></li>
                ))}
                {profession.keywords.every((k) => allSkills.includes(k)) ? <li className="text-sm font-semibold text-emerald-800">Você já adicionou todas.</li> : null}
              </ul>
            </div>
          ) : null}
          <TagInput label="O que você sabe fazer" values={data.skills.technical} onChange={(v) => skills({ technical: v })} />
          <TagInput label="Competências pessoais" values={data.skills.soft} onChange={(v) => skills({ soft: v })} hint="Ex.: comunicação, trabalho em equipe, organização." />
          <Collapsible title="Ferramentas e conhecimentos da área" hint="opcional">
            <TagInput label="Ferramentas e tecnologias" values={data.skills.tools} onChange={(v) => skills({ tools: v })} />
            <TagInput label="Conhecimentos específicos" values={data.skills.domain} onChange={(v) => skills({ domain: v })} />
          </Collapsible>
          <section className="space-y-2"><h3 className="text-lg font-extrabold">Idiomas</h3>
            <ListEditor items={data.extras.languages} onChange={(languages) => extras({ languages })} newItem={() => ({ id: uid(), name: "", level: "" })} addLabel="Adicionar idioma" itemLabel={(l, i) => l.name || `Idioma ${i + 1}`}>
              {(l, up) => (<div className="grid gap-3 sm:grid-cols-2"><TextField label="Idioma" value={l.name} onChange={(v) => up({ name: v })} /><SelectField label="Nível real" value={l.level} onChange={(v) => up({ level: v })} options={["", ...LANGUAGE_LEVELS]} /></div>)}
            </ListEditor>
          </section>
        </div>
      );
      case 4: return (
        <div className="space-y-3">
          <Collapsible title="Projetos" count={data.extras.projects.length}>
            <ListEditor items={data.extras.projects} onChange={(projects) => extras({ projects })} newItem={() => ({ id: uid(), name: "", description: "", url: "" })} addLabel="Adicionar projeto" itemLabel={(p, i) => p.name || `Projeto ${i + 1}`}>
              {(p, up) => (<div className="space-y-3"><TextField label="Nome" value={p.name} onChange={(v) => up({ name: v })} /><AreaField label="Descrição" rows={3} value={p.description} onChange={(v) => up({ description: v })} /><TextField label="Link" type="url" value={p.url} onChange={(v) => up({ url: v })} /></div>)}
            </ListEditor>
          </Collapsible>
          <Collapsible title="Trabalho voluntário" count={data.extras.volunteer.length}>
            <ListEditor items={data.extras.volunteer} onChange={(volunteer) => extras({ volunteer })} newItem={() => ({ id: uid(), organization: "", role: "", period: "", description: "" })} addLabel="Adicionar voluntariado" itemLabel={(v, i) => v.organization || `Voluntariado ${i + 1}`}>
              {(v, up) => (<div className="grid gap-3 sm:grid-cols-2"><TextField label="Organização" value={v.organization} onChange={(x) => up({ organization: x })} /><TextField label="Função" value={v.role} onChange={(x) => up({ role: x })} /><TextField label="Período" value={v.period} onChange={(x) => up({ period: x })} /><div className="sm:col-span-2"><AreaField label="Descrição" rows={2} value={v.description} onChange={(x) => up({ description: x })} /></div></div>)}
            </ListEditor>
          </Collapsible>
          <Collapsible title="Certificações profissionais" count={data.extras.certifications.length}>
            <ListEditor items={data.extras.certifications} onChange={(certifications) => extras({ certifications })} newItem={() => ({ id: uid(), name: "", issuer: "", year: "" })} addLabel="Adicionar certificação" itemLabel={(a, i) => a.name || `Certificação ${i + 1}`}>
              {(a, up) => (<div className="grid gap-3 sm:grid-cols-3"><TextField label="Nome" value={a.name} onChange={(x) => up({ name: x })} /><TextField label="Emissor" value={a.issuer} onChange={(x) => up({ issuer: x })} /><TextField label="Ano" inputMode="numeric" maxLength={4} value={a.year} onChange={(x) => up({ year: x.replace(/\D/g, "") })} /></div>)}
            </ListEditor>
          </Collapsible>
          <Collapsible title="Prêmios" count={data.extras.awards.length}>
            <ListEditor items={data.extras.awards} onChange={(awards) => extras({ awards })} newItem={() => ({ id: uid(), title: "", issuer: "", year: "" })} addLabel="Adicionar prêmio" itemLabel={(a, i) => a.title || `Prêmio ${i + 1}`}>
              {(a, up) => (<div className="grid gap-3 sm:grid-cols-3"><TextField label="Título" value={a.title} onChange={(x) => up({ title: x })} /><TextField label="Concedido por" value={a.issuer} onChange={(x) => up({ issuer: x })} /><TextField label="Ano" inputMode="numeric" maxLength={4} value={a.year} onChange={(x) => up({ year: x.replace(/\D/g, "") })} /></div>)}
            </ListEditor>
          </Collapsible>
          <Collapsible title="Publicações" count={data.extras.publications.length}>
            <ListEditor items={data.extras.publications} onChange={(publications) => extras({ publications })} newItem={() => ({ id: uid(), title: "", venue: "", year: "", url: "" })} addLabel="Adicionar publicação" itemLabel={(a, i) => a.title || `Publicação ${i + 1}`}>
              {(a, up) => (<div className="grid gap-3 sm:grid-cols-2"><TextField label="Título" value={a.title} onChange={(x) => up({ title: x })} /><TextField label="Veículo" value={a.venue} onChange={(x) => up({ venue: x })} /><TextField label="Ano" inputMode="numeric" maxLength={4} value={a.year} onChange={(x) => up({ year: x.replace(/\D/g, "") })} /><TextField label="Link" type="url" value={a.url} onChange={(x) => up({ url: x })} /></div>)}
            </ListEditor>
          </Collapsible>
          <Collapsible title="Outras informações" hint="evite CPF, RG e estado civil">
            <AreaField label="Outras informações relevantes" rows={3} value={data.extras.other} onChange={(v) => extras({ other: v })} />
          </Collapsible>
        </div>
      );
      case 5: return (
        <TemplateStep design={design} onDesign={(d) => setPayload((p) => ({ ...p, design: d }))} resumeId={resumeId}
          hasPhoto={Boolean(data.personal.photoPath)} photoUrl={photoUrl} enabledTemplates={enabledTemplates} recommended={profession ? { name: profession.name, template: profession.template } : undefined}
          onPhoto={(path, url) => { personal({ photoPath: path }); setPhotoUrl(url); }} />
      );
      default: return (
        <div className="space-y-5">
          <AtsCard data={data} design={design} />
          <AiPanel resumeId={resumeId} data={data} flush={flush} hasConsent={aiConsent} aiEnabled={aiEnabled} onApply={(d) => setData(() => d)} />
          {issues.length ? <Notice tone="info">Você já pode ver a prévia. Para liberar o PDF, falta: {issues.join(" ").toLowerCase()}</Notice> : null}
          {saveError ? <Notice tone="error">Não foi possível salvar o currículo: {saveError}. Corrija o campo indicado e tente de novo.</Notice> : null}
          <Button onClick={goPreview} disabled={goingToPreview} variant="accent" className="w-full sm:w-auto">{goingToPreview ? "Salvando…" : "Ver prévia do currículo"}</Button>
        </div>
      );
    }
  })();

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-3xl space-y-3 p-3 sm:p-5">
      <Card className="space-y-3 !p-4 sm:!p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="sr-only" htmlFor="title">Título do currículo</label>
          <input id="title" value={payload.title} onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))} maxLength={100}
            className="min-h-11 min-w-0 flex-1 rounded-xl bg-white px-3 text-lg font-extrabold ring-1 ring-zinc-300" />
          <p role="status" aria-live="polite" className={`flex items-center gap-1.5 text-sm font-bold ${status === "saved" ? "text-emerald-700" : status === "error" || status === "offline" ? "text-red-700" : "text-muted"}`}>
            <span aria-hidden className={`h-2 w-2 rounded-full ${status === "saved" ? "bg-emerald-600" : status === "error" || status === "offline" ? "bg-red-600" : "animate-pulse bg-amber-500"}`} />{STATUS_TEXT[status]}
          </p>
        </div>
        <nav aria-label="Etapas">
          <ol className="flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex items-center">
                <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined} aria-label={`Etapa ${i + 1}: ${s.label}`}
                  className={`flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold transition ${i === step ? "bg-brand text-white shadow-md" : i < step ? "bg-chip text-navy" : "bg-white text-muted ring-1 ring-zinc-300"}`}>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${i === step ? "bg-white text-brand" : i < step ? "bg-brand text-white" : "bg-zinc-200"}`}>{i < step ? "✓" : i + 1}</span>
                  <span className={i === step ? "" : "hidden sm:inline"}>{s.label}</span>
                </button>
                {i < STEPS.length - 1 ? <span aria-hidden className={`mx-1 h-0.5 w-3 rounded ${i < step ? "bg-brand" : "bg-zinc-300"}`} /> : null}
              </li>
            ))}
          </ol>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200" role="progressbar" aria-label="Progresso" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
            <div className="bar-grow h-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </nav>
      </Card>

      <div className="sticky top-[70px] z-20" role="region" aria-label="Nota do currículo">
        <button type="button" onClick={() => setStep(STEPS.length - 1)}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-lg ring-1 ring-zinc-200 transition hover:-translate-y-0.5">
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white ${score.verdict === "alta" ? "bg-emerald-600" : score.verdict === "boa" ? "bg-amber-600" : "bg-red-600"}`}>
            <span className="text-xl font-extrabold leading-none">{score.score.toFixed(1).replace(".", ",")}<span className="text-xs opacity-80">/10</span></span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">Nota do seu currículo agora</span>
            <span className="line-clamp-2 block text-xs text-muted">{nextTip && nextTip.max - nextTip.points > 0.05 ? `Para subir: ${nextTip.tip}` : score.headline}</span>
          </span>
          <span className="shrink-0 text-xs font-extrabold text-brand">Ver detalhes</span>
        </button>
      </div>

      <Card className="!p-4 sm:!p-6">
        <div key={step} className="step-enter">
          <h2 className="text-2xl font-extrabold">{STEPS[step].label}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">{STEPS[step].tip}</p>
          {body}
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-1 flex justify-between gap-3 bg-char/95 p-3 backdrop-blur">
        <Button variant="light" onClick={() => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={step === 0}>Voltar</Button>
        {step < STEPS.length - 1 ? <Button variant="accent" onClick={() => { setStep((s) => s + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Continuar</Button> : null}
      </div>
    </div>
  );
}
