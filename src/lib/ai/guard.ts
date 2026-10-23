import type { ResumeData } from "@/lib/resume/schema";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Texto completo do currículo (campos de conteúdo) usado como "fonte da verdade". */
export function corpusOf(data: ResumeData, extra = ""): string {
  const parts: string[] = [extra];
  const walk = (v: unknown) => {
    if (typeof v === "string") parts.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk({ ...data, personal: { ...data.personal, photoPath: "" } });
  return parts.join("\n");
}

function numbersIn(s: string): Set<string> {
  return new Set(s.match(/\d+(?:[.,]\d+)*/g) ?? []);
}

/** Palavras capitalizadas fora do início de frase (nomes próprios, empresas, ferramentas). */
function properNouns(s: string): Set<string> {
  const out = new Set<string>();
  for (const sentence of s.split(/[.!?\n]+/)) {
    const words = sentence.trim().split(/\s+/);
    words.slice(1).forEach((w) => {
      const clean = w.replace(/^[("“]+|[)",;:”]+$/g, "");
      if (/^[A-ZÀ-Ý][\p{L}\d+#.-]{2,}$/u.test(clean) && clean !== clean.toUpperCase()) out.add(norm(clean));
      else if (/^[A-Z0-9]{2,}$/.test(clean)) out.add(norm(clean));
    });
  }
  return out;
}

export interface FactCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Defesa contra "invenção": uma sugestão não pode conter números (anos, métricas, percentuais)
 * nem nomes próprios/ferramentas ausentes do currículo original do próprio usuário.
 */
export function checkNoNewFacts(suggested: string, corpus: string): FactCheck {
  const knownNumbers = numbersIn(corpus);
  for (const n of numbersIn(suggested)) {
    if (!knownNumbers.has(n)) return { ok: false, reason: `número não informado: ${n}` };
  }
  const known = norm(corpus);
  for (const noun of properNouns(suggested)) {
    if (!new RegExp(`(^|[^\\p{L}\\d])${noun.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\d]|$)`, "u").test(known)) {
      return { ok: false, reason: `termo não informado: ${noun}` };
    }
  }
  return { ok: true };
}
