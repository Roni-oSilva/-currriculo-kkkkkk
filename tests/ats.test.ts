import { describe, it, expect } from "vitest";
import { scoreResume } from "@/lib/resume/ats";
import { sampleResume } from "@/lib/resume/sample";
import { emptyResume, resumePayloadSchema } from "@/lib/resume/schema";

describe("nota ATS 0–10", () => {
  it("currículo vazio tem nota baixa e nunca passa de 3", () => {
    const e = emptyResume();
    const r = scoreResume(e.data, e.design);
    expect(r.score).toBeLessThanOrEqual(3);
    expect(r.verdict).toBe("baixa");
  });

  it("currículo completo e sóbrio tira nota alta; criativo tira menos que o clássico", () => {
    const s = sampleResume("classic");
    const full = resumePayloadSchema.parse({
      ...s,
      data: {
        ...s.data,
        personal: { ...s.data.personal, phone: "(11) 90000-0000" },
        objective: { ...s.data.objective, summary: "Profissional de atendimento ao cliente com experiência em rotinas administrativas, organização de documentos e controle de estoque. Busca contribuir com comunicação clara, agilidade e foco em resultados em ambiente colaborativo." },
        experience: s.data.experience.map((e) => ({ ...e, achievements: "Atendimento de 40 clientes por dia" })),
        skills: { technical: ["Atendimento", "Organização", "Controle de estoque"], tools: ["Excel", "Word", "ERP"], soft: ["Comunicação", "Equipe"], domain: [] },
      },
    });
    const classic = scoreResume(full.data, { ...full.design, template: "classic" }, 1);
    const creative = scoreResume(full.data, { ...full.design, template: "creative" }, 1);
    expect(classic.score).toBeGreaterThanOrEqual(8.5);
    expect(classic.verdict).toBe("alta");
    expect(creative.score).toBeLessThan(classic.score);
  });

  it("penaliza foto, CPF no texto e excesso de páginas", () => {
    const s = sampleResume("classic");
    const base = scoreResume(s.data, s.design, 1).score;
    const bad = resumePayloadSchema.parse({ ...s, data: { ...s.data, personal: { ...s.data.personal, photoPath: "x/y.jpg" }, extras: { ...s.data.extras, other: "CPF 123.456.789-00, solteira" } }, design: { ...s.design, showPhoto: true } });
    expect(scoreResume(bad.data, bad.design, 3).score).toBeLessThan(base);
  });

  it("detecta experiências fora de ordem cronológica inversa", () => {
    const s = sampleResume("classic");
    const swapped = { ...s.data, experience: [...s.data.experience].reverse() };
    const item = scoreResume(swapped, s.design).items.find((i) => i.id === "experience")!;
    expect(item.tip).toMatch(/mais recente/);
  });
});
