import { describe, expect, it } from "vitest";
import { PROFESSIONS, PROFESSION_CATEGORIES, findProfessionByRole, getProfession, searchProfessions, TEMPLATE_REASON } from "@/lib/resume/professions";
import { TEMPLATE_IDS } from "@/lib/resume/schema";

describe("catálogo de profissões", () => {
  it("tem ids únicos, modelos válidos e palavras-chave em todas", () => {
    expect(new Set(PROFESSIONS.map((p) => p.id)).size).toBe(PROFESSIONS.length);
    for (const p of PROFESSIONS) {
      expect(TEMPLATE_IDS).toContain(p.template);
      expect(TEMPLATE_IDS).toContain(p.alt);
      expect(p.alt).not.toBe(p.template);
      expect(p.keywords.length).toBeGreaterThanOrEqual(4);
      expect(Array.isArray(p.aliases)).toBe(true);
    }
  });
  it("cobre bastante: 100+ profissões, e todos os cinco modelos são recomendados para alguma", () => {
    expect(PROFESSIONS.length).toBeGreaterThanOrEqual(100);
    expect(PROFESSION_CATEGORIES.length).toBeGreaterThanOrEqual(10);
    for (const t of TEMPLATE_IDS) { expect(PROFESSIONS.some((p) => p.template === t)).toBe(true); expect(TEMPLATE_REASON[t]).toBeTruthy(); }
  });
  it("busca sem acento e filtro por área", () => {
    expect(searchProfessions("tecnico de enfermagem").map((p) => p.id)).toContain("tecnico-a-de-enfermagem");
    expect(searchProfessions("ADMINISTRATIVO").length).toBeGreaterThan(3);
    expect(searchProfessions("", "Saúde").every((p) => p.category === "Saúde")).toBe(true);
    expect(searchProfessions("zzzz")).toHaveLength(0);
  });
  it("encontra profissões populares e informais por nomes alternativos", () => {
    const first = (q: string) => searchProfessions(q)[0]?.name;
    expect(first("faxineira")).toBe("Faxineira / Diarista");
    expect(searchProfessions("diarista").map((p) => p.name)).toContain("Faxineira / Diarista");
    expect(searchProfessions("domestica").map((p) => p.name)).toContain("Empregada doméstica");
    expect(searchProfessions("baba").map((p) => p.name)).toContain("Babá");
    expect(searchProfessions("servente").length).toBeGreaterThanOrEqual(2);
    expect(searchProfessions("uber").map((p) => p.name)).toContain("Motorista de aplicativo / Taxista");
    expect(searchProfessions("repositor").map((p) => p.name)).toContain("Repositor(a) de mercadorias");
    expect(searchProfessions("encanador")[0].name).toMatch(/Encanador/);
    expect(searchProfessions("tecnico enfermagem").map((p) => p.id)).toContain("tecnico-a-de-enfermagem");
  });
  it("ofícios com experiência não usam o modelo de primeiro emprego", () => {
    for (const id of ["faxineira-diarista", "empregada-domestica", "baba", "auxiliar-de-limpeza", "auxiliar-de-servicos-gerais"]) {
      expect(getProfession(id)?.template).toBe("classic");
    }
  });
  it("associa o cargo digitado à profissão e valida ids", () => {
    const p = PROFESSIONS[0];
    expect(findProfessionByRole(p.name.toUpperCase())?.id).toBe(p.id);
    expect(findProfessionByRole("cargo inexistente")).toBeUndefined();
    expect(getProfession(p.id)?.name).toBe(p.name);
    expect(getProfession("../../etc")).toBeUndefined();
  });
  it("recomenda modelos sóbrios para funções técnicas e criativos para imagem/design", () => {
    expect(getProfession("desenvolvedor-a-de-software")?.template).toBe("minimal");
    expect(getProfession("designer-grafico")?.template).toBe("creative");
    expect(getProfession("recepcionista")?.template).toBe("modern");
    expect(getProfession("jovem-aprendiz")?.template).toBe("first-job");
    expect(getProfession("advogado-a")?.template).toBe("classic");
  });
});
