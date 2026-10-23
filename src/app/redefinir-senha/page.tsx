import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, Marker } from "@/components/ui";
import { AuthForm } from "@/components/AuthForm";
import { resetAction } from "@/app/auth-actions";

export const metadata = { title: "Nova senha" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-md p-4">
        <Card className="space-y-5">
          <h1 className="text-3xl font-extrabold"><Marker>Nova senha</Marker></h1>
          <p className="text-muted">Escolha uma nova senha para sua conta.</p>
          <AuthForm action={resetAction} next={safe} submit="Salvar nova senha" fields={[{ name: "password", label: "Nova senha", type: "password", autoComplete: "new-password", hint: "Mínimo de 8 caracteres, com letras e números." }]} />
          <div className="space-y-1 text-sm font-semibold"></div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
