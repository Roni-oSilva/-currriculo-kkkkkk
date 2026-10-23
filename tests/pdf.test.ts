import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { renderFinalPdf, renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf, countPages } from "@/lib/pdf/rasterize";
import { sampleResume } from "@/lib/resume/sample";
import { TEMPLATE_IDS, resumePayloadSchema } from "@/lib/resume/schema";
import { extractText } from "./helpers/pdf";
import { previewWatermark } from "@/lib/pdf/document";
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
    expect(await extractText(pdf)).toContain("DESBLOQUEIE POR R$ 10,00");
    expect(previewWatermark(1000)).toContain("R$ 10,00");
    expect(previewWatermark(1550)).toContain("R$ 15,50");
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

describe("modelos com designs distintos", () => {
  const pixel = async (dataUrl: string, xf: number, yf: number) => {
    const { data, info } = await sharp(Buffer.from(dataUrl.split(",")[1], "base64")).raw().toBuffer({ resolveWithObject: true });
    const i = (Math.floor(info.height * yf) * info.width + Math.floor(info.width * xf)) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  it("barra lateral à esquerda (Moderno) e à direita (Criativo); coluna única continua branca", async () => {
    const { samplePhoto } = await import("@/lib/resume/sample");
    const shots: Record<string, string> = {};
    for (const t of TEMPLATE_IDS) {
      const s = sampleResume(t);
      const pdf = await renderFinalPdf({ data: s.data, design: s.design, photo: s.design.showPhoto ? await samplePhoto() : null });
      shots[t] = (await rasterizePdf(pdf, 0.6)).pages[0];
    }
    expect(await pixel(shots.modern, 0.03, 0.9)).not.toEqual([255, 255, 255]);
    expect(await pixel(shots.modern, 0.97, 0.9)).toEqual([255, 255, 255]);
    expect(await pixel(shots.creative, 0.97, 0.9)).not.toEqual([255, 255, 255]);
    expect(await pixel(shots.creative, 0.03, 0.9)).toEqual([255, 255, 255]);
    for (const t of ["classic", "minimal", "first-job"]) {
      expect(await pixel(shots[t], 0.03, 0.9)).toEqual([255, 255, 255]);
      expect(await pixel(shots[t], 0.97, 0.9)).toEqual([255, 255, 255]);
    }
    expect(new Set(Object.values(shots)).size).toBe(5);
  });
  it("modelos com foto embutem a imagem; classic e minimal sem foto não aumentam o arquivo", async () => {
    const { samplePhoto } = await import("@/lib/resume/sample");
    const photo = await samplePhoto();
    for (const t of ["modern", "first-job", "creative"] as const) {
      const s = sampleResume(t);
      const a = await renderFinalPdf({ data: s.data, design: { ...s.design, showPhoto: true }, photo });
      const b = await renderFinalPdf({ data: s.data, design: { ...s.design, showPhoto: false }, photo: null });
      expect(a.length).toBeGreaterThan(b.length + 1500);
    }
  });
});
