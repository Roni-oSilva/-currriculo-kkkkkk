import sharp from "sharp";
// Versão "inline": o WebAssembly do PDFium vai embutido no pacote (sem arquivos extras no deploy).
import { PDFiumLibrary } from "@hyzyla/pdfium/inline";

export interface RasterResult {
  pageCount: number;
  /** PNGs em base64 (data URL) */
  pages: string[];
}

let libPromise: Promise<PDFiumLibrary> | null = null;
const getLib = () => (libPromise ??= PDFiumLibrary.init());

/**
 * Converte o PDF em imagens PNG com o PDFium. A prévia entregue ao navegador é sempre
 * imagem, com a marca d'água já gravada nos pixels — não existe PDF original para baixar.
 */
export async function rasterizePdf(pdf: Uint8Array, scale = 1.5): Promise<RasterResult> {
  const lib = await getLib();
  const doc = await lib.loadDocument(pdf);
  try {
    const pageCount = doc.getPageCount();
    const pages: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const img = await doc.getPage(i).render({
        scale,
        render: (o) => sharp(o.data, { raw: { width: o.width, height: o.height, channels: 4 } }).png({ compressionLevel: 6 }).toBuffer(),
      });
      pages.push(`data:image/png;base64,${Buffer.from(img.data).toString("base64")}`);
    }
    return { pageCount, pages };
  } finally {
    doc.destroy();
  }
}

export async function countPages(pdf: Uint8Array): Promise<number> {
  const lib = await getLib();
  const doc = await lib.loadDocument(pdf);
  try {
    return doc.getPageCount();
  } finally {
    doc.destroy();
  }
}
