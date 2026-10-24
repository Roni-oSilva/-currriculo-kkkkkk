import { z } from "zod";
import { cleanText, isSafeHttpUrl } from "@/lib/security/sanitize";

const text = (max: number) =>
  z.string().max(max).transform(cleanText).default("");

/** "linkedin.com/in/x" vira "https://linkedin.com/in/x"; "javascript:..." continua inválido. */
const withScheme = (v: string) => (v && !/^[a-z][a-z0-9+.-]*:/i.test(v) ? `https://${v.replace(/^\/+/, "")}` : v);

const url = z
  .string()
  .max(300)
  .transform((v) => withScheme(cleanText(v)))
  .refine((v) => v === "" || isSafeHttpUrl(v), "Informe uma URL começando com http:// ou https://")
  .default("");

const month = z
  .string()
  .transform(cleanText)
  .refine((v) => v === "" || /^\d{4}-(0[1-9]|1[0-2])$/.test(v), "Use o formato AAAA-MM")
  .default("");

const id = z.string().min(1).max(40).default(() => crypto.randomUUID());

export const SECTION_KEYS = [
  "objective",
  "experience",
  "education",
  "courses",
  "skills",
  "languages",
  "projects",
  "volunteer",
  "awards",
  "publications",
  "certifications",
  "other",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  objective: "Resumo profissional",
  experience: "Experiência profissional",
  education: "Formação acadêmica",
  courses: "Cursos e certificados",
  skills: "Habilidades",
  languages: "Idiomas",
  projects: "Projetos",
  volunteer: "Trabalho voluntário",
  awards: "Prêmios",
  publications: "Publicações",
  certifications: "Certificações profissionais",
  other: "Informações adicionais",
};

export const LANGUAGE_LEVELS = ["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"] as const;
export const JOB_TYPES = ["", "CLT", "PJ / Freelancer", "Estágio", "Jovem aprendiz", "Temporário", "Primeiro emprego", "Qualquer"] as const;
export const EDUCATION_LEVELS = [
  "", "Ensino Fundamental", "Ensino Médio", "Técnico", "Tecnólogo", "Graduação", "Pós-graduação",
  "MBA", "Mestrado", "Doutorado", "Outro",
] as const;

const experience = z.object({
  id,
  company: text(120),
  role: text(120),
  city: text(80),
  start: month,
  end: month,
  current: z.boolean().default(false),
  activities: text(2000),
  achievements: text(2000),
});

const education = z.object({
  id,
  institution: text(140),
  course: text(140),
  level: text(60),
  start: month,
  end: month,
  current: z.boolean().default(false),
});

const course = z.object({
  id,
  name: text(140),
  institution: text(140),
  hours: text(10),
  completedAt: month,
  certificateUrl: url,
});

const stringList = z.array(z.string().max(60).transform(cleanText)).max(40).default([]).transform((l) => l.filter(Boolean));

export const resumeDataSchema = z.object({
  personal: z
    .object({
      fullName: text(120),
      email: text(160),
      phone: text(30),
      city: text(80),
      state: text(40),
      address: text(160),
      cnh: text(10),
      availability: text(60),
      linkedin: url,
      website: url,
      otherLinks: z
        .array(z.object({ label: text(40), url }))
        .max(6)
        .default([]),
      // Definido apenas pelo servidor no upload; qualquer valor vindo do cliente é descartado.
      photoPath: z.string().max(200).default(""),
    })
    .prefault({}),
  objective: z
    .object({
      targetRole: text(120),
      area: text(120),
      summary: text(1500),
      keywords: stringList,
      jobType: text(40),
      jobDescription: text(6000),
    })
    .prefault({}),
  experience: z.array(experience).max(30).default([]),
  education: z.array(education).max(20).default([]),
  courses: z.array(course).max(100).default([]),
  skills: z
    .object({ technical: stringList, tools: stringList, soft: stringList, domain: stringList })
    .prefault({}),
  extras: z
    .object({
      languages: z.array(z.object({ id, name: text(60), level: text(30) })).max(15).default([]),
      projects: z.array(z.object({ id, name: text(120), description: text(1200), url })).max(20).default([]),
      volunteer: z.array(z.object({ id, organization: text(120), role: text(120), period: text(60), description: text(1000) })).max(20).default([]),
      awards: z.array(z.object({ id, title: text(140), issuer: text(120), year: text(10) })).max(20).default([]),
      publications: z.array(z.object({ id, title: text(200), venue: text(120), year: text(10), url })).max(30).default([]),
      certifications: z.array(z.object({ id, name: text(140), issuer: text(120), year: text(10) })).max(30).default([]),
      other: text(2000),
    })
    .prefault({}),
});
export type ResumeData = z.infer<typeof resumeDataSchema>;

export const ACCENT_COLORS = [
  { id: "navy", label: "Azul-marinho", hex: "#1e3a5f" },
  { id: "blue", label: "Azul", hex: "#1d4ed8" },
  { id: "teal", label: "Verde-azulado", hex: "#0f766e" },
  { id: "green", label: "Verde", hex: "#166534" },
  { id: "purple", label: "Roxo", hex: "#6d28d9" },
  { id: "burgundy", label: "Bordô", hex: "#9f1239" },
  { id: "amber", label: "Âmbar", hex: "#b45309" },
  { id: "slate", label: "Grafite", hex: "#334155" },
  { id: "black", label: "Preto", hex: "#111111" },
] as const;
export const ACCENT_IDS = ACCENT_COLORS.map((c) => c.id) as [string, ...string[]];

export const TEMPLATE_IDS = ["classic", "modern", "minimal", "first-job", "creative"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const designSchema = z.object({
  template: z.enum(TEMPLATE_IDS).default("classic"),
  accent: z.enum(ACCENT_IDS).default("navy"),
  showPhoto: z.boolean().default(false),
  sectionOrder: z
    .array(z.enum(SECTION_KEYS))
    .default([...SECTION_KEYS])
    .transform((order) => {
      const seen = new Set<SectionKey>();
      const out: SectionKey[] = [];
      for (const k of order) if (!seen.has(k)) (seen.add(k), out.push(k));
      for (const k of SECTION_KEYS) if (!seen.has(k)) out.push(k);
      return out;
    }),
  hiddenSections: z.array(z.enum(SECTION_KEYS)).default([]),
});
export type ResumeDesign = z.infer<typeof designSchema>;

export const resumePayloadSchema = z.object({
  title: z.string().max(100).transform(cleanText).default("Meu currículo"),
  data: resumeDataSchema,
  design: designSchema,
});
export type ResumePayload = z.infer<typeof resumePayloadSchema>;

export function accentHex(id: string): string {
  return ACCENT_COLORS.find((c) => c.id === id)?.hex ?? ACCENT_COLORS[0].hex;
}

/** Dados mínimos para gerar o documento: nome e e-mail ou telefone. */
export function minimumDataIssues(data: ResumeData): string[] {
  const issues: string[] = [];
  if (!data.personal.fullName) issues.push("Informe seu nome completo.");
  if (!data.personal.email && !data.personal.phone) issues.push("Informe ao menos um contato (e-mail ou telefone).");
  return issues;
}

export function emptyResume(): ResumePayload {
  return resumePayloadSchema.parse({ data: {}, design: {} });
}
