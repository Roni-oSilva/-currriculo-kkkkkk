import sharp from "sharp";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ImageError extends Error {}

/** Confere o tipo REAL pelos primeiros bytes (não confia em extensão nem Content-Type). */
export function sniffImageType(buf: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "png";
  if (buf.length >= 12 && String.fromCharCode(...buf.slice(0, 4)) === "RIFF" && String.fromCharCode(...buf.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

/**
 * Valida e normaliza a foto: tipo real, tamanho, dimensões. Reencodar como JPEG remove
 * metadados (EXIF/GPS) e qualquer conteúdo embutido que não seja imagem.
 */
export async function processProfilePhoto(input: Uint8Array): Promise<Buffer> {
  if (input.byteLength === 0) throw new ImageError("Arquivo vazio.");
  if (input.byteLength > MAX_PHOTO_BYTES) throw new ImageError("A foto deve ter no máximo 2 MB.");
  if (!sniffImageType(input)) throw new ImageError("Formato inválido. Envie JPG, PNG ou WebP.");
  try {
    const img = sharp(Buffer.from(input), { limitInputPixels: 40_000_000, failOn: "error" });
    const meta = await img.metadata();
    if (!meta.width || !meta.height || meta.width < 100 || meta.height < 100) {
      throw new ImageError("A foto deve ter ao menos 100×100 pixels.");
    }
    return await img
      .rotate()
      .resize(600, 600, { fit: "cover", position: "attention" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
  } catch (e) {
    if (e instanceof ImageError) throw e;
    throw new ImageError("Não foi possível ler a imagem. Tente outro arquivo.");
  }
}
