import { describe, expect, it } from "vitest";
import { checkNoNewFacts, corpusOf } from "@/lib/ai/guard";
import { buildModelInput, processModelOutput } from "@/lib/ai/service";
import { sampleResume } from "@/lib/resume/sample";

const s = sampleResume("classic");
const expId = s.data.experience[0].id;
const json = (suggestions: unknown[], missing: string[] = []) => "```json\n" + JSON.stringify({ suggestions, missing }) + "\n```";

describe("IA: nunca inventar fatos", () => {
  it("aceita reescrita que só usa fatos informados", () => {
    const r = processModelOutput(json([{ section: "experience", itemId: expId, field: "activities", suggested: "Atendimento presencial e telefônico ao público\nRegistro de solicitações no sistema interno", reason: "clareza" }]), s.data);
    expect(r.suggestions).toHaveLength(1);
    expect(r.suggestions[0].original).toContain("Atendimento presencial");
    expect(r.rejected).toBe(0);
  });
  it("descarta sugestões com números inventados (ex.: 150% de aumento)", () => {
    const r = processModelOutput(json([{ section: "experience", itemId: expId, field: "achievements", suggested: "Aumentei as vendas em 150% em 2022" }]), s.data);
    expect(r.suggestions).toHaveLength(0);
    expect(r.rejected).toBe(1);
  });
  it("descarta empresas, ferramentas ou títulos que o usuário não informou", () => {
    const r = processModelOutput(json([
      { section: "objective", field: "summary", suggested: "Profissional com passagem pelo Google e domínio de Python" },
      { section: "experience", itemId: expId, field: "activities", suggested: "Gestão de equipes com certificação PMP" },
    ]), s.data);
    expect(r.suggestions).toHaveLength(0);
    expect(r.rejected).toBe(2);
  });
  it("aceita nomes que já constam no currículo", () => {
    expect(checkNoNewFacts("Atuação na Empresa Exemplo Ltda. com Excel", corpusOf(s.data)).ok).toBe(true);
  });
  it("ignora alvos inexistentes (item inventado pela IA) e campos não permitidos", () => {
    const r = processModelOutput(json([
      { section: "experience", itemId: "nao-existe", field: "activities", suggested: "Texto" },
      { section: "experience", itemId: expId, field: "company", suggested: "Outra Empresa" },
    ]), s.data);
    expect(r.suggestions).toHaveLength(0);
  });
  it("tolera JSON em bloco de código e rejeita lixo", () => {
    expect(processModelOutput(json([], ["Quais resultados você teve?"]), s.data).missing).toHaveLength(1);
    expect(() => processModelOutput("desculpe, não posso", s.data)).toThrow();
  });
  it("não envia contato, endereço, links nem foto ao provedor de IA", () => {
    const withPrivate = { ...s.data, personal: { ...s.data.personal, address: "Rua Secreta 123", photoPath: "u/r/foto.jpg" } };
    const input = buildModelInput(withPrivate, "full", "Vaga de atendente");
    for (const leak of ["maria.exemplo@email.com", "90000-0000", "Rua Secreta", "linkedin.com", "foto.jpg", "Maria Exemplo da Silva"]) expect(input).not.toContain(leak);
    expect(input).toContain("<dados>");
  });
});
