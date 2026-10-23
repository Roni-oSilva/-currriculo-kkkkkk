import { SiteFooter, SiteHeader } from "./SiteChrome";
import { Card, Notice } from "./ui";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-3xl p-4">
        <Card className="space-y-4 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-ink/90">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="text-sm text-muted">Última atualização: {updated}</p>
          <Notice tone="warn">Texto-base. Antes de publicar, preencha os dados da empresa responsável (razão social, CNPJ, endereço) e peça revisão jurídica.</Notice>
          {children}
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
