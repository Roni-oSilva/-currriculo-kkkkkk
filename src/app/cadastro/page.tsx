import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Card, Marker } from "@/components/ui";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "@/app/auth-actions";

export const metadata = { title: "Criar conta" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-md p-4">
        <Card className="space-y-5">
          <h1 className="text-3xl font-extrabold"><Marker>Criar conta</Marker></h1>
          <p className="text-muted">Leva menos de um minuto. Ao criar a conta você já entra e escolhe a sua profissão.</p>
          <AuthForm action={registerAction} next={safe} submit="Criar conta" fields={[{ name: "fullName", label: "Nome completo", type: "text", autoComplete: "name" }, { name: "email", label: "E-mail", type: "email", autoComplete: "email" }, { name: "password", label: "Senha", type: "password", autoComplete: "new-password", hint: "Mínimo de 8 caracteres, com letras e números." }]} />
          <div className="space-y-1 text-sm font-semibold"><Link className="block text-brand underline" href="/login">Já tenho conta</Link></div>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
