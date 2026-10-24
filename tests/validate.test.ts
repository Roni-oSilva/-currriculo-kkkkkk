import { describe, expect, it } from "vitest";
import { stepErrorCount, stepErrors } from "@/lib/resume/validate";
import { emptyResume, resumePayloadSchema } from "@/lib/resume/schema";
import { sampleResume } from "@/lib/resume/sample";

const make = (data: Record<string, unknown>, design: Record<string, unknown> = {}) => resumePayloadSchema.parse({ data, design });

describe("etapas com erro ficam em vermelho", () => {
  it("currículo vazio: só a etapa Você acusa (campos opcionais vazios não são erro)", () => {
    const e = emptyResume();
    const r = stepErrors(e.data, e.design);
    expect(Object.keys(r)).toEqual(["0"]);
    expect(r[0]).toContain("Informe o seu nome completo.");
  });
  it("exemplo completo não tem nenhum erro", () => {
    const s = sampleResume("classic");
    const filled = { ...s.data, personal: { ...s.data.personal, phone: "(11) 90000-0000" }, extras: { ...s.data.extras, languages: [{ id: "1", name: "Inglês", level: "Básico" }] } };
    expect(stepErrorCount(stepErrors(filled, s.design))).toBe(0);
  });
  it("valida e-mail, telefone e nome sem sobrenome", () => {
    const p = make({ personal: { fullName: "Maria", email: "maria@", phone: "123" } });
    const msgs = stepErrors(p.data, p.design)[0].join(" ");
    expect(msgs).toMatch(/sobrenome/);
    expect(msgs).toMatch(/e-mail parece incorreto/);
    expect(msgs).toMatch(/DDD/);
  });
  it("experiência preenchida pela metade e datas invertidas marcam a etapa Experiência", () => {
    const p = make({ personal: { fullName: "Ana Lima", phone: "11999999999" }, experience: [{ company: "Loja X" }, { role: "Caixa", company: "Y", start: "2022-05", end: "2021-01" }] });
    const r = stepErrors(p.data, p.design);
    expect(r[1].join(" ")).toMatch(/falta o cargo/);
    expect(r[1].join(" ")).toMatch(/falta a data de início/);
    expect(r[1].join(" ")).toMatch(/anterior ao início/);
    expect(r[0]).toBeUndefined();
  });
  it("estudos, idiomas sem nível, extras incompletos e foto ativada sem foto", () => {
    const p = make(
      { personal: { fullName: "Ana Lima", phone: "11999999999" }, education: [{ institution: "Escola A" }], courses: [{ hours: "20" }], extras: { languages: [{ name: "Inglês" }], projects: [{ description: "x" }] } },
      { template: "modern", showPhoto: true },
    );
    const r = stepErrors(p.data, p.design);
    expect(r[2].join(" ")).toMatch(/nível ou informe o curso/);
    expect(r[2].join(" ")).toMatch(/falta o nome do curso/);
    expect(r[3].join(" ")).toMatch(/nível real/);
    expect(r[4].join(" ")).toMatch(/Projeto 1/);
    expect(r[5].join(" ")).toMatch(/foto/);
  });
  it("modelo sem foto não acusa foto ativada", () => {
    const p = make({ personal: { fullName: "Ana Lima", phone: "11999999999" } }, { template: "minimal", showPhoto: true });
    expect(stepErrors(p.data, p.design)[5]).toBeUndefined();
  });
});
