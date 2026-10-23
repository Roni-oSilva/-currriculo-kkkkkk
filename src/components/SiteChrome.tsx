import Link from "next/link";
import { Logo, LinkButton } from "./ui";
import { ScrollProgress } from "./Motion";
import { env } from "@/lib/env";

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <>
    <ScrollProgress />
    <header className="site-header sticky top-0 z-30 border-b border-white/10 bg-char/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Logo light />
        <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-semibold text-white/85 md:flex [&_a]:link-u">
          <Link href="/#profissoes" className="hover:text-white">Profissões</Link>
          <Link href="/#como-funciona" className="hover:text-white">Como funciona</Link>
          <Link href="/#dicas" className="hover:text-white">Dicas de RH</Link>
          <Link href="/#preco" className="hover:text-white">Preço</Link>
          <Link href="/#duvidas" className="hover:text-white">Dúvidas</Link>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <LinkButton href="/dashboard" variant="light" className="!min-h-10 !px-4 !py-2 text-sm">Meus currículos</LinkButton>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-sm font-bold text-white hover:bg-white/10">Entrar</Link>
              <LinkButton href="/cadastro" variant="light" className="!min-h-10 !px-4 !py-2 text-sm">Criar meu currículo</LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-char text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo light />
          <p className="text-sm">Currículos profissionais, claros e alinhados às expectativas do RH.</p>
        </div>
        <nav aria-label="Rodapé" className="space-y-2 text-sm font-semibold">
          <Link className="block hover:text-white" href="/termos">Termos de uso</Link>
          <Link className="block hover:text-white" href="/privacidade">Política de privacidade</Link>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-bold text-white">Contato</p>
          <a className="underline" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs">© {new Date().getFullYear()} Currículo Certo. Todos os direitos reservados.</p>
    </footer>
  );
}
