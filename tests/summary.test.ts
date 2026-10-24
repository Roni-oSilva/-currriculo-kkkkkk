import { describe, expect, it } from "vitest";
import { experienceMonths, generateSummary } from "@/lib/resume/summary";
import { checkNoNewFacts, corpusOf } from "@/lib/ai/guard";
import { resumePayloadSchema } from "@/lib/resume/schema";
import { sampleResume } from "@/lib/resume/sample";

const NOW = new Date("2026-10-24");
const make = (patch: Record<string, unknown>) => resumePayloadSchema.parse({ design: {}, data: patch }).data;

describe("gerador de resumo a partir de palavras-chave", () => {
  it("calcula meses de experiência sem contar períodos sobrepostos", () => {
    const d = make({ experience: [{ start: "2020-01", end: "2020-12" }, { start: "2020-06", end: "2021-05" }, { start: "2024-01", current: true }] });
    // 2020-01..2021-05 = 17 meses; 2024-01..2026-10 = 34 meses
    expect(experienceMonths(d, NOW)).toBe(17 + 34);
    expect(experienceMonths(make({}), NOW)).toBe(0);
  });

  it("curto: 1–2 frases com cargo, anos de experiência e palavras-chave", () => {
    const d = make({ objective: { targetRole: "Faxineira", keywords: ["limpeza residencial", "organização", "pontualidade"] }, experience: [{ company: "Casa Azul", start: "2019-01", end: "2022-01" }] });
    const s = generateSummary(d, "short", 0, NOW);
    expect(s).toContain("Faxineira");
    expect(s).toContain("3 anos de experiência");
    expect(s).toContain("limpeza residencial, organização e pontualidade");
    expect(s.split(/[.!?]\s/).length).toBeLessThanOrEqual(2);
  });

  it("detalhado: usa empresa, formação, idiomas, CNH e disponibilidade informados e é mais longo", () => {
    const d = make({
      personal: { cnh: "B", availability: "Imediata" }, objective: { targetRole: "Vendedor(a) de loja", keywords: ["atendimento", "negociação"], jobType: "CLT" },
      skills: { soft: ["Comunicação", "Organização"] },
      experience: [{ company: "Loja Sol", start: "2021-01", current: true }],
      education: [{ level: "Ensino Médio", current: false }],
      extras: { languages: [{ name: "Inglês", level: "Básico" }] },
    });
    const short = generateSummary(d, "short", 0, NOW), long = generateSummary(d, "detailed", 0, NOW);
    expect(long.length).toBeGreaterThan(short.length * 2);
    for (const piece of ["Loja Sol", "Ensino Médio", "Inglês (básico)", "CNH categoria B", "disponibilidade imediata", "comunicação e organização", "(CLT)"]) expect(long).toContain(piece);
  });

  it("sem experiência não afirma tempo de trabalho; sem dados não escreve 'undefined' nem números", () => {
    const s = generateSummary(make({ objective: { targetRole: "Jovem aprendiz", keywords: ["organização"] } }), "detailed", 1, NOW);
    expect(s).not.toMatch(/anos|meses de experi/);
    expect(generateSummary(make({}), "short", 0, NOW)).not.toMatch(/undefined|null|\d/);
  });

  it("variações diferentes a cada clique, mas todas com os mesmos fatos", () => {
    const d = make({ objective: { targetRole: "Recepcionista", keywords: ["atendimento ao cliente", "agenda"] } });
    const outs = [0, 1, 2].map((v) => generateSummary(d, "short", v, NOW));
    expect(new Set(outs).size).toBe(3);
    outs.forEach((o) => expect(o).toContain("atendimento ao cliente"));
  });

  it("nunca introduz números ou nomes próprios que o usuário não informou (mesma guarda da IA)", () => {
    const s = sampleResume("classic");
    for (const len of ["short", "detailed"] as const) for (const v of [0, 1, 2]) {
      const text = generateSummary({ ...s.data, objective: { ...s.data.objective, keywords: ["atendimento", "organização"] } }, len, v, NOW);
      expect(checkNoNewFacts(text, corpusOf({ ...s.data, objective: { ...s.data.objective, keywords: ["atendimento", "organização"] } }) + " 2 anos 3 anos 4 anos 5 anos 6 anos 7 anos"), text).toEqual({ ok: true });
    }
  });
});
