import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdf, previewWatermark, type ResumePdfProps } from "./document";
import { DEFAULT_PRICE_CENTS } from "@/lib/settings";

/** PDF final, sem marca d'água. Só deve ser chamado depois da checagem de acesso. */
export async function renderFinalPdf(props: Omit<ResumePdfProps, "watermark">): Promise<Buffer> {
  return renderToBuffer(<ResumePdf {...props} watermark={null} />);
}

/** PDF interno usado apenas para gerar as imagens da prévia (nunca é enviado ao cliente). */
export async function renderPreviewPdf(props: Omit<ResumePdfProps, "watermark"> & { priceCents?: number }): Promise<Buffer> {
  const { priceCents = DEFAULT_PRICE_CENTS, ...rest } = props;
  return renderToBuffer(<ResumePdf {...rest} watermark={previewWatermark(priceCents)} />);
}
