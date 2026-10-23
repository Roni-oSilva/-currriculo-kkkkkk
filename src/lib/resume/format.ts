import type { ResumeData, ResumeDesign, SectionKey } from "./schema";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatMonth(value: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  return `${MONTHS[Number(m[2]) - 1]}/${m[1]}`;
}

export function formatPeriod(start: string, end: string, current: boolean, currentLabel = "atual"): string {
  const s = formatMonth(start);
  const e = current ? currentLabel : formatMonth(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

/** 1000 → "R$ 10,00" (sem caracteres especiais, seguro para a marca d'água do PDF). */
export function brl(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function lines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function location(d: ResumeData): string {
  return [d.personal.city, d.personal.state].filter(Boolean).join(" - ");
}

export function contactItems(d: ResumeData): string[] {
  const p = d.personal;
  return [
    p.email,
    p.phone,
    location(d),
    p.address,
    p.linkedin && p.linkedin.replace(/^https?:\/\/(www\.)?/, ""),
    p.website && p.website.replace(/^https?:\/\/(www\.)?/, ""),
    ...p.otherLinks.filter((l) => l.url).map((l) => l.url.replace(/^https?:\/\//, "")),
  ].filter((x): x is string => Boolean(x));
}

export function sectionHasContent(key: SectionKey, d: ResumeData): boolean {
  switch (key) {
    case "objective": return Boolean(d.objective.summary);
    case "experience": return d.experience.some((e) => e.company || e.role);
    case "education": return d.education.some((e) => e.institution || e.course);
    case "courses": return d.courses.some((c) => c.name);
    case "skills": return Object.values(d.skills).some((l) => l.length > 0);
    case "languages": return d.extras.languages.some((l) => l.name);
    case "projects": return d.extras.projects.some((p) => p.name);
    case "volunteer": return d.extras.volunteer.some((v) => v.organization || v.role);
    case "awards": return d.extras.awards.some((a) => a.title);
    case "publications": return d.extras.publications.some((p) => p.title);
    case "certifications": return d.extras.certifications.some((c) => c.name);
    case "other": return Boolean(d.extras.other);
  }
}

export function visibleSections(d: ResumeData, design: ResumeDesign): SectionKey[] {
  return design.sectionOrder.filter((k) => !design.hiddenSections.includes(k) && sectionHasContent(k, d));
}

export function resumeFileName(d: ResumeData): string {
  const base = (d.personal.fullName || "curriculo")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `Curriculo_${base || "profissional"}.pdf`;
}
