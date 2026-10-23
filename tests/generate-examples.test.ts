import { it } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderPreviewPdf } from "@/lib/pdf/render";
import { rasterizePdf } from "@/lib/pdf/rasterize";
import { sampleResume } from "@/lib/resume/sample";
import { TEMPLATE_IDS } from "@/lib/resume/schema";

/** Gera public/examples/*.png (usadas na landing). Rode: GEN_EXAMPLES=1 npx vitest run tests/generate-examples.test.ts */
it.skipIf(!process.env.GEN_EXAMPLES)("gera imagens de exemplo estáticas", async () => {
  mkdirSync("public/examples", { recursive: true });
  for (const t of TEMPLATE_IDS) {
    const s = sampleResume(t);
    const r = await rasterizePdf(await renderPreviewPdf({ data: s.data, design: s.design }), 1.3);
    writeFileSync(`public/examples/${t}.png`, Buffer.from(r.pages[0].split(",")[1], "base64"));
  }
}, 120_000);
