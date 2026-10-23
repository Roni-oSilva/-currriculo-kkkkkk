import type { SectionKey, TemplateId } from "./schema";

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  /** Aparência do cabeçalho */
  header: "left" | "center" | "band";
  /** Estilo dos títulos de seção */
  heading: "underline" | "caps-plain" | "bar" | "boxed";
  font: "Helvetica" | "Times-Roman";
  supportsPhoto: boolean;
  defaultAccent: string;
  defaultOrder: SectionKey[];
  baseFontSize: number;
  sectionGap: number;
  pagePadding: number;
  /** 0–1: quão bem o layout é lido por sistemas ATS */
  atsFactor: number;
  atsNote: string;
  recommendedByHr: boolean;
}

// Ordem recomendada por RH: resumo → experiência → formação → habilidades/idiomas.
const standard: SectionKey[] = [
  "objective", "experience", "education", "skills", "languages", "courses",
  "certifications", "projects", "volunteer", "awards", "publications", "other",
];

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  classic: {
    id: "classic", name: "Clássico e formal",
    description: "Tipografia com serifa, cabeçalho centralizado e títulos sublinhados. Ideal para áreas tradicionais.",
    header: "center", heading: "underline", font: "Times-Roman", supportsPhoto: true,
    defaultAccent: "navy", defaultOrder: standard, baseFontSize: 10.5, sectionGap: 12, pagePadding: 44,
    atsFactor: 1, recommendedByHr: true, atsNote: "Modelo mais aceito por RH e ATS: fundo branco, texto preto, fonte sóbria e tópicos claros.",
  },
  modern: {
    id: "modern", name: "Moderno corporativo",
    description: "Faixa colorida no topo e títulos em destaque. Visual atual, ainda 100% legível por ATS.",
    header: "band", heading: "bar", font: "Helvetica", supportsPhoto: true,
    defaultAccent: "blue", defaultOrder: standard, baseFontSize: 10, sectionGap: 12, pagePadding: 40,
    atsFactor: 0.85, recommendedByHr: false, atsNote: "Faixa colorida só no topo e coluna única: ainda legível por ATS, porém menos neutro que o clássico.",
  },
  minimal: {
    id: "minimal", name: "Minimalista",
    description: "Muito espaço em branco, sem ornamentos e sem foto. Máxima compatibilidade com ATS.",
    header: "left", heading: "caps-plain", font: "Helvetica", supportsPhoto: false,
    defaultAccent: "slate", defaultOrder: standard, baseFontSize: 10, sectionGap: 14, pagePadding: 48,
    atsFactor: 1, recommendedByHr: true, atsNote: "Variação moderna do clássico: sobriedade, espaços estratégicos e quase nenhum elemento gráfico.",
  },
  "first-job": {
    id: "first-job", name: "Primeiro emprego",
    description: "Prioriza objetivo, formação, cursos e habilidades. Perfeito para quem ainda não tem experiência.",
    header: "left", heading: "boxed", font: "Helvetica", supportsPhoto: true,
    defaultAccent: "teal", baseFontSize: 10.5, sectionGap: 12, pagePadding: 42,
    atsFactor: 0.9, recommendedByHr: false, atsNote: "Coluna única e foco em formação e cursos. Boa leitura por ATS; títulos em caixa colorida.",
    defaultOrder: ["objective", "education", "courses", "skills", "languages", "projects", "volunteer", "experience", "certifications", "awards", "publications", "other"],
  },
  creative: {
    id: "creative", name: "Criativo para portfólio",
    description: "Cabeçalho expressivo e links de portfólio em destaque, mantendo coluna única e texto selecionável.",
    header: "band", heading: "boxed", font: "Helvetica", supportsPhoto: true,
    defaultAccent: "purple", baseFontSize: 10, sectionGap: 12, pagePadding: 38,
    atsFactor: 0.65, recommendedByHr: false, atsNote: "Visual mais expressivo. Use para portfólio/design; para vagas com triagem automática prefira Clássico ou Minimalista.",
    defaultOrder: ["objective", "projects", "experience", "skills", "education", "courses", "certifications", "languages", "awards", "publications", "volunteer", "other"],
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES[id as TemplateId] ?? TEMPLATES.classic;
}
