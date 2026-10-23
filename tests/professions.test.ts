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
