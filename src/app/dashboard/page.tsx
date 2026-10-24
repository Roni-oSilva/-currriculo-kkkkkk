import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, LinkButton, Notice } from "@/components/ui";
import { DeleteResumeButton, NewResumeButton } from "@/components/DashboardButtons";
import { DownloadButton } from "@/components/DownloadButton";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/resume/templates";
import { formatBRL } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus currículos" };

const PAY_LABEL: Record<string, string> = { pending: "Pagamento pendente", approved: "Pago", cancelled: "Cancelado", expired: "Expirado", refunded: "Reembolsado" };

export default async function Dashboard() {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: resumes }, { data: payments }] = await Promise.all([
    supabase.from("resumes").select("id, title, template, status, version, updated_at").order("updated_at", { ascending: false }),
    supabase.from("payments").select("id, resume_id, resume_version, status, amount_cents, created_at").order("created_at", { ascending: false }),
  ]);
  const byResume = new Map<string, NonNullable<typeof payments>>();
  for (const p of payments ?? []) if (p.resume_id) byResume.set(p.resume_id, [...(byResume.get(p.resume_id) ?? []), p]);

  return (
    <>
      <SiteHeader signedIn />
      <main id="conteudo" className="mx-auto max-w-4xl space-y-4 p-3 sm:p-5">
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold">Meus currículos</h1>
            <p className="text-muted">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/account" variant="outline">Minha conta</LinkButton>
            <NewResumeButton />
          </div>
        </Card>

        {(payments ?? []).some((p) => p.status === "approved") ? (
          <Card className="flex flex-wrap items-center justify-between gap-3 !p-4">
            <p className="font-semibold">Gostou do resultado? Conte para outras pessoas como foi.</p>
            <LinkButton href="/depoimento" variant="outline" className="!min-h-11 text-sm">Deixar meu depoimento</LinkButton>
          </Card>
        ) : null}

        {!resumes?.length ? (
          <Card className="space-y-3 text-center">
            <h2 className="text-xl font-extrabold">Você ainda não tem currículos</h2>
            <p className="text-muted">Comece agora: leva poucos minutos e a prévia é grátis.</p>
            <div className="mx-auto"><NewResumeButton label="Criar meu primeiro currículo" /></div>
          </Card>
        ) : null}

        {resumes?.map((r) => {
          const pays = byResume.get(r.id) ?? [];
          const approved = pays.filter((p) => p.status === "approved");
          const latest = pays[0];
          return (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold">{r.title}</h2>
                  <p className="text-sm text-muted">{getTemplate(r.template).name} • versão {r.version} • atualizado em {new Date(r.updated_at).toLocaleString("pt-BR")}</p>
                </div>
                <span className="rounded-full bg-chip px-3 py-1 text-sm font-bold text-navy">{r.status === "ready" ? "Pronto para prévia" : "Rascunho"}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={`/resume/${r.id}/edit`} variant="outline" className="!min-h-11 text-sm">Editar</LinkButton>
                <LinkButton href={`/resume/${r.id}/preview`} variant="outline" className="!min-h-11 text-sm">Prévia e pagamento</LinkButton>
                <DeleteResumeButton id={r.id} title={r.title} />
              </div>
              {pays.length ? (
                <details className="rounded-xl bg-white p-3">
                  <summary className="cursor-pointer font-bold">Pagamentos e versões ({pays.length})</summary>
                  <ul className="mt-2 space-y-2 text-sm">
                    {pays.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>Versão {p.resume_version} • {formatBRL(p.amount_cents)} • <strong>{PAY_LABEL[p.status]}</strong> • {new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                        {p.status === "approved" ? <DownloadButton resumeId={r.id} version={p.resume_version} label={`Baixar v${p.resume_version}`} variant="light" /> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
              {latest?.status === "pending" ? <Notice tone="info">Há um pagamento pendente. Abra “Prévia e pagamento” para ver o Pix.</Notice> : null}
              {approved.length && approved[0].resume_version < r.version ? <Notice tone="warn">Você editou este currículo depois da compra. Para baixar a versão nova, libere-a na prévia; a versão paga continua disponível acima.</Notice> : null}
            </Card>
          );
        })}
        <p className="text-center text-sm text-white/70"><Link href="/privacidade" className="underline">Privacidade</Link> • <Link href="/termos" className="underline">Termos</Link></p>
      </main>
      <SiteFooter />
    </>
  );
}
