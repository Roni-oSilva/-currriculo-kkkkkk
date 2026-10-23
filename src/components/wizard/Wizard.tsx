"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Notice } from "@/components/ui";
import { EDUCATION_LEVELS, JOB_TYPES, LANGUAGE_LEVELS, type ResumeData, type ResumeDesign } from "@/lib/resume/schema";
import { minimumDataIssues } from "@/lib/resume/schema";
import { AreaField, CheckField, ListEditor, SelectField, TagInput, TextField } from "./fields";
import { useAutosave, type SaveStatus } from "./useAutosave";
import { TemplateStep } from "./TemplateStep";
import { AiPanel } from "./AiPanel";
import { AtsCard } from "./AtsCard";

const STEPS = ["Dados pessoais", "Objetivo", "Experiência", "Formação", "Cursos", "Habilidades", "Adicionais", "Modelo", "Revisão"] as const;

const STATUS_TEXT: Record<SaveStatus, string> = {
  saved: "Salvo", dirty: "Alterações pendentes…", saving: "Salvando…", offline: "Sem conexão — salvaremos ao voltar", error: "Falha ao salvar — tentando de novo",
};

const TIPS = [
  "Use um e-mail profissional. Cidade e estado bastam: não precisa de endereço completo, CPF ou RG.",
  "Diga qual vaga você busca e resuma sua trajetória em 3 a 5 linhas. Use palavras da descrição da vaga.",
  "Da mais recente para a mais antiga. Descreva o que fazia e, se souber, resultados com números reais.",
  "Informe curso, instituição e ano de conclusão (ou previsão). Em andamento também vale.",
  "Cursos e certificados reforçam o currículo, principalmente para quem está começando.",
  "Liste softwares, ferramentas e competências em texto. Evite barras ou porcentagens de nível.",
  "Idiomas com nível real, projetos, voluntariado e prêmios. Tudo opcional.",
  "Clássico e Minimalista são os mais aceitos por RH e por sistemas de triagem. Dá para trocar a qualquer momento.",
  "Confira a nota, aplique as dicas e só então veja a prévia. Você pode voltar e mudar quando quiser.",
] as const;

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
  const { status, flush } = useAutosave(`/api/resumes/${resumeId}`, payload);

  const { data, design } = payload;
  const setData = useCallback((fn: (d: ResumeData) => ResumeData) => setPayload((p) => ({ ...p, data: fn(p.data) })), []);
  const personal = (patch: Partial<ResumeData["personal"]>) => setData((d) => ({ ...d, personal: { ...d.personal, ...patch } }));
  const objective = (patch: Partial<ResumeData["objective"]>) => setData((d) => ({ ...d, objective: { ...d.objective, ...patch } }));
  const skills = (patch: Partial<ResumeData["skills"]>) => setData((d) => ({ ...d, skills: { ...d.skills, ...patch } }));
  const extras = (patch: Partial<ResumeData["extras"]>) => setData((d) => ({ ...d, extras: { ...d.extras, ...patch } }));

  const issues = useMemo(() => minimumDataIssues(data), [data]);
  const [goingToPreview, setGoing] = useState(false);

  async function goPreview() {
    setGoing(true);
    const ok = await flush();
    if (ok) router.push(`/resume/${resumeId}/preview`);
    else setGoing(false);
  }

  const body = (() => {
    switch (step) {
      case 0: return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nome completo" value={data.personal.fullName} onChange={(v) => personal({ fullName: v })} autoComplete="name" />
          <TextField label="E-mail" type="email" inputMode="email" value={data.personal.email} onChange={(v) => personal({ email: v })} autoComplete="email" hint="Use um e-mail profissional." />
          <TextField label="Telefone / WhatsApp" type="tel" inputMode="tel" value={data.personal.phone} onChange={(v) => personal({ phone: v })} autoComplete="tel" />
          <TextField label="Cidade" value={data.personal.city} onChange={(v) => personal({ city: v })} autoComplete="address-level2" />
          <TextField label="Estado (UF)" value={data.personal.state} onChange={(v) => personal({ state: v })} maxLength={40} />
          <TextField label="Endereço (opcional)" value={data.personal.address} onChange={(v) => personal({ address: v })} hint="Cidade e estado costumam bastar." />
          <TextField label="LinkedIn" type="url" inputMode="url" value={data.personal.linkedin} onChange={(v) => personal({ linkedin: v })} placeholder="https://linkedin.com/in/seu-nome" />
          <TextField label="Portfólio ou site" type="url" inputMode="url" value={data.personal.website} onChange={(v) => personal({ website: v })} />
          <div className="sm:col-span-2">
            <h3 className="mb-2 font-extrabold">Outros links profissionais</h3>
            <ListEditor items={data.personal.otherLinks.map((l, i) => ({ ...l, id: String(i) }))}
              onChange={(l) => personal({ otherLinks: l.map(({ label, url }) => ({ label, url })) })}
              newItem={() => ({ id: uid(), label: "", url: "" })} addLabel="Adicionar link" itemLabel={(_, i) => `Link ${i + 1}`}>
              {(l, up) => (<><TextField label="Nome (ex.: GitHub)" value={l.label} onChange={(v) => up({ label: v })} /><TextField label="URL" type="url" value={l.url} onChange={(v) => up({ url: v })} /></>)}
            </ListEditor>
          </div>
        </div>
      );
      case 1: return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Cargo desejado" value={data.objective.targetRole} onChange={(v) => objective({ targetRole: v })} />
            <TextField label="Área de atuação" value={data.objective.area} onChange={(v) => objective({ area: v })} />
            <SelectField label="Tipo de vaga pretendida" value={data.objective.jobType} onChange={(v) => objective({ jobType: v })} options={JOB_TYPES} />
          </div>
          <AreaField label="Resumo profissional" rows={6} maxLength={1500} value={data.objective.summary} onChange={(v) => objective({ summary: v })}
            hint="3 a 5 linhas: sua trajetória, principais competências e foco. Na revisão, o assistente pode melhorar a redação sem mudar os fatos." />
        </div>
      );
      case 2: return (
        <div className="space-y-3">
          <Notice tone="info">Não tem experiência? Pode pular esta etapa — use o modelo “Primeiro emprego” e destaque cursos e projetos. Liste da mais recente para a mais antiga.</Notice>
          <ListEditor items={data.experience} onChange={(experience) => setData((d) => ({ ...d, experience }))}
            newItem={() => ({ id: uid(), company: "", role: "", city: "", start: "", end: "", current: false, activities: "", achievements: "" })}
            addLabel="Adicionar experiência" itemLabel={(e, i) => e.company || e.role || `Experiência ${i + 1}`}>
            {(e, up) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Empresa" value={e.company} onChange={(v) => up({ company: v })} />
                <TextField label="Cargo" value={e.role} onChange={(v) => up({ role: v })} />
                <TextField label="Cidade (se relevante)" value={e.city} onChange={(v) => up({ city: v })} />
                <TextField label="Início" type="month" value={e.start} onChange={(v) => up({ start: v })} />
                <TextField label="Término" type="month" value={e.current ? "" : e.end} onChange={(v) => up({ end: v })} />
                <CheckField label="Emprego atual" checked={e.current} onChange={(v) => up({ current: v, end: v ? "" : e.end })} />
                <div className="sm:col-span-2"><AreaField label="Atividades realizadas" rows={4} value={e.activities} onChange={(v) => up({ activities: v })} hint="Uma atividade por linha." /></div>
                <div className="sm:col-span-2"><AreaField label="Resultados e conquistas" rows={3} value={e.achievements} onChange={(v) => up({ achievements: v })} hint="Só o que é verdade. Números ajudam (ex.: “atendi 40 clientes por dia”)." /></div>
              </div>
            )}
          </ListEditor>
        </div>
      );
      case 3: return (
        <ListEditor items={data.education} onChange={(education) => setData((d) => ({ ...d, education }))}
          newItem={() => ({ id: uid(), institution: "", course: "", level: "", start: "", end: "", current: false })}
          addLabel="Adicionar formação" itemLabel={(e, i) => e.course || e.institution || `Formação ${i + 1}`}>
          {(e, up) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Instituição" value={e.institution} onChange={(v) => up({ institution: v })} />
              <TextField label="Curso" value={e.course} onChange={(v) => up({ course: v })} />
              <SelectField label="Grau / nível" value={e.level} onChange={(v) => up({ level: v })} options={EDUCATION_LEVELS} />
              <TextField label="Início" type="month" value={e.start} onChange={(v) => up({ start: v })} />
              <TextField label="Conclusão (ou previsão)" type="month" value={e.current ? "" : e.end} onChange={(v) => up({ end: v })} />
              <CheckField label="Em andamento" checked={e.current} onChange={(v) => up({ current: v, end: v ? "" : e.end })} />
            </div>
          )}
        </ListEditor>
      );
      case 4: return (
        <ListEditor items={data.courses} onChange={(courses) => setData((d) => ({ ...d, courses }))}
          newItem={() => ({ id: uid(), name: "", institution: "", hours: "", completedAt: "", certificateUrl: "" })}
          addLabel="Adicionar curso ou certificado" itemLabel={(c, i) => c.name || `Curso ${i + 1}`}>
          {(c, up) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Nome do curso" value={c.name} onChange={(v) => up({ name: v })} />
              <TextField label="Instituição" value={c.institution} onChange={(v) => up({ institution: v })} />
              <TextField label="Carga horária (horas, opcional)" inputMode="numeric" value={c.hours} onChange={(v) => up({ hours: v.replace(/\D/g, "") })} />
              <TextField label="Conclusão" type="month" value={c.completedAt} onChange={(v) => up({ completedAt: v })} />
              <div className="sm:col-span-2"><TextField label="Link do certificado (opcional)" type="url" value={c.certificateUrl} onChange={(v) => up({ certificateUrl: v })} /></div>
            </div>
          )}
        </ListEditor>
      );
      case 5: return (
        <div className="space-y-4">
          <Notice tone="info">Liste habilidades como texto, sem barras de nível (ex.: “Excel: 80%”) — elas confundem os sistemas ATS.</Notice>
          <TagInput label="Habilidades técnicas" values={data.skills.technical} onChange={(v) => skills({ technical: v })} />
          <TagInput label="Ferramentas e tecnologias" values={data.skills.tools} onChange={(v) => skills({ tools: v })} />
          <TagInput label="Competências interpessoais" values={data.skills.soft} onChange={(v) => skills({ soft: v })} />
          <TagInput label="Conhecimentos específicos da área" values={data.skills.domain} onChange={(v) => skills({ domain: v })} />
        </div>
      );
      case 6: return (
        <div className="space-y-8">
          <section><h3 className="mb-2 text-lg font-extrabold">Idiomas</h3>
            <ListEditor items={data.extras.languages} onChange={(languages) => extras({ languages })} newItem={() => ({ id: uid(), name: "", level: "" })} addLabel="Adicionar idioma" itemLabel={(l, i) => l.name || `Idioma ${i + 1}`}>
              {(l, up) => (<div className="grid gap-4 sm:grid-cols-2"><TextField label="Idioma" value={l.name} onChange={(v) => up({ name: v })} /><SelectField label="Nível real" value={l.level} onChange={(v) => up({ level: v })} options={["", ...LANGUAGE_LEVELS]} /></div>)}
            </ListEditor></section>
          <section><h3 className="mb-2 text-lg font-extrabold">Projetos</h3>
            <ListEditor items={data.extras.projects} onChange={(projects) => extras({ projects })} newItem={() => ({ id: uid(), name: "", description: "", url: "" })} addLabel="Adicionar projeto" itemLabel={(p, i) => p.name || `Projeto ${i + 1}`}>
              {(p, up) => (<div className="space-y-4"><TextField label="Nome" value={p.name} onChange={(v) => up({ name: v })} /><AreaField label="Descrição" rows={3} value={p.description} onChange={(v) => up({ description: v })} /><TextField label="Link" type="url" value={p.url} onChange={(v) => up({ url: v })} /></div>)}
            </ListEditor></section>
          <section><h3 className="mb-2 text-lg font-extrabold">Trabalho voluntário</h3>
            <ListEditor items={data.extras.volunteer} onChange={(volunteer) => extras({ volunteer })} newItem={() => ({ id: uid(), organization: "", role: "", period: "", description: "" })} addLabel="Adicionar voluntariado" itemLabel={(v, i) => v.organization || `Voluntariado ${i + 1}`}>
              {(v, up) => (<div className="grid gap-4 sm:grid-cols-2"><TextField label="Organização" value={v.organization} onChange={(x) => up({ organization: x })} /><TextField label="Função" value={v.role} onChange={(x) => up({ role: x })} /><TextField label="Período" value={v.period} onChange={(x) => up({ period: x })} /><div className="sm:col-span-2"><AreaField label="Descrição" rows={3} value={v.description} onChange={(x) => up({ description: x })} /></div></div>)}
            </ListEditor></section>
          <section><h3 className="mb-2 text-lg font-extrabold">Prêmios</h3>
            <ListEditor items={data.extras.awards} onChange={(awards) => extras({ awards })} newItem={() => ({ id: uid(), title: "", issuer: "", year: "" })} addLabel="Adicionar prêmio" itemLabel={(a, i) => a.title || `Prêmio ${i + 1}`}>
              {(a, up) => (<div className="grid gap-4 sm:grid-cols-2"><TextField label="Título" value={a.title} onChange={(x) => up({ title: x })} /><TextField label="Concedido por" value={a.issuer} onChange={(x) => up({ issuer: x })} /><TextField label="Ano" inputMode="numeric" maxLength={4} value={a.year} onChange={(x) => up({ year: x.replace(/\D/g, "") })} /></div>)}
            </ListEditor></section>
          <section><h3 className="mb-2 text-lg font-extrabold">Publicações</h3>
            <ListEditor items={data.extras.publications} onChange={(publications) => extras({ publications })} newItem={() => ({ id: uid(), title: "", venue: "", year: "", url: "" })} addLabel="Adicionar publicação" itemLabel={(a, i) => a.title || `Publicação ${i + 1}`}>
              {(a, up) => (<div className="grid gap-4 sm:grid-cols-2"><TextField label="Título" value={a.title} onChange={(x) => up({ title: x })} /><TextField label="Veículo" value={a.venue} onChange={(x) => up({ venue: x })} /><TextField label="Ano" inputMode="numeric" maxLength={4} value={a.year} onChange={(x) => up({ year: x.replace(/\D/g, "") })} /><TextField label="Link" type="url" value={a.url} onChange={(x) => up({ url: x })} /></div>)}
            </ListEditor></section>
          <section><h3 className="mb-2 text-lg font-extrabold">Certificações profissionais</h3>
            <ListEditor items={data.extras.certifications} onChange={(certifications) => extras({ certifications })} newItem={() => ({ id: uid(), name: "", issuer: "", year: "" })} addLabel="Adicionar certificação" itemLabel={(a, i) => a.name || `Certificação ${i + 1}`}>
              {(a, up) => (<div className="grid gap-4 sm:grid-cols-2"><TextField label="Nome" value={a.name} onChange={(x) => up({ name: x })} /><TextField label="Emissor" value={a.issuer} onChange={(x) => up({ issuer: x })} /><TextField label="Ano" inputMode="numeric" maxLength={4} value={a.year} onChange={(x) => up({ year: x.replace(/\D/g, "") })} /></div>)}
            </ListEditor></section>
          <AreaField label="Outras informações relevantes" rows={4} value={data.extras.other} onChange={(v) => extras({ other: v })} hint="Disponibilidade, CNH categoria, etc. Evite CPF, RG e estado civil." />
        </div>
      );
      case 7: return (
        <TemplateStep design={design} onDesign={(d) => setPayload((p) => ({ ...p, design: d }))} resumeId={resumeId}
          hasPhoto={Boolean(data.personal.photoPath)} photoUrl={photoUrl} enabledTemplates={enabledTemplates}
          onPhoto={(path, url) => { personal({ photoPath: path }); setPhotoUrl(url); }} />
      );
      default: return (
        <div className="space-y-6">
          <p className="text-muted">Veja a nota do seu currículo para o modelo escolhido e melhore até achar que está bom. Você pode voltar a qualquer etapa e a nota se atualiza na hora.</p>
          <AtsCard data={data} design={design} />
          <AiPanel resumeId={resumeId} data={data} flush={flush} hasConsent={aiConsent} aiEnabled={aiEnabled}
            onApply={(d) => setData(() => d)} />
          {issues.length ? <Notice tone="warn">{issues.join(" ")}</Notice> : null}
          <Button onClick={goPreview} disabled={goingToPreview || issues.length > 0} className="w-full sm:w-auto">{goingToPreview ? "Salvando…" : "Ver prévia do currículo"}</Button>
        </div>
      );
    }
  })();

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-3 sm:p-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="sr-only" htmlFor="title">Título do currículo</label>
          <input id="title" value={payload.title} onChange={(e) => setPayload((p) => ({ ...p, title: e.target.value }))} maxLength={100}
            className="min-h-11 min-w-0 flex-1 rounded-xl bg-white px-3 text-lg font-extrabold ring-1 ring-zinc-300" />
          <p role="status" aria-live="polite" className={`text-sm font-bold ${status === "saved" ? "text-emerald-700" : status === "error" || status === "offline" ? "text-red-700" : "text-muted"}`}>{STATUS_TEXT[status]}</p>
        </div>
        <nav aria-label="Etapas">
          <p className="mb-2 text-sm font-bold text-muted">Etapa {step + 1} de {STEPS.length}</p>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-300" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
            <div className="bar-grow h-full bg-brand" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
          <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <li key={s}>
                <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
                  className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-bold ${i === step ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-zinc-300"}`}>{i + 1}. {s}</button>
              </li>
            ))}
          </ol>
        </nav>
      </Card>

      <Card>
        <div key={step} className="step-enter">
          <h2 className="text-2xl font-extrabold">{STEPS[step]}</h2>
          <p className="mb-4 mt-1 text-sm text-muted">{TIPS[step]}</p>
          {body}
        </div>
      </Card>

      <div className="sticky bottom-0 -mx-1 flex justify-between gap-3 bg-char/95 p-3 backdrop-blur">
        <Button variant="light" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Voltar</Button>
        {step < STEPS.length - 1 ? <Button onClick={() => setStep((s) => s + 1)}>Continuar</Button> : null}
      </div>
    </div>
  );
}
