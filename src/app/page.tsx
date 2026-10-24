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

const HIGHLIGHTS = ["Prévia gratuita", "Modelo ideal para cada profissão", "Avaliação de 0 a 10", "Leitura compatível com ATS", "Pagamento único via Pix", "Dados protegidos"];

const STEPS = [
  { n: "01", t: "Informe seus dados", d: "Preencha dados pessoais, experiências, formação, cursos e habilidades. Apenas nome e um contato são obrigatórios, e tudo é salvo automaticamente." },
  { n: "02", t: "Refine e avalie", d: "Revise as sugestões de redação, aprove apenas o que fizer sentido e acompanhe a nota de aderência do currículo ao modelo escolhido." },
  { n: "03", t: "Baixe o PDF final", d: "Confira a prévia sem custo, faça os ajustes que desejar e libere o arquivo definitivo, sem marca d’água, com um único pagamento." },
];

const BENEFITS = [
  ["Avaliação objetiva", "Uma nota de 0 a 10 indica o quanto o currículo se aproxima das práticas de RH e dos filtros de triagem, com recomendações específicas de melhoria."],
  ["Redação aprimorada, fatos preservados", "Ortografia, clareza e tom profissional são aperfeiçoados sem alterar empresas, datas, cursos ou competências que você informou."],
  ["Você mantém o controle", "Nenhuma sugestão é aplicada sem a sua aprovação. É possível editar e regenerar a prévia quantas vezes for necessário."],
  ["Modelo indicado para a sua área", "Informe a profissão e receba a recomendação do formato mais adequado, do clássico ao criativo com foto, com sugestões de competências."],
  ["Uso confortável no celular", "Formulários simples, botões amplos e salvamento contínuo permitem concluir o currículo de qualquer dispositivo."],
  ["Privacidade e proteção de dados", "Fotos e arquivos ficam em armazenamento privado, em conformidade com a LGPD. Você pode excluir sua conta e seus dados a qualquer momento."],
];

const PREPARE = [
  "Nome completo, telefone e e-mail profissional",
  "Cidade, estado e perfil no LinkedIn, se houver",
  "Empresas, cargos e períodos (mês e ano)",
  "Principais atividades e resultados alcançados",
  "Formação, cursos, instituições e anos de conclusão",
  "Idiomas e respectivo nível de proficiência",
  "Softwares, ferramentas e competências",
  "Descrição da vaga pretendida, para personalização",
];

const AUDIENCE = [
  ["Primeiro emprego", "Valorize formação, cursos, projetos e trabalho voluntário na ausência de experiência formal."],
  ["Recolocação", "Atualize e adapte o currículo a cada processo seletivo com rapidez e consistência."],
  ["Estágio e jovem aprendiz", "Estrutura enxuta, em uma página, com foco no que é relevante para a vaga."],
  ["Transição de carreira", "Reorganize as seções para destacar competências transferíveis à nova área."],
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

const SCORE_PARTS: [string, number][] = [
  ["Cabeçalho e contato", 1.0], ["Resumo profissional", 1.5], ["Experiência e resultados", 2.5], ["Formação acadêmica", 1.0],
  ["Habilidades", 1.2], ["Idiomas com nível", 0.5], ["Extensão (1 a 2 páginas)", 1.0], ["Modelo, foto e dados sensíveis", 1.3],
];

const FAQ = [
  ["É necessário ter experiência profissional?", "Não. O modelo “Primeiro emprego” prioriza formação, cursos, projetos e voluntariado, permitindo montar um currículo sólido sem histórico formal."],
  ["As sugestões podem alterar informações verdadeiras?", "Não. O assistente apenas reorganiza e aprimora a redação do que você escreveu. Qualquer sugestão que contenha números ou nomes não informados é descartada automaticamente, e nada é aplicado sem a sua confirmação."],
  ["Qual é o valor e como é cobrado?", "A prévia é gratuita. O PDF final, sem marca d’água, é liberado mediante pagamento único por currículo, via Pix, sem mensalidade ou fidelidade."],
  ["Como é calculada a nota de 0 a 10?", "Avaliamos estrutura, resumo, experiência, formação, habilidades, extensão e compatibilidade do modelo com sistemas de triagem (ATS). Trata-se de uma estimativa baseada em boas práticas, que não garante aprovação em processos seletivos."],
  ["O que acontece se eu alterar o currículo após o pagamento?", "Cada pagamento corresponde a uma versão do documento. Alterações posteriores exigem nova liberação, e a versão já adquirida permanece disponível para download."],
  ["Meus dados são compartilhados com terceiros?", "O assistente de sugestões recebe apenas o conteúdo profissional, sem nome, e-mail, telefone ou endereço, e somente após o seu consentimento. Detalhes na Política de Privacidade."],
  ["Posso excluir minhas informações?", "Sim. Em “Minha conta” é possível remover currículos, fotos, arquivos gerados e a própria conta, a qualquer momento."],
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
            <span className="anim-pop inline-block rounded-full bg-brand px-4 py-1.5 text-sm font-bold text-white">Currículos profissionais em poucos minutos</span>
            <h1 className="text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
              <Words text="Seu próximo emprego começa com um" start={120} />
              <span className="marker"><span className="marker-bg" aria-hidden /><Words text="bom currículo" start={620} /></span>
            </h1>
            <p className="anim-up max-w-xl text-lg text-muted" style={d(500)}>
              Organize suas informações, escolha a sua profissão, utilize o modelo indicado para a área e receba uma avaliação de <strong>0 a 10</strong> sobre a aderência do documento às práticas de RH e aos sistemas de triagem.
            </p>
            <div className="anim-up flex flex-wrap gap-3" style={d(650)}>
              <LinkButton href={cta} variant="accent" className="pulse-ring">Criar meu currículo</LinkButton>
              <LinkButton href="#profissoes" variant="outline">Ver profissões</LinkButton>
            </div>
            <ul className="tick-list anim-up flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-muted" style={d(800)}>
              <li>Prévia gratuita</li><li>PDF por {price}</li><li>Pix, sem mensalidade</li><li>Conforme a LGPD</li>
            </ul>
          </div>
          <div className="hero-blue swirl hero-card anim-up relative rounded-[28px] p-6 text-white" style={d(350)}>
            <Sticker className="absolute -right-3 -top-6 h-16 w-16" />
            <p className="text-sm font-bold uppercase tracking-wide text-chip">Exemplo de avaliação</p>
            <div className="mt-3 flex items-end gap-2"><CountUp to={8.7} className="text-7xl font-extrabold" /><span className="pb-3 text-2xl font-bold text-chip">/10</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[87%] origin-left rounded-full bg-accent" style={{ animation: "sweep 1.6s .5s cubic-bezier(.2,.7,.2,1) both" }} /></div>
            <p className="mt-3 font-bold">Alta aderência ao modelo selecionado.</p>
            <ul className="tick-list mt-4 space-y-2 text-sm">
              <li className="anim-in" style={d(700)}>Contato completo e resumo no tamanho ideal</li>
              <li className="anim-in" style={d(900)}>Experiências em ordem cronológica inversa</li>
              <li className="anim-in" style={d(1100)}>Recomendação: inclua resultados mensuráveis</li>
            </ul>
          </div>
        </section>

        {/* FAIXA */}
        <div className="hero-blue mx-auto max-w-6xl overflow-hidden rounded-[24px]"><Marquee items={HIGHLIGHTS} /></div>

        {/* PROFISSÕES */}
        <Reveal as="section" id="profissoes" className="mx-auto flex max-w-6xl scroll-mt-20 flex-wrap items-center justify-between gap-4 rounded-[32px] bg-paper p-6 sm:p-8">
          <p className="max-w-2xl text-lg font-semibold text-ink">Informe a sua profissão e indicamos o modelo de currículo mais adequado à área.</p>
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
            <h2 className="text-2xl font-extrabold">Antes de <Marker>começar</Marker></h2>
            <p className="mt-2 text-sm text-muted">Reunir estas informações torna o preenchimento mais ágil, em cerca de dez minutos. Se alguma não estiver disponível, basta seguir com o que tiver.</p>
            <ul className="mt-4 space-y-2">
              {PREPARE.map((p, i) => <Reveal as="li" key={p} delay={i * 50} className="flex gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold"><span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-brand" />{p}</Reveal>)}
            </ul>
          </Reveal>
          <Reveal as="div" delay={120} className="rounded-[32px] bg-paper p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">Para quem é indicado</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {AUDIENCE.map(([t, desc]) => (
                <li key={t} className="lift rounded-2xl bg-white p-4"><span className="mb-2 block h-1.5 w-8 rounded-full bg-accent" aria-hidden /><h3 className="font-extrabold">{t}</h3><p className="text-sm text-muted">{desc}</p></li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* RH */}
        <section id="dicas" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">O que o RH <Marker>espera ver</Marker></h2>
          <p className="mt-2 max-w-3xl text-muted">Modelos sóbrios, em coluna única, costumam ser interpretados com mais precisão pelos sistemas de triagem (ATS). Estas orientações norteiam o editor e a nota de avaliação.</p>
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
          <h3 className="mt-8 text-xl font-extrabold">Estrutura ideal, na ordem adequada</h3>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {["Cabeçalho", "Resumo profissional", "Experiência", "Formação", "Habilidades e idiomas"].map((s, i) => (
              <Reveal as="li" key={s} delay={i * 80} className="lift rounded-2xl bg-white p-4 text-center font-extrabold"><span className="mb-1 block text-sm text-brand">{i + 1}</span>{s}</Reveal>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted">Extensão: uma página para início de carreira ou até sete anos de experiência; duas páginas para posições sêniores e de gestão.</p>
        </section>

        {/* NOTA */}
        <section className="mx-auto max-w-6xl rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Como a nota é <Marker>composta</Marker></h2>
          <p className="mt-2 max-w-3xl text-muted">São dez pontos distribuídos entre os critérios abaixo. Sempre que um item estiver incompleto, indicamos exatamente o que ajustar, e a nota é atualizada em tempo real.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SCORE_PARTS.map(([t, p], i) => (
              <Reveal as="li" key={t} delay={i * 60} className="lift rounded-2xl bg-white p-4">
                <p className="text-sm font-bold text-muted">{t}</p>
                <p className="text-2xl font-extrabold text-brand-dark">{p.toFixed(1).replace(".", ",")} <span className="text-sm text-muted">pontos</span></p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-chip"><div className="bar-fill h-full rounded-full bg-brand" style={{ width: `${(p / 2.5) * 100}%` }} /></div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* BENEFÍCIOS */}
        <section className="mx-auto max-w-6xl rounded-[32px] bg-paper p-6 sm:p-10">
          <h2 className="text-3xl font-extrabold">Pensado para <Marker>simplificar</Marker></h2>
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
              <li>Prévia gratuita e edições ilimitadas antes do pagamento</li>
              <li>PDF final sem marca d’água, com texto selecionável</li>
              <li>Nota de aderência e recomendações de melhoria</li>
              <li>Pagamento via Pix, sem mensalidade</li>
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
          <p className="mt-6 text-sm text-muted">Ficou com alguma dúvida? Fale conosco pelo e-mail <a className="font-bold text-brand underline" href={`mailto:${env.contactEmail}`}>{env.contactEmail}</a>.</p>
        </section>

        {/* CTA FINAL */}
        <Reveal as="section" className="hero-blue swirl hero-card mx-auto max-w-6xl rounded-[32px] p-8 text-center text-white sm:p-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Dê o próximo passo na sua carreira</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/85">Crie o seu currículo, confira a prévia e a avaliação sem custo e pague somente quando estiver satisfeito com o resultado.</p>
          <LinkButton href={cta} variant="accent" className="mt-6">Criar meu currículo</LinkButton>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
