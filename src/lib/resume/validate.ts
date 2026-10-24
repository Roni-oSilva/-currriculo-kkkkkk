import type { ResumeData, ResumeDesign } from "./schema";
import { getTemplate } from "./templates";

/** Etapas do assistente (índices): 0 Você · 1 Experiência · 2 Estudos · 3 Habilidades · 4 Extras · 5 Modelo · 6 Revisão */
export type StepErrors = Record<number, string[]>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digits = (s: string) => s.replace(/\D/g, "");

/**
 * Problemas reais (não apenas sugestões) em cada etapa. Etapas com problema ficam em vermelho.
 * Campos vazios e opcionais NÃO contam como erro; só dado preenchido pela metade ou inválido.
 */
export function stepErrors(d: ResumeData, design: ResumeDesign): StepErrors {
  const out: StepErrors = {};
  const add = (step: number, msg: string) => { (out[step] ??= []).push(msg); };
  const p = d.personal;

  // 0 · Você
  if (!p.fullName.trim()) add(0, "Informe o seu nome completo.");
  else if (p.fullName.trim().split(/\s+/).length < 2) add(0, "Escreva nome e sobrenome.");
  if (!p.email && !p.phone) add(0, "Informe um telefone ou e-mail para contato.");
  if (p.email && !EMAIL_RE.test(p.email)) add(0, "O e-mail parece incorreto.");
  if (p.phone && digits(p.phone).length < 10) add(0, "O telefone precisa ter DDD e número (10 ou 11 dígitos).");

  // 1 · Experiência
  d.experience.forEach((e, i) => {
    const filled = e.company || e.role || e.start || e.end || e.activities || e.achievements;
    if (!filled) return;
    const n = `Experiência ${i + 1}`;
    if (!e.role) add(1, `${n}: falta o cargo.`);
    if (!e.company) add(1, `${n}: falta a empresa.`);
    if (!e.start) add(1, `${n}: falta a data de início.`);
    if (!e.current && !e.end) add(1, `${n}: informe o término ou marque “Trabalho aqui atualmente”.`);
    if (e.start && e.end && !e.current && e.end < e.start) add(1, `${n}: o término é anterior ao início.`);
  });

  // 2 · Estudos
  d.education.forEach((e, i) => {
    if (!(e.institution || e.course || e.level || e.start || e.end)) return;
    const n = `Escolaridade ${i + 1}`;
    if (!e.level && !e.course) add(2, `${n}: escolha o nível ou informe o curso.`);
    if (!e.current && !e.end) add(2, `${n}: informe a conclusão ou marque “Ainda estou cursando”.`);
    if (e.start && e.end && !e.current && e.end < e.start) add(2, `${n}: a conclusão é anterior ao início.`);
  });
  d.courses.forEach((c, i) => { if ((c.institution || c.hours || c.completedAt || c.certificateUrl) && !c.name) add(2, `Curso ${i + 1}: falta o nome do curso.`); });

  // 3 · Habilidades e idiomas
  d.extras.languages.forEach((l, i) => {
    if (l.level && !l.name) add(3, `Idioma ${i + 1}: falta o nome do idioma.`);
    if (l.name && !l.level) add(3, `Idioma ${l.name}: informe o seu nível real.`);
  });

  // 4 · Extras
  d.extras.projects.forEach((x, i) => { if ((x.description || x.url) && !x.name) add(4, `Projeto ${i + 1}: falta o nome.`); });
  d.extras.volunteer.forEach((x, i) => { if ((x.role || x.period || x.description) && !x.organization) add(4, `Voluntariado ${i + 1}: falta a organização.`); });
  d.extras.awards.forEach((x, i) => { if ((x.issuer || x.year) && !x.title) add(4, `Prêmio ${i + 1}: falta o título.`); });
  d.extras.publications.forEach((x, i) => { if ((x.venue || x.year || x.url) && !x.title) add(4, `Publicação ${i + 1}: falta o título.`); });
  d.extras.certifications.forEach((x, i) => { if ((x.issuer || x.year) && !x.name) add(4, `Certificação ${i + 1}: falta o nome.`); });

  // 5 · Modelo
  const t = getTemplate(design.template);
  if (design.showPhoto && t.supportsPhoto && !p.photoPath) add(5, "A foto está ativada, mas nenhuma foto foi enviada. Envie uma foto ou desative.");

  return out;
}

export const stepErrorCount = (e: StepErrors) => Object.values(e).reduce((n, l) => n + l.length, 0);
