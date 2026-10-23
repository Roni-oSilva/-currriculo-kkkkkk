import { countPages } from "@/lib/pdf/rasterize";

/** Extrai o texto selecionável de um PDF (prova de que não é imagem). */
export async function extractText(pdf: Uint8Array): Promise<string> {
  await countPages(pdf); // garante polyfills do pdfjs
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdf), verbosity: 0 }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const tc = await (await doc.getPage(i)).getTextContent();
    out += tc.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  await doc.destroy();
  return out;
}
