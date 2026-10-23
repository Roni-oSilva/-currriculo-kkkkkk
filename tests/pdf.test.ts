import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { renderFinalPdf, renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf, countPages } from "@/lib/pdf/rasterize";
import { sampleResume } from "@/lib/resume/sample";
import { TEMPLATE_IDS, resumePayloadSchema } from "@/lib/resume/schema";
import { extractText } from "./helpers/pdf";
import { PREVIEW_WATERMARK } from "@/lib/pdf/document";
import { resumeFileName } from "@/lib/resume/format";

describe("geração de PDF", () => {
  it.each(TEMPLATE_IDS)("modelo %s: PDF válido, texto selecionável e sem marca d'água", async (t) => {
    const s = sampleResume(t);
    const pdf = await renderFinalPdf({ data: s.data, design: s.design });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const text = await extractText(pdf);
    expect(text).toContain("Maria Exemplo da Silva");
    expect(text).toContain("maria.exemplo@email.com");
    expect(text).toContain("Administração");
    expect(text).not.toMatch(/PRÉVIA|DESBLOQUEIE/);
    expect(await countPages(pdf)).toBe(1);
  });

  it("prévia contém a marca d'água, e as imagens entregues são PNG", async () => {
    const s = sampleResume("modern");
    const pdf = await renderPreviewPdf({ data: s.data, design: s.design });
    expect(await extractText(pdf)).toContain("DESBLOQUEIE POR R$ 7,99");
    expect(PREVIEW_WATERMARK).toContain("R$ 7,99");
    const r = await rasterizePdf(pdf);
    const png = Buffer.from(r.pages[0].split(",")[1], "base64");
    const meta = await sharp(png).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width! / meta.height!).toBeCloseTo(595.28 / 841.89, 1);
  });

  it("pagina conteúdo longo sem cortar: tudo aparece, em 2+ páginas", async () => {
    const s = sampleResume("classic");
    const many = Array.from({ length: 14 }, (_, i) => ({ company: `Empresa ${i + 1}`, role: `Cargo ${i + 1}`, start: "2020-01", end: "2021-01", activities: "Atividade A\nAtividade B\nAtividade C", achievements: "Resultado informado" }));
    const long = resumePayloadSchema.parse({ ...s, data: { ...s.data, experience: many.slice(0, 14) } });
    const pdf = await renderFinalPdf({ data: long.data, design: long.design });
    const pages = await countPages(pdf);
    expect(pages).toBeGreaterThanOrEqual(2);
    const text = await extractText(pdf);
    for (let i = 1; i <= 14; i++) expect(text).toContain(`Empresa ${i}`);
  });

  it("mostra a foto quando fornecida e permitida pelo modelo; ignora no minimalista", async () => {
    const noise = Buffer.from(Array.from({ length: 200 * 200 * 3 }, (_, i) => (i * 2654435761) % 251));
    const jpg = await sharp(noise, { raw: { width: 200, height: 200, channels: 3 } }).jpeg().toBuffer();
    const s = sampleResume("classic");
    const base = await renderFinalPdf({ data: s.data, design: { ...s.design, showPhoto: false } });
    const withPhoto = await renderFinalPdf({ data: s.data, design: { ...s.design, showPhoto: true }, photo: jpg });
    expect(withPhoto.length).toBeGreaterThan(base.length + 1000);
    const m = sampleResume("minimal");
    const min = await renderFinalPdf({ data: m.data, design: { ...m.design, showPhoto: true }, photo: jpg });
    const minNo = await renderFinalPdf({ data: m.data, design: { ...m.design, showPhoto: false } });
    expect(Math.abs(min.length - minNo.length)).toBeLessThan(500);
  });

  it("respeita a ordem e a ocultação de seções", async () => {
    const s = sampleResume("classic");
    const text = await extractText(await renderFinalPdf({ data: s.data, design: { ...s.design, sectionOrder: ["skills", ...s.design.sectionOrder.filter((k) => k !== "skills")], hiddenSections: ["languages"] } }));
    expect(text.indexOf("HABILIDADES")).toBeLessThan(text.indexOf("EXPERIÊNCIA"));
    expect(text).not.toContain("IDIOMAS");
  });

  it("nome de arquivo profissional e seguro", () => {
    const s = sampleResume("classic");
    expect(resumeFileName({ ...s.data, personal: { ...s.data.personal, fullName: "José Ângelo D'Ávila/../x" } })).toBe("Curriculo_Jose_Angelo_D_Avila_x.pdf");
  });
});
