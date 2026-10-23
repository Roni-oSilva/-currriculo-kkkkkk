import { resumePayloadSchema, type ResumePayload, type TemplateId } from "./schema";
import { getTemplate } from "./templates";
import sharp from "sharp";

/** Dados ilustrativos usados apenas nos exemplos da página inicial e em testes. */
export function sampleResume(template: TemplateId): ResumePayload {
  const t = getTemplate(template);
  const firstJob = template === "first-job";
  return resumePayloadSchema.parse({
    title: "Exemplo",
    design: { template, accent: t.defaultAccent, showPhoto: t.supportsPhoto && template !== "classic", sectionOrder: t.defaultOrder },
    data: {
      personal: {
        fullName: "Maria Exemplo da Silva",
        email: "maria.exemplo@email.com",
        phone: "(11) 90000-0000",
        city: "São Paulo",
        state: "SP",
        linkedin: "https://linkedin.com/in/maria-exemplo",
      },
      objective: {
        targetRole: firstJob ? "Assistente administrativo" : "Analista de atendimento",
        area: "Administração",
        summary: firstJob
          ? "Estudante de Administração em busca da primeira oportunidade, com boa comunicação, organização e vontade de aprender."
          : "Profissional com experiência em atendimento ao cliente e rotinas administrativas, organizada e orientada a resultados.",
      },
      experience: firstJob ? [] : [
        { company: "Empresa Exemplo Ltda.", role: "Atendente", city: "São Paulo", start: "2021-03", current: true,
          activities: "Atendimento presencial e por telefone\nRegistro de solicitações em sistema interno", achievements: "Redução do tempo médio de resposta (exemplo ilustrativo)" },
        { company: "Comércio Modelo", role: "Auxiliar administrativo", start: "2019-02", end: "2021-02",
          activities: "Organização de documentos\nApoio ao controle de estoque" },
      ],
      education: [{ institution: "Universidade Exemplo", course: "Administração", level: "Graduação", start: "2022-02", current: true }],
      courses: [{ name: "Excel intermediário", institution: "Escola Modelo", hours: "30", completedAt: "2023-06" }],
      skills: { technical: ["Atendimento ao cliente", "Organização de documentos"], tools: ["Excel", "Word"], soft: ["Comunicação", "Trabalho em equipe"], domain: [] },
      extras: { languages: [{ name: "Português", level: "Nativo" }, { name: "Inglês", level: "Básico" }] },
    },
  });
}

/** Avatar ilustrativo (silhueta) usado só nos exemplos e testes. */
export async function samplePhoto(): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dbe4f5"/><stop offset="1" stop-color="#9db4de"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="155" r="68" fill="#5b6b8c"/><path d="M60 400 C60 290 130 250 200 250 C270 250 340 290 340 400 Z" fill="#5b6b8c"/></svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer();
}
