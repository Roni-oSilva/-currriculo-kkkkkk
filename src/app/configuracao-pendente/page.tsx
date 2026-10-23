import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, Notice } from "@/components/ui";
import { configStatus } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configuração pendente" };

export default function Pending() {
  const rows: [string, boolean, string][] = [
    ["Supabase (login e banco)", configStatus.supabase(), "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    ["Supabase service role (servidor)", configStatus.supabaseAdmin(), "SUPABASE_SERVICE_ROLE_KEY"],
    ["Inteligência artificial", configStatus.ai(), "AI_PROVIDER, AI_API_KEY, AI_MODEL (e AI_BASE_URL)"],
    ["Mercado Pago (Pix)", configStatus.payments(), "MERCADOPAGO_ACCESS_TOKEN"],
    ["Webhook do Mercado Pago", configStatus.webhook(), "MERCADOPAGO_WEBHOOK_SECRET"],
  ];
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-2xl p-4">
        <Card className="space-y-4">
          <h1 className="text-3xl font-extrabold">Configuração pendente</h1>
          <Notice tone="warn">Esta instalação ainda não está conectada a todos os serviços. Nada é simulado: as funções abaixo ficam indisponíveis até serem configuradas.</Notice>
          <ul className="space-y-2">
            {rows.map(([n, ok, vars]) => (
              <li key={n} className="rounded-xl bg-white p-3">
                <p className="font-bold">{ok ? "✅" : "⏳"} {n}</p>
                {!ok ? <p className="text-sm text-muted">Defina: <code>{vars}</code></p> : null}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">Passo a passo completo em <code>docs/DEPLOY.md</code>.</p>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
