import { brazilDayStart, formatDateTime, toDateInput } from "@/lib/datetime";
import { SiteHeader } from "@/components/SiteChrome";
import { Card } from "@/components/ui";
import { AdminNav } from "@/components/AdminNav";
import { ReconcileButton } from "@/components/AdminForms";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL } from "@/lib/settings";
import { PAYMENT_STATUSES } from "@/lib/payments/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  // Filtros em dias de Brasília: de 00:00 do primeiro dia até o fim do último dia.
  const from = (sp.from && brazilDayStart(sp.from)) || brazilDayStart(toDateInput(new Date(Date.now() - 30 * 86_400_000)))!;
  const toDay = (sp.to && brazilDayStart(sp.to)) || brazilDayStart(toDateInput(new Date()))!;
  const to = toDay;
  const toEnd = new Date(toDay.getTime() + 86_400_000);
  const status = (PAYMENT_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "";

  const db = createAdminClient();
  const [{ data: metrics }, txq] = await Promise.all([
    db.rpc("admin_metrics", { p_from: from.toISOString(), p_to: toEnd.toISOString() }),
    (() => {
      let q = db.from("payments").select("id, status, amount_cents, resume_version, provider_payment_id, created_at, confirmed_at").gte("created_at", from.toISOString()).lt("created_at", toEnd.toISOString()).order("created_at", { ascending: false }).limit(200);
      if (status) q = q.eq("status", status);
      return q;
    })(),
  ]);
  const m = (metrics ?? {}) as Record<string, number>;
  const conversion = m.resumes_created ? Math.round(((m.resumes_purchased ?? 0) / m.resumes_created) * 1000) / 10 : 0;
  const cards: [string, string][] = [
    ["Usuários (total)", String(m.users_total ?? 0)], ["Currículos criados", String(m.resumes_created ?? 0)],
    ["Pagamentos aprovados", String(m.payments_approved ?? 0)], ["Receita bruta", formatBRL(m.gross_cents ?? 0)],
    ["Reembolsos", formatBRL(m.refunded_cents ?? 0)], ["Conversão da criação à compra", `${conversion.toString().replace(".", ",")}%`],
  ];
  const iso = (d: Date) => toDateInput(d);

  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-4 p-3 sm:p-5">
        <Card className="space-y-4">
          <h1 className="text-3xl font-extrabold">Painel administrativo</h1>
          <AdminNav current="overview" />
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="text-sm font-bold">De<input type="date" name="from" defaultValue={iso(from)} className="mt-1 block min-h-11 rounded-xl border-2 border-zinc-300 px-3" /></label>
            <label className="text-sm font-bold">Até<input type="date" name="to" defaultValue={iso(to)} className="mt-1 block min-h-11 rounded-xl border-2 border-zinc-300 px-3" /></label>
            <label className="text-sm font-bold">Status
              <select name="status" defaultValue={status} className="mt-1 block min-h-11 rounded-xl border-2 border-zinc-300 px-3"><option value="">Todos</option>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </label>
            <button className="min-h-11 rounded-full bg-brand px-5 font-bold text-white">Filtrar</button>
          </form>
        </Card>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([t, v]) => <li key={t} className="rounded-[24px] bg-paper p-5"><p className="text-sm font-bold text-muted">{t}</p><p className="text-3xl font-extrabold text-brand-dark">{v}</p></li>)}
        </ul>
        <Card className="overflow-x-auto">
          <h2 className="mb-3 text-xl font-extrabold">Transações</h2>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b font-bold"><th className="py-2">Data</th><th>Status</th><th>Valor</th><th>Versão</th><th>ID no provedor</th><th /></tr></thead>
            <tbody>
              {(txq.data ?? []).map((p) => (
                <tr key={p.id} className="border-b border-zinc-200">
                  <td className="py-2">{formatDateTime(p.created_at)}</td><td className="font-bold">{p.status}</td><td>{formatBRL(p.amount_cents)}</td><td>{p.resume_version}</td><td>{p.provider_payment_id ?? "—"}</td>
                  <td>{p.provider_payment_id ? <ReconcileButton id={p.id} /> : null}</td>
                </tr>
              ))}
              {!txq.data?.length ? <tr><td colSpan={6} className="py-4 text-muted">Nenhuma transação no período.</td></tr> : null}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">O status de pagamento só muda por confirmação do provedor (webhook ou “Reconsultar provedor”, que fica na auditoria). Não há edição manual.</p>
        </Card>
      </main>
    </>
  );
}
