import { formatDateTime } from "@/lib/datetime";
import { SiteHeader } from "@/components/SiteChrome";
import { Card } from "@/components/ui";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — logs" };

export default async function AdminLogs({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  await requireAdmin();
  const { level } = await searchParams;
  const db = createAdminClient();
  let q = db.from("event_logs").select("id, level, type, message, meta, created_at").order("created_at", { ascending: false }).limit(150);
  if (level === "error" || level === "warn" || level === "info") q = q.eq("level", level);
  const [{ data: logs }, { data: audit }] = await Promise.all([q, db.from("admin_audit_log").select("id, action, target, details, created_at").order("created_at", { ascending: false }).limit(50)]);
  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-6xl space-y-4 p-3 sm:p-5">
        <Card className="space-y-3"><h1 className="text-3xl font-extrabold">Logs e eventos</h1><AdminNav current="logs" />
          <div className="flex gap-2 text-sm font-bold">{["", "error", "warn", "info"].map((l) => <a key={l} className="rounded-full bg-white px-3 py-2 ring-1 ring-zinc-300" href={l ? `?level=${l}` : "?"}>{l || "todos"}</a>)}</div>
        </Card>
        <Card className="overflow-x-auto"><h2 className="mb-2 text-xl font-extrabold">Eventos (sem dados pessoais)</h2>
          <table className="w-full min-w-[640px] text-left text-sm"><tbody>
            {(logs ?? []).map((l) => <tr key={l.id} className="border-b border-zinc-200 align-top"><td className="py-2 pr-2 whitespace-nowrap">{formatDateTime(l.created_at)}</td><td className={`pr-2 font-bold ${l.level === "error" ? "text-red-700" : l.level === "warn" ? "text-amber-700" : ""}`}>{l.level}</td><td className="pr-2 font-bold">{l.type}</td><td className="break-all text-xs text-muted">{l.message} {JSON.stringify(l.meta)}</td></tr>)}
          </tbody></table>
        </Card>
        <Card className="overflow-x-auto"><h2 className="mb-2 text-xl font-extrabold">Auditoria administrativa</h2>
          <table className="w-full min-w-[640px] text-left text-sm"><tbody>
            {(audit ?? []).map((a) => <tr key={a.id} className="border-b border-zinc-200 align-top"><td className="py-2 pr-2 whitespace-nowrap">{formatDateTime(a.created_at)}</td><td className="pr-2 font-bold">{a.action}</td><td className="pr-2">{a.target}</td><td className="break-all text-xs text-muted">{JSON.stringify(a.details)}</td></tr>)}
            {!audit?.length ? <tr><td className="py-3 text-muted">Sem registros.</td></tr> : null}
          </tbody></table>
        </Card>
      </main>
    </>
  );
}
