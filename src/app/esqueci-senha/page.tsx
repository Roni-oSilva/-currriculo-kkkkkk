import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, Marker } from "@/components/ui";
import { AuthForm } from "@/components/AuthForm";
import { forgotAction } from "@/app/auth-actions";

export const metadata = { title: "Recuperar senha" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-md p-4">
        <Card className="space-y-5">
          <h1 className="text-3xl font-extrabold"><Marker>Recuperar senha</Marker></h1>
          <p className="text-muted">Informe seu e-mail para receber o link de redefinição.</p>
          <AuthForm action={forgotAction} next={safe} submit="Enviar link" fields={[{ name: "email", label: "E-mail", type: "email", autoComplete: "email" }]} />
          <div className="space-y-1 text-sm font-semibold"><Link className="block text-brand underline" href="/login">Voltar ao login</Link></div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
