import type { SectionKey, TemplateId } from "./schema";

export type TemplateLayout = "single" | "side-left" | "side-right";

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  layout: TemplateLayout;
  /** Cabeçalho dos modelos de coluna única */
  header: "center" | "left" | "panel";
  /** Estilo dos títulos de seção */
  heading: "underline" | "caps" | "bar" | "side-line" | "tab";
  /** Barra lateral: clara (tom da cor de destaque) ou sólida (cor de destaque) */
  sidebarTone: "tint" | "solid";
  photoShape: "circle" | "rounded" | "square";
  photoSize: number;
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

// Ordem recomendada por RH: resumo, experiência, formação, habilidades e idiomas.
const standard: SectionKey[] = [
  "objective", "experience", "education", "skills", "languages", "courses",
  "certifications", "projects", "volunteer", "awards", "publications", "other",
];

export const TEMPLATES: Record<TemplateId, TemplateConfig> = {
  classic: {
    id: "classic", name: "Clássico e formal",
    description: "Fonte com serifa, cabeçalho centralizado e títulos sublinhados. Coluna única, sem ornamentos: o formato mais aceito por RH. Foto opcional, discreta.",
    layout: "single", header: "center", heading: "underline", sidebarTone: "tint", photoShape: "circle", photoSize: 62,
    font: "Times-Roman", supportsPhoto: true, defaultAccent: "slate", defaultOrder: standard, baseFontSize: 10.5, sectionGap: 12, pagePadding: 44,
    atsFactor: 1, recommendedByHr: true, atsNote: "Modelo mais aceito por RH e ATS: coluna única, fundo branco, texto preto e fonte sóbria.",
  },
  modern: {
    id: "modern", name: "Moderno com foto",
    description: "Barra lateral em tom suave com foto redonda, contato, habilidades e idiomas. Conteúdo principal à direita, com títulos marcados.",
    layout: "side-left", header: "left", heading: "bar", sidebarTone: "tint", photoShape: "circle", photoSize: 104,
    font: "Helvetica", supportsPhoto: true, defaultAccent: "green", defaultOrder: standard, baseFontSize: 9.8, sectionGap: 13, pagePadding: 34,
    atsFactor: 0.8, recommendedByHr: false, atsNote: "Duas colunas: o texto continua selecionável e em ordem de leitura, mas sistemas de triagem antigos podem misturar colunas.",
  },
  minimal: {
    id: "minimal", name: "Minimalista",
    description: "Muito espaço em branco, títulos em caixa alta com fio fino e nenhum elemento gráfico. Sem foto. Máxima compatibilidade com ATS.",
    layout: "single", header: "left", heading: "caps", sidebarTone: "tint", photoShape: "circle", photoSize: 0,
    font: "Helvetica", supportsPhoto: false, defaultAccent: "black", defaultOrder: standard, baseFontSize: 10, sectionGap: 15, pagePadding: 52,
    atsFactor: 1, recommendedByHr: true, atsNote: "Variação moderna do clássico: sobriedade, espaços estratégicos e nenhum elemento gráfico.",
  },
  "first-job": {
    id: "first-job", name: "Primeiro emprego",
    description: "Cabeçalho em painel com foto quadrada arredondada e títulos com faixa lateral. Prioriza objetivo, formação, cursos e habilidades.",
    layout: "single", header: "panel", heading: "side-line", sidebarTone: "tint", photoShape: "rounded", photoSize: 82,
    font: "Helvetica", supportsPhoto: true, defaultAccent: "teal", baseFontSize: 10.3, sectionGap: 13, pagePadding: 38,
    atsFactor: 0.9, recommendedByHr: false, atsNote: "Coluna única, com cabeçalho em painel colorido. Boa leitura por ATS.",
    defaultOrder: ["objective", "education", "courses", "skills", "languages", "projects", "volunteer", "experience", "certifications", "awards", "publications", "other"],
  },
  creative: {
    id: "creative", name: "Criativo com foto grande",
    description: "Barra lateral sólida à direita com foto grande, contato e competências em destaque. Nome em tamanho grande à esquerda. Para portfólio e áreas criativas.",
    layout: "side-right", header: "left", heading: "tab", sidebarTone: "solid", photoShape: "rounded", photoSize: 128,
    font: "Helvetica", supportsPhoto: true, defaultAccent: "black", baseFontSize: 9.8, sectionGap: 13, pagePadding: 34,
    atsFactor: 0.6, recommendedByHr: false, atsNote: "Visual expressivo em duas colunas. Para vagas com triagem automática, prefira Clássico ou Minimalista.",
    defaultOrder: ["objective", "projects", "experience", "education", "skills", "languages", "courses", "certifications", "awards", "publications", "volunteer", "other"],
  },
};

export const TEMPLATE_LIST = Object.values(TEMPLATES);

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES[id as TemplateId] ?? TEMPLATES.classic;
}
