import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processProfilePhoto, sniffImageType, ImageError } from "@/lib/security/image";
import { rateLimit, resetRateLimits } from "@/lib/security/ratelimit";
import { cleanText } from "@/lib/security/sanitize";
import { redact } from "@/lib/log";
import { resumePayloadSchema, emptyResume, designSchema, SECTION_KEYS } from "@/lib/resume/schema";
import { loginSchema, passwordSchema, registerSchema } from "@/lib/auth-schemas";

const png = (w = 300, h = 300) => sharp({ create: { width: w, height: h, channels: 3, background: "#336699" } }).png().toBuffer();

describe("upload seguro de fotos", () => {
  it("aceita imagem válida e reencoda como JPEG 600×600 sem metadados", async () => {
    const withExif = await sharp({ create: { width: 800, height: 500, channels: 3, background: "#fff" } }).withMetadata({ exif: { IFD0: { Copyright: "x" } } }).jpeg().toBuffer();
    const out = await processProfilePhoto(withExif);
    expect(sniffImageType(out)).toBe("jpeg");
    const meta = await sharp(out).metadata();
    expect([meta.width, meta.height]).toEqual([600, 600]);
    expect(meta.exif).toBeUndefined();
  });
  it("aceita PNG e converte", async () => { expect(sniffImageType(await processProfilePhoto(await png()))).toBe("jpeg"); });
  it("recusa arquivo disfarçado (HTML/SVG/PDF/EXE com extensão de imagem)", async () => {
    for (const body of ["<html><script>alert(1)</script></html>", "<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>", "%PDF-1.4 fake", "MZ\x90\x00 fake exe"]) {
      await expect(processProfilePhoto(new TextEncoder().encode(body.padEnd(2000, " ")))).rejects.toBeInstanceOf(ImageError);
    }
  });
  it("recusa cabeçalho de imagem com conteúdo corrompido", async () => {
    const fake = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(3000, 7)]);
    await expect(processProfilePhoto(fake)).rejects.toThrow(/imagem/i);
  });
  it("recusa arquivo grande demais (> 2 MB), vazio e muito pequeno", async () => {
    await expect(processProfilePhoto(new Uint8Array(2 * 1024 * 1024 + 1))).rejects.toThrow(/2 MB/);
    await expect(processProfilePhoto(new Uint8Array(0))).rejects.toThrow();
    await expect(processProfilePhoto(await png(40, 40))).rejects.toThrow(/100/);
  });
});

describe("limite de requisições", () => {
  it("bloqueia após o limite e libera depois da janela", () => {
    resetRateLimits();
    const t = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t + i).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, t + 10);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 1000, t + 2000).ok).toBe(true);
    expect(rateLimit("outra", 3, 1000, t).ok).toBe(true);
  });
});

describe("validação e sanitização", () => {
  it("remove caracteres de controle e bidi", () => {
    expect(cleanText("  Olá\u0000 mun‮do​  ")).toBe("Olá mundo");
  });
  it("aceita currículo vazio (todos os blocos opcionais) e aplica padrões", () => {
    const e = emptyResume();
    expect(e.data.experience).toEqual([]);
    expect(e.design.sectionOrder).toHaveLength(SECTION_KEYS.length);
  });
  it("rejeita datas inválidas e URLs não http(s)", () => {
    expect(resumePayloadSchema.safeParse({ design: {}, data: { experience: [{ start: "13/2020" }] } }).success).toBe(false);
    expect(resumePayloadSchema.safeParse({ design: {}, data: { personal: { linkedin: "data:text/html,x" } } }).success).toBe(false);
    expect(resumePayloadSchema.safeParse({ design: {}, data: { personal: { linkedin: "https://linkedin.com/in/x" } } }).success).toBe(true);
  });
  it("limita tamanhos e quantidades", () => {
    expect(resumePayloadSchema.safeParse({ design: {}, data: { objective: { summary: "x".repeat(1501) } } }).success).toBe(false);
    expect(resumePayloadSchema.safeParse({ design: {}, data: { experience: Array.from({ length: 31 }, () => ({})) } }).success).toBe(false);
  });
  it("só permite cores e modelos da lista controlada", () => {
    expect(designSchema.safeParse({ accent: "#ff0000" }).success).toBe(false);
    expect(designSchema.safeParse({ template: "hacker" }).success).toBe(false);
  });
  it("normaliza a ordem das seções (sem duplicadas, sem faltantes)", () => {
    expect(designSchema.parse({ sectionOrder: ["skills", "skills", "education"] }).sectionOrder.slice(0, 2)).toEqual(["skills", "education"]);
    expect(designSchema.parse({ sectionOrder: ["skills"] }).sectionOrder).toHaveLength(SECTION_KEYS.length);
  });
  it("não registra dados pessoais nos logs", () => {
    const r = redact({ email: "a@b.com", phone: "1", password: "x", token: "t", data: { a: 1 }, payment_id: "p1", resume_id: "r1" });
    expect(r).toEqual({ payment_id: "p1", resume_id: "r1" });
  });
});

describe("cadastro e autenticação (validação)", () => {
  it("exige e-mail válido, nome e senha forte", () => {
    expect(registerSchema.safeParse({ fullName: "Ana", email: "ana@x.com", password: "abc12345" }).success).toBe(true);
    expect(registerSchema.safeParse({ fullName: "Ana", email: "ana", password: "abc12345" }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: "A", email: "ana@x.com", password: "abc12345" }).success).toBe(false);
    expect(passwordSchema.safeParse("curta1").success).toBe(false);
    expect(passwordSchema.safeParse("somenteletras").success).toBe(false);
    expect(loginSchema.safeParse({ email: "ANA@X.COM ", password: "x" })).toMatchObject({ success: true, data: { email: "ana@x.com" } });
  });
});
