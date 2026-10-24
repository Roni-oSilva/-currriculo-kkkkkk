import type { ResumeData, ResumeDesign } from "./schema";
import { getTemplate } from "./templates";
import { minimumDataIssues } from "./schema";

export interface AtsItem {
  id: string;
  title: string;
  points: number;
  max: number;
  status: "ok" | "warn" | "bad";
  tip: string;
}

export interface AtsReport {
  /** 0 a 10, uma casa decimal */
  score: number;
  verdict: "alta" | "boa" | "baixa";
  headline: string;
  templateNote: string;
  items: AtsItem[];
}

const SENSITIVE = /\b(cpf|rg|estado civil|solteir[oa]|casad[oa]|divorciad[oa]|cnh)\b|\d{3}\.\d{3}\.\d{3}-\d{2}/i;

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));
const status = (p: number, max: number): AtsItem["status"] => (p >= max * 0.85 ? "ok" : p >= max * 0.5 ? "warn" : "bad");

function allText(d: ResumeData): string {
  const parts: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, val] of Object.entries(v)) if (k !== "id") walk(val);
  };
  walk({ ...d, personal: { ...d.personal, photoPath: "" } });
  return parts.join("\n");
}

/** Estimativa de páginas quando a contagem real ainda não é conhecida. */
export function estimatePages(d: ResumeData): number {
  const chars = allText(d).length;
  return Math.max(1, Math.ceil(chars / 3300));
}

/**
 * Nota de 0 a 10 de aderência a ATS/RH para o modelo escolhido. Regras determinísticas
 * (sem serviços externos): estrutura recomendada, resumo, experiência em ordem cronológica inversa com
 * resultados mensuráveis, formação, habilidades, tamanho e compatibilidade do modelo.
 */
export function scoreResume(d: ResumeData, design: ResumeDesign, pageCount?: number): AtsReport {
  const t = getTemplate(design.template);
  const items: AtsItem[] = [];
  const add = (id: string, title: string, points: number, max: number, tip: string) => {
    const p = Math.round(clamp(points, max) * 100) / 100;
    items.push({ id, title, points: p, max, status: status(p, max), tip });
  };
  const hasExp = d.experience.some((e) => e.company || e.role);
  const firstJob = !hasExp;

  // 1. Cabeçalho
  const p = d.personal;
  let c = 0;
  if (p.fullName.trim().split(/\s+/).length >= 2) c += 0.3;
  if (p.phone) c += 0.25;
  if (p.email) c += 0.25;
  if (p.city && p.state) c += 0.1;
  if (p.linkedin) c += 0.1;
  add("contact", "Cabeçalho e contato", c, 1, c >= 0.95 ? "Contato completo." : "Inclua nome completo, telefone, e-mail profissional, cidade/UF e link do LinkedIn.");

  // 2. Resumo
  const sum = d.objective.summary.trim().length;
  const sumPts = sum === 0 ? 0 : sum < 120 ? 0.6 : sum <= 650 ? 1.5 : 1;
  add("summary", "Resumo profissional", sumPts, 1.5,
    sum === 0 ? "Adicione um resumo de 3 a 5 linhas com trajetória, competências e foco de atuação."
      : sum < 120 ? "Resumo curto demais: chegue a 3–5 linhas com competências e objetivo."
      : sum > 650 ? "Resumo longo: reduza para 3–5 linhas." : "Resumo no tamanho ideal.");

  // 3. Experiência (ou alternativas para primeiro emprego)
  if (!firstJob) {
    const exps = d.experience.filter((e) => e.company || e.role);
    let pts = 0;
    const complete = exps.filter((e) => e.company && e.role && e.start).length / exps.length;
    pts += complete * 0.8;
    const bullets = exps.map((e) => e.activities.split("\n").filter((l) => l.trim()).length);
    pts += (bullets.filter((n) => n >= 2).length / exps.length) * 0.8;
    const withMetric = exps.filter((e) => /\d/.test(e.achievements)).length;
    pts += (withMetric / exps.length) * 0.9;
    const starts = exps.map((e) => e.start).filter(Boolean);
    const sortedDesc = [...starts].sort().reverse();
    const ordered = starts.every((s, i) => s === sortedDesc[i]);
    const tips: string[] = [];
    if (complete < 1) tips.push("informe empresa, cargo e mês/ano de início em todas as experiências");
    if (bullets.some((n) => n < 2)) tips.push("descreva ao menos 2 responsabilidades em tópicos por experiência");
    if (withMetric < exps.length) tips.push("acrescente resultados com números reais (ex.: “atendi 40 clientes/dia”) — só se forem verdadeiros");
    if (!ordered) tips.push("ordene da experiência mais recente para a mais antiga");
    add("experience", "Experiência profissional", pts, 2.5, tips.length ? `Melhore: ${tips.join("; ")}.` : "Experiências completas, em ordem cronológica inversa e com resultados.");
  } else {
    const alt = d.education.length + d.courses.length + d.extras.projects.length + d.extras.volunteer.length;
    add("experience", "Experiência / alternativas", alt >= 4 ? 2.5 : alt >= 2 ? 1.8 : alt >= 1 ? 1.1 : 0.3, 2.5,
      "Sem experiência formal? Destaque cursos, projetos, voluntariado e estágios — o modelo “Primeiro emprego” prioriza isso.");
  }

  // 4. Formação
  const edu = d.education.filter((e) => e.institution || e.course);
  const eduOk = edu.length ? edu.filter((e) => e.course && e.institution && (e.end || e.current)).length / edu.length : 0;
  add("education", "Formação acadêmica", edu.length ? 0.4 + eduOk * 0.6 : 0, 1,
    !edu.length ? "Informe nível, curso, instituição e ano de conclusão (ou previsão)." : eduOk < 1 ? "Complete curso, instituição e ano de conclusão/previsão." : "Formação completa.");

  // 5. Habilidades e idiomas
  const skillCount = Object.values(d.skills).reduce((n, l) => n + l.length, 0);
  add("skills", "Habilidades (hard e soft skills)", skillCount >= 8 ? 1.2 : skillCount >= 5 ? 0.9 : skillCount >= 2 ? 0.5 : 0, 1.2,
    skillCount >= 8 ? "Boa variedade de habilidades." : "Liste ao menos 5–8 habilidades: softwares, ferramentas e competências, usando palavras-chave da vaga.");
  const langs = d.extras.languages.filter((l) => l.name);
  add("languages", "Idiomas com nível real", langs.length ? (langs.every((l) => l.level) ? 0.5 : 0.25) : 0.15, 0.5,
    langs.length ? (langs.every((l) => l.level) ? "Idiomas com nível informado." : "Informe o nível de cada idioma.") : "Informe seus idiomas e o nível real (básico, intermediário, fluente…).");

  // 6. Tamanho
  const pages = pageCount ?? estimatePages(d);
  const maxPages = hasExp && d.experience.length >= 4 ? 2 : 1;
  const lenPts = pages <= maxPages ? 1 : pages === maxPages + 1 && pages <= 2 ? 0.6 : 0.2;
  add("length", "Tamanho (1 a 2 páginas)", lenPts, 1,
    pages <= maxPages ? `${pages} página(s): no ponto.` : pages <= 2 ? "Ficou com 2 páginas: para início de carreira, resuma para 1." : "Mais de 2 páginas: corte o que não ajuda na vaga.");

  // 7. Layout / modelo
  let layout = 1.3 * t.atsFactor;
  const layoutTips: string[] = [t.atsNote];
  if (design.showPhoto && t.supportsPhoto && p.photoPath) { layout -= 0.5; layoutTips.push("Foto: o RH costuma recomendar evitá-la, a menos que a vaga exija."); }
  if (SENSITIVE.test(allText(d))) { layout -= 0.4; layoutTips.push("Remova CPF, RG, CNH e estado civil — não ajudam e expõem seus dados."); }
  if (p.address) { layout -= 0.1; layoutTips.push("Endereço completo é desnecessário: cidade e estado bastam."); }
  add("layout", "Compatibilidade do modelo", layout, 1.3, layoutTips.join(" "));

  // total máximo = 1 + 1.5 + 2.5 + 1 + 1.2 + 0.5 + 1 + 1.3 = 10
  const minIssues = minimumDataIssues(d);
  const raw = items.reduce((n, i) => n + i.points, 0);
  const score = Math.round((minIssues.length ? Math.min(raw, 3) : raw) * 10) / 10;
  const verdict: AtsReport["verdict"] = score >= 8.5 ? "alta" : score >= 6.5 ? "boa" : "baixa";
  const headline =
    verdict === "alta" ? "Alta chance de passar na triagem com este modelo."
    : verdict === "boa" ? "Boa chance, mas dá para melhorar antes de enviar."
    : "Chance baixa: ajuste os pontos abaixo para aumentar a aceitação.";
  return { score, verdict, headline, templateNote: t.atsNote, items };
}
