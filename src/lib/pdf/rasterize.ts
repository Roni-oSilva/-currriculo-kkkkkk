import path from "node:path";
import { pathToFileURL } from "node:url";

export interface RasterResult {
  pageCount: number;
  /** PNGs em base64 (data URL) */
  pages: string[];
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;
async function loadPdfjs() {
  // pdfjs usa Path2D/DOMMatrix/ImageData globais; em Node vêm do @napi-rs/canvas.
  const canvasLib = await import("@napi-rs/canvas");
  const g = globalThis as Record<string, unknown>;
  g.Path2D = canvasLib.Path2D;
  g.DOMMatrix = canvasLib.DOMMatrix;
  g.ImageData = canvasLib.ImageData;
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjsPromise;
}

/**
 * Converte o PDF em imagens PNG. A prévia entregue ao navegador é sempre pixel,
 * com a marca d'água já gravada na imagem — não existe PDF original para baixar.
 */
export async function rasterizePdf(pdf: Uint8Array, scale = 1.4): Promise<RasterResult> {
  const pdfjs = await loadPdfjs();
  const { createCanvas } = await import("@napi-rs/canvas");
  const root = path.join(process.cwd(), "node_modules", "pdfjs-dist");
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(pdf),
    standardFontDataUrl: pathToFileURL(path.join(root, "standard_fonts") + path.sep).href,
    useSystemFonts: false,
    verbosity: 0,
  }).promise;

  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx as any, viewport, canvas: canvas as any }).promise;
    pages.push(`data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`);
    page.cleanup();
  }
  const pageCount = doc.numPages;
  await doc.destroy();
  return { pageCount, pages };
}

export async function countPages(pdf: Uint8Array): Promise<number> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise;
  const n = doc.numPages;
  await doc.destroy();
  return n;
}
