import type { ResumeData } from "./schema";

export type SummaryLength = "short" | "detailed";

const MONTH_RE = /^(\d{4})-(\d{2})$/;
const toIndex = (m: string) => { const x = MONTH_RE.exec(m); return x ? Number(x[1]) * 12 + Number(x[2]) - 1 : null; };

/** Meses de experiência (união dos períodos informados, sem contar sobreposição duas vezes). */
export function experienceMonths(data: ResumeData, now = new Date()): number {
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const spans = data.experience
    .map((e) => {
      const s = toIndex(e.start);
      if (s === null) return null;
      const end = e.current ? nowIdx : (toIndex(e.end) ?? s);
      return [s, Math.max(s, end) + 1] as [number, number];
    })
    .filter((x): x is [number, number] => x !== null)
    .sort((a, b) => a[0] - b[0]);
  let total = 0, curEnd = -Infinity;
  for (const [s, e] of spans) {
    if (e <= curEnd) continue;
    total += e - Math.max(s, curEnd);
    curEnd = e;
  }
  return total;
}

function expText(months: number): string {
  if (months < 6) return "";
  if (months < 12) return `${months} meses`;
  const y = Math.floor(months / 12);
  const rest = months % 12;
  const base = `${y} ${y === 1 ? "ano" : "anos"}`;
  return rest >= 6 ? `mais de ${base}` : base;
}

const lc = (s: string) => (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(s) && !/[A-ZÀ-Ý]/.test(s.slice(1)) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const list = (items: string[]) => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`);
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * Cria o resumo profissional A PARTIR DO QUE O USUÁRIO INFORMOU (cargo, palavras-chave,
 * experiências, formação, idiomas). Não inventa empresas, números, cursos nem competências.
 * `variant` alterna a redação a cada clique em "gerar novamente".
 */
export function generateSummary(data: ResumeData, length: SummaryLength, variant = 0, now = new Date()): string {
  const role = clean(data.objective.targetRole).split(" / ")[0] || "Profissional";
  const kws = [...new Set([...data.objective.keywords, ...data.skills.technical].map(clean).filter(Boolean))].map(lc);
  const soft = data.skills.soft.map(clean).filter(Boolean).map(lc);
  const months = experienceMonths(data, now);
  const exp = expText(months);
  const companies = [...new Set(data.experience.filter((e) => e.company).map((e) => clean(e.company)))];
  const v = Math.abs(variant) % 3;

  const open = exp
    ? [`${role} com ${exp} de experiência`, `${role} com ${exp} de atuação na área`, `Profissional de ${lc(role)} com ${exp} de vivência prática`][v]
    : [`${role} em busca de uma oportunidade`, `${role} comprometido(a) com o aprendizado e o crescimento profissional`, `Profissional de ${lc(role)} em início de trajetória`][v];

  const skillsShort = kws.length ? [`, com habilidades em ${list(kws.slice(0, 4))}`, `, com foco em ${list(kws.slice(0, 4))}`, `, com domínio de ${list(kws.slice(0, 4))}`][v] : "";

  if (length === "short") {
    const avail = data.personal.availability ? ` Disponibilidade: ${lc(data.personal.availability)}.` : "";
    return `${open}${skillsShort}.${avail}`;
  }

  const sentences: string[] = [];
  const past = companies.length ? [`, com passagem por ${list(companies.slice(0, 2))}`, `, tendo atuado em ${list(companies.slice(0, 2))}`, `, com experiência em ${list(companies.slice(0, 2))}`][v] : "";
  sentences.push(`${open}${past}.`);
  if (kws.length) sentences.push([`Possui habilidades em ${list(kws.slice(0, 6))}.`, `Atuação voltada a ${list(kws.slice(0, 6))}.`, `Competências práticas em ${list(kws.slice(0, 6))}.`][v]);
  if (soft.length) sentences.push([`Perfil caracterizado por ${list(soft.slice(0, 4))}.`, `Destaca-se por ${list(soft.slice(0, 4))}.`, `Entre suas qualidades estão ${list(soft.slice(0, 4))}.`][v]);
  const edu = data.education.find((e) => e.course || e.level);
  if (edu) {
    const what = [edu.level, edu.course].filter(Boolean).join(" em ");
    sentences.push(edu.current ? `Cursando ${lc(what)}.` : `Formação: ${what}.`);
  }
  const langs = data.extras.languages.filter((l) => l.name);
  if (langs.length) sentences.push(`Idiomas: ${list(langs.map((l) => (l.level ? `${l.name} (${lc(l.level)})` : l.name)))}.`);
  const extra = [data.personal.cnh ? `CNH categoria ${data.personal.cnh}` : "", data.personal.availability ? `disponibilidade ${lc(data.personal.availability)}` : ""].filter(Boolean);
  if (extra.length) sentences.push(`${extra.join(", ").replace(/^./, (c) => c.toUpperCase())}.`);
  const goal = [data.objective.jobType && data.objective.jobType !== "Qualquer" ? ` (${data.objective.jobType})` : ""][0];
  sentences.push([`Busca oportunidade${goal} para aplicar e desenvolver suas habilidades.`, `Objetivo: contribuir com os resultados da empresa${goal} e crescer profissionalmente.`, `Interessado(a) em oportunidades${goal} em que possa agregar e evoluir.`][v]);
  return sentences.join(" ");
}
