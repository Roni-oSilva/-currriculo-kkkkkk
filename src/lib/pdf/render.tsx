import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdf, PREVIEW_WATERMARK, type ResumePdfProps } from "./document";

/** PDF final, sem marca d'água. Só deve ser chamado depois da checagem de acesso. */
export async function renderFinalPdf(props: Omit<ResumePdfProps, "watermark">): Promise<Buffer> {
  return renderToBuffer(<ResumePdf {...props} watermark={null} />);
}

/** PDF interno usado apenas para gerar as imagens da prévia (nunca é enviado ao cliente). */
export async function renderPreviewPdf(props: Omit<ResumePdfProps, "watermark">): Promise<Buffer> {
  return renderToBuffer(<ResumePdf {...props} watermark={PREVIEW_WATERMARK} />);
}
