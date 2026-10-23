import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, Marker } from "@/components/ui";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "@/app/auth-actions";

export const metadata = { title: "Entrar" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-md p-4">
        <Card className="space-y-5">
          <h1 className="text-3xl font-extrabold"><Marker>Entrar</Marker></h1>
          <p className="text-muted">Acesse seus currículos salvos.</p>
          <AuthForm action={loginAction} next={safe} submit="Entrar" fields={[{ name: "email", label: "E-mail", type: "email", autoComplete: "email" }, { name: "password", label: "Senha", type: "password", autoComplete: "current-password" }]} />
          <div className="space-y-1 text-sm font-semibold"><Link className="block text-brand underline" href="/esqueci-senha">Esqueci minha senha</Link><Link className="block text-brand underline" href="/cadastro">Ainda não tenho conta</Link></div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
