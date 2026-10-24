/** Todas as datas do site são exibidas no horário de Brasília, independentemente do fuso do servidor (a Vercel usa UTC). */
export const TIME_ZONE = "America/Sao_Paulo";

const dateTime = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const dateOnly = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" });

const toDate = (v: string | number | Date) => (v instanceof Date ? v : new Date(v));

/** 24/10/2026 14:05:09 (Brasília) */
export function formatDateTime(v: string | number | Date): string {
  const d = toDate(v);
  return Number.isNaN(d.getTime()) ? "—" : dateTime.format(d).replace(",", "");
}

/** 24/10/2026 (Brasília) */
export function formatDate(v: string | number | Date): string {
  const d = toDate(v);
  return Number.isNaN(d.getTime()) ? "—" : dateOnly.format(d);
}

const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** Valor "AAAA-MM-DD" (data de Brasília) para campos <input type="date">. */
export function toDateInput(v: string | number | Date): string {
  return ymd.format(toDate(v));
}

/** Início do dia (00:00 em Brasília, UTC−3 sem horário de verão desde 2019) a partir de "AAAA-MM-DD". */
export function brazilDayStart(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const d = new Date(`${day}T00:00:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
