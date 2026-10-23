import { NextResponse } from "next/server";
import { renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf } from "@/lib/pdf/rasterize";
import { sampleResume } from "@/lib/resume/sample";
import { TEMPLATE_IDS, type TemplateId } from "@/lib/resume/schema";

export const runtime = "nodejs";

const cache = new Map<string, Buffer>();

/** Imagem de exemplo (dados fictícios e rotulados) de cada modelo, para a página inicial. */
export async function GET(_req: Request, { params }: { params: Promise<{ template: string }> }) {
  const { template } = await params;
  if (!(TEMPLATE_IDS as readonly string[]).includes(template)) return new NextResponse("Not found", { status: 404 });
  let png = cache.get(template);
  if (!png) {
    const s = sampleResume(template as TemplateId);
    const pdf = await renderPreviewPdf({ data: s.data, design: s.design });
    const { pages } = await rasterizePdf(pdf, 1.1);
    png = Buffer.from(pages[0].split(",")[1], "base64");
    cache.set(template, png);
  }
  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
