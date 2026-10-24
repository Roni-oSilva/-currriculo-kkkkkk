import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createDb } from "./helpers/db";

/** Executa supabase/verificacao.sql exatamente como o scripts/setup.mjs faz (sem comentários, split por ;). */
describe("supabase/verificacao.sql", () => {
  it("roda sem erro em um banco migrado e não acusa nenhum ERRO", async () => {
    const db = await createDb();
    await db.exec("update public.app_settings set value = '799'::jsonb where key = 'price_cents'");
    const sql = readFileSync("supabase/verificacao.sql", "utf8").split(/\r?\n/).filter((l) => !l.trim().startsWith("--")).join("\n");
    const stmts = sql.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
    const rows: Record<string, unknown>[] = [];
    for (const s of stmts) {
      const r = await db.query<Record<string, unknown>>(s);
      rows.push(...r.rows);
    }
    const erros = rows.filter((r) => Object.values(r).some((x) => typeof x === "string" && x.startsWith("ERRO")));
    expect(erros).toEqual([]);
    expect(rows.some((r) => r.key === "price_cents" && JSON.stringify(r.value) === "1000")).toBe(true);
    expect(rows.filter((r) => r.rls === "OK")).toHaveLength(11);
  });
});
