import { describe, expect, it } from "vitest";
import { brazilDayStart, formatDate, formatDateTime, toDateInput } from "@/lib/datetime";

describe("horário de Brasília nas telas", () => {
  it("converte UTC para Brasília (−3h), inclusive virando o dia", () => {
    expect(formatDateTime("2026-10-24T17:05:09Z")).toBe("24/10/2026 14:05:09");
    expect(formatDateTime("2026-10-24T01:30:00Z")).toBe("23/10/2026 22:30:00");
    expect(formatDate("2026-10-24T02:59:59Z")).toBe("23/10/2026");
    expect(formatDate("2026-10-24T03:00:00Z")).toBe("24/10/2026");
  });
  it("data inválida não quebra a página", () => {
    expect(formatDateTime("lixo")).toBe("—");
    expect(formatDate("")).toBe("—");
  });
  it("filtros do painel usam dias de Brasília", () => {
    expect(brazilDayStart("2026-10-24")?.toISOString()).toBe("2026-10-24T03:00:00.000Z");
    expect(brazilDayStart("24/10/2026")).toBeNull();
    expect(toDateInput("2026-10-24T02:00:00Z")).toBe("2026-10-23");
  });
  it("independe do fuso do servidor", () => {
    const old = process.env.TZ;
    process.env.TZ = "Asia/Tokyo";
    expect(formatDateTime("2026-10-24T17:05:09Z")).toBe("24/10/2026 14:05:09");
    process.env.TZ = old;
  });
});
