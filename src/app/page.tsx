import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LinkButton, Marker } from "@/components/ui";
import { CountUp, Marquee, Reveal, Sticker, Words } from "@/components/Motion";
import { formatBRL, getSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import Testimonials from "@/components/ui/testimonial";
import { TESTIMONIALS } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const HIGHLIGHTS = ["Prévia grátis", "Modelo certo para cada profissão", "Pronto em poucos minutos", "Pagamento único via Pix", "Funciona no celular", "Seus dados protegidos"];

const STEPS = [
  { n: "01", t: "Escolha sua profissão", d: "Digite o que você faz e mostramos o modelo de currículo que mais combina com a sua área." },
  { n: "02", t: "Preencha e ajuste", d: "Só nome e um contato são obrigatórios. Escreva suas palavras-chave e geramos o resumo, curto ou detalhado. Tudo é salvo sozinho." },
  { n: "03", t: "Baixe o seu PDF", d: "Veja a prévia de graça, mude o que quiser e libere o arquivo final, sem marca d’água, pagando uma vez só." },
];

const BENEFITS = [
  ["Modelo certo para a sua área", "De faxineira a desenvolvedor, indicamos o formato mais usado em cada profissão, com as competências mais comuns."],
  ["Resumo pronto em um clique", "Digite algumas palavras-chave e o site escreve o seu resumo profissional, curto ou detalhado. Você ainda pode editar."],
  ["Você decide cada detalhe", "Cores, foto, ordem das seções e modelo: mude quantas vezes quiser antes de pagar."],
  ["Texto claro e bem escrito", "Sugestões para melhorar a redação sem trocar empresas, datas, cursos ou qualquer informação sua."],
  ["Feito para o celular", "Campos simples, botões grandes e salvamento automático. Dá para fazer tudo pelo telefone."],
  ["Seus dados protegidos", "Fotos e arquivos ficam guardados em área privada. Você apaga sua conta e seus dados quando quiser."],
];

const PREPARE = [
  "Nome completo, telefone e e-mail",
  "Cidade e estado",
  "Empresas onde trabalhou, cargos e datas",
  "O que você fazia em cada trabalho",
  "Escolaridade e cursos que fez",
  "Idiomas e o seu nível",
  "O que você sabe fazer e os programas que usa",
  "A vaga que você quer (ajuda a deixar o currículo no ponto)",
];

const AUDIENCE = [
  ["Primeiro emprego", "Sem experiência? Destaque estudos, cursos, projetos e trabalho voluntário."],
  ["Procurando recolocação", "Atualize o currículo e adapte para cada vaga em poucos minutos."],
  ["Estágio e jovem aprendiz", "Modelo enxuto, de uma página, direto ao que importa."],
  ["Mudança de área", "Reorganize as seções para valorizar o que combina com o novo objetivo."],
];

const RULES_DO = [
  "Fundo branco, texto escuro e fonte sóbria",
  "Nome em destaque e contato completo no topo",
  "Resumo de três a cinco linhas com palavras-chave da vaga",
  "Experiências em ordem cronológica inversa",
  "Resultados e números reais apresentados em tópicos",
  "Envio em PDF, com uma ou duas páginas",
];
const RULES_DONT = [
  "Barras de nível, como “Excel: 80%”",
  "Múltiplas colunas, caixas e gráficos complexos",
  "Foto de grande destaque, salvo se a vaga solicitar",
  "CPF, RG, CNH e estado civil",
  "Endereço completo com CEP e número",
  "Utilizar o mesmo currículo em todas as candidaturas",
];

const FAQ = [
  ["Preciso ter experiência profissional?", "Não. O modelo “Primeiro emprego” coloca estudos, cursos, projetos e voluntariado em destaque, e você monta um currículo bom sem ter trabalhado antes."],
  ["O site muda as minhas informações?", "Não. As sugestões só melhoram a escrita do que você digitou, e nada é aplicado sem você aceitar. Empresas, datas, cursos e habilidades continuam exatamente como você informou."],
  ["Quanto custa?", "Ver a prévia é grátis. Para baixar o PDF sem marca d’água você paga um valor único por currículo, via Pix. Não existe mensalidade."],
  ["Posso mudar o currículo depois de pagar?", "Pode. Cada pagamento libera uma versão do currículo. Se você alterar o conteúdo depois, é preciso liberar a nova versão, e a versão que você já pagou continua disponível para baixar."],
  ["Como funciona o resumo automático?", "Você digita palavras-chave sobre você, como “atendimento” e “organização”, e escolhe resumo curto ou detalhado. O texto é montado só com o que você informou, e você pode editar à vontade."],
  ["Meus dados ficam seguros?", "Sim. Fotos e arquivos ficam em área privada, e o assistente de sugestões só recebe o conteúdo profissional, e apenas se você autorizar. Veja a Política de Privacidade."],
  ["Dá para apagar meus dados?", "Dá. Em “Minha conta” você exclui currículos, fotos, arquivos e a própria conta quando quiser."],
];

export default async function Home() {
  const [{ priceCents }, user] = await Promise.all([getSettings(), getSessionUser()]);
  const price = formatBRL(priceCents);
  const cta = user ? "/resume/new" : "/cadastro";
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main id="conteudo" className="space-y-4 p-3 sm:p-5">
        {/* HERO */}
        <section className="relative mx-auto grid max-w-6xl items-center gap-8 overflow-hidden rounded-[32px] bg-paper p-6 sm:p-10 md:grid-cols-2">
          <div className="drift pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-chip/70 blur-2xl" aria-hidden />
          <div className="drift pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-accent/25 blur-3xl" aria-hidden style={{ animationDelay: "-4s" }} />
          <div className="relative space-y-5">
            <span className="anim-pop inline-block rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white">Seu currículo pronto em poucos minutos</span>
            <h1 className="text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
              <Words text="Seu próximo emprego começa com um" start={120} />
              <span className="marker"><span className="marker-bg" aria-hidden /><Words text="bom currículo" start={620} /></span>
            </h1>
            <p className="anim-up max-w-xl text-lg text-muted" style={d(500)}>
              Diga qual é a sua profissão, preencha seus dados e receba um currículo bonito, organizado e no formato que o RH gosta de ver. <strong>A prévia é grátis.</strong>
            </p>
            <div className="anim-up flex flex-wrap gap-3" style={d(650)}>
              <LinkButton href={cta} variant="accent" className="pulse-ring">Criar meu currículo</LinkButton>
              <LinkButton href="#profissoes" variant="outline">Ver profissões</LinkButton>
            </div>
            <ul className="tick-list anim-up flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted" style={d(800)}>
              <li>Prévia grátis</li><li>PDF por {price}</li><li>Pix, sem mensalidade</li><li>Funciona no celular</li>
            </ul>
          </div>
          <div className="hero-blue swirl hero-card anim-up relative min-h-[22rem] overflow-hidden rounded-[28px] p-6" style={d(350)} aria-label="Exemplos de currículos">
            <Sticker className="absolute right-4 top-3 z-10 h-14 w-14" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/examples/modern.png" alt="Exemplo de currículo com barra lateral e foto" width={773} height={1093} className="float absolute left-6 top-8 w-[46%] rounded-lg shadow-2xl ring-1 ring-white/20" style={{ "--r": "-5deg" } as React.CSSProperties} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/examples/classic.png" alt="Exemplo de currículo clássico" width={773} height={1093} className="float absolute bottom-6 right-6 w-[46%] rounded-lg shadow-2xl ring-1 ring-white/20" style={{ "--r": "4deg", animationDelay: "-2s" } as React.CSSProperties} />
          </div>
        </section>

        {/* FAIXA */}
        <div className="hero-blue mx-auto max-w-6xl overflow-hidden rounded-[24px]"><Marquee items={HIGHLIGHTS} /></div>

        {/* PROFISSÕES */}
        <Reveal as="section" id="profissoes" className="mx-auto flex max-w-6xl scroll-mt-20 flex-wrap items-center justify-between gap-4 rounded-[32px] bg-paper p-6 sm:p-8">
          <p className="max-w-2xl text-lg font-semibold text-ink">Escolha a sua profissão e veja o modelo de currículo ideal para a sua área.</p>
          <LinkButton href={cta} variant="accent">Escolher minha profissão</LinkButton>
        </Reveal>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="hero-blue swirl mx-auto max-w-6xl scroll-mt-20 rounded-[32px] p-6 text-white sm:p-10">
          <h2 className="text-3xl font-extrabold">Como funciona</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 140} className="lift rounded-2xl bg-white/10 p-5">
                <span className="text-4xl font-extrabold text-accent">{s.n}</span>
                <div className="connector mt-2" aria-hidden />
                <h3 className="mt-3 text-xl font-extrabold">{s.t}</h3>
                <p className="mt-1 text-white/85">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* PREPARO + PÚBLICO */}
        <section className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          <Reveal as="div" className="rounded-[32px] bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">O que você <Marker>vai precisar</Marker></h2>
            <p className="mt-2 text-sm text-muted">Com isso em mãos você termina em uns dez minutos. Não tem tudo? Sem problema: preencha o que tiver.</p>
            <ul className="mt-4 space-y-2">
              {PREPARE.map((p, i) => <Reveal as="li" key={p} delay={i * 50} className="flex gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold"><span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-brand" />{p}</Reveal>)}
            </ul>
          </Reveal>
          <Reveal as="div" delay={120} className="rounded-[32px] bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">Para quem é</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {AUDIENCE.map(([t, desc]) => (
                <li key={t} className="lift rounded-2xl bg-white p-4"><span className="mb-2 block h-1.5 w-8 rounded-full bg-accent" aria-hidden /><h3 className="font-extrabold">{t}</h3><p className="text-sm text-muted">{desc}</p></li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* RH */}
        <section id="dicas" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">O que o RH <Marker>quer ver</Marker></h2>
          <p className="mt-2 max-w-3xl text-muted">Currículos simples, em uma coluna, são lidos com mais facilidade pelos programas de triagem das empresas. Estas dicas guiam o editor.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Reveal as="div" className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <h3 className="font-extrabold text-emerald-900">Recomendado</h3>
              <ul className="tick-list mt-2 space-y-1.5 text-sm">{RULES_DO.map((r) => <li key={r}>{r}</li>)}</ul>
            </Reveal>
            <Reveal as="div" delay={120} className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
              <h3 className="font-extrabold text-red-900">Evitar</h3>
              <ul className="tick-list mt-2 space-y-1.5 text-sm">{RULES_DONT.map((r) => <li key={r}>{r}</li>)}</ul>
            </Reveal>
          </div>
          <h3 className="mt-8 text-xl font-extrabold">A ordem ideal</h3>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {["Cabeçalho", "Resumo profissional", "Experiência", "Formação", "Habilidades e idiomas"].map((s, i) => (
              <Reveal as="li" key={s} delay={i * 80} className="lift rounded-2xl bg-white p-4 text-center font-extrabold"><span className="mb-1 block text-sm text-brand">{i + 1}</span>{s}</Reveal>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">Tamanho: uma página para quem está começando (ou tem até sete anos de experiência) e duas páginas para cargos de gestão.</p>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-6xl rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Feito para ser <Marker>fácil</Marker></h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([t, desc], i) => (
              <Reveal as="li" key={t} delay={i * 70} className="lift rounded-2xl bg-white p-5">
                <span className="mb-2 block h-1.5 w-8 rounded-full bg-brand" aria-hidden />
                <h3 className="font-extrabold text-brand-dark">{t}</h3>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* DEPOIMENTOS */}
        <Testimonials items={TESTIMONIALS} />

        {/* PREÇO */}
        <section id="preco" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 text-center sm:p-10">
          <h2 className="text-3xl font-extrabold">Quanto <Marker>custa</Marker></h2>
          <Reveal as="div" className="hero-blue hero-card mx-auto mt-6 max-w-md rounded-[28px] p-8 text-white">
            <p className="text-6xl font-extrabold">{price}</p>
            <p className="mt-1 font-bold">por currículo liberado</p>
            <ul className="tick-list mt-4 space-y-1 text-left text-sm">
              <li>Prévia grátis e quantas edições quiser antes de pagar</li>
              <li>PDF final sem marca d’água</li>
              <li>Modelo recomendado para a sua profissão</li>
              <li>Pagamento único via Pix, sem mensalidade</li>
            </ul>
            <LinkButton href={cta} variant="accent" className="mt-6 w-full">Começar gratuitamente</LinkButton>
          </Reveal>
        </section>

        {/* FAQ */}
        <section id="duvidas" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Perguntas <Marker>frequentes</Marker></h2>
          <div className="mt-6 space-y-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-2xl bg-white p-5 transition-shadow open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold">{q}<span aria-hidden className="text-xl text-brand transition-transform duration-300 group-open:rotate-45">+</span></summary>
                <p className="step-enter mt-2 text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">Ainda com dúvida? Escreva para <a className="font-bold text-brand underline" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.</p>
        </section>

        {/* CTA FINAL */}
        <Reveal as="section" className="hero-blue swirl hero-card mx-auto max-w-6xl rounded-[32px] p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Seu próximo emprego pode começar hoje</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">Monte o currículo, veja a prévia sem pagar nada e só libere o PDF quando estiver do jeito que você quer.</p>
          <LinkButton href={cta} variant="accent" className="mt-6">Criar meu currículo</LinkButton>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
