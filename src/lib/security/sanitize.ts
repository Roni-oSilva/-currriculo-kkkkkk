// Remove caracteres de controle (exceto \n e \t) e normaliza espaços nas pontas.
// O conteúdo nunca é injetado como HTML: React e react-pdf escapam por padrão.
export function cleanText(input: string): string {
  return input
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
