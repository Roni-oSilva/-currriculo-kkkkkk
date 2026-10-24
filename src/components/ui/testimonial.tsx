import Image from "next/image";
import { Reveal } from "@/components/Motion";
import { Marker } from "@/components/ui";
import type { Testimonial } from "@/lib/testimonials";

const GRID = "absolute inset-0 bg-[linear-gradient(to_right,#ffffff1f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1f_1px,transparent_1px)] bg-[size:44px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_70%,transparent_110%)]";

type Tone = "blue" | "dark" | "light";
const TONES: Record<Tone, string> = {
  blue: "bg-brand text-white",
  dark: "bg-navy text-white",
  light: "bg-white text-ink ring-1 ring-zinc-200",
};

function Card({ t, tone, delay, grid = false, className = "" }: { t: Testimonial; tone: Tone; delay: number; grid?: boolean; className?: string }) {
  return (
    <Reveal as="article" delay={delay} className={`lift relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 ${TONES[tone]} ${className}`}>
      {grid ? <div aria-hidden className={GRID} /> : null}
      <blockquote className="relative">
        <span aria-hidden className={`mb-2 block text-5xl font-extrabold leading-none ${tone === "light" ? "text-brand" : "text-accent"}`}>“</span>
        <p className="text-[15px] leading-relaxed">{t.quote}</p>
      </blockquote>
      <footer className="relative mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-extrabold">{t.name}</p>
          <p className={`text-sm ${tone === "light" ? "text-muted" : "text-white/75"}`}>Cliente do site</p>
        </div>
        {t.photo?.startsWith("/") ? (
          <Image src={t.photo} alt={`Foto de ${t.name}`} width={96} height={96} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : t.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.photo} alt={`Foto de ${t.name}`} width={96} height={96} loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <span aria-hidden className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl text-2xl font-extrabold ${tone === "light" ? "bg-chip text-navy" : "bg-white/15 text-white"}`}>{t.name.trim()[0]?.toUpperCase()}</span>
        )}
      </footer>
    </Reveal>
  );
}

/** Depoimentos reais (com autorização). Sem itens, a seção não é exibida. */
export default function Testimonials({ items, ctaHref }: { items: Testimonial[]; ctaHref?: string }) {
  if (!items.length) return null;
  const featured = items.length >= 4;
  const [a, b, c, d] = items;
  const rest = featured ? items.slice(4) : items;
  const tones: Tone[] = ["dark", "light", "blue"];
  return (
    <section id="depoimentos" className="mx-auto max-w-6xl scroll-mt-20 rounded-[32px] bg-paper p-6 sm:p-10" aria-labelledby="dep-title">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="dep-title" className="text-3xl font-extrabold">Quem já usou, <Marker>recomenda</Marker></h2>
        <p className="mt-2 text-muted">O que dizem as pessoas que montaram o currículo aqui.</p>
      </div>
      <div className="mt-8 grid gap-3 lg:grid-cols-3">
        {featured ? (
          <>
            <Card t={c} tone="blue" grid delay={0} />
            <div className="grid gap-3">
              <Card t={a} tone="dark" delay={100} />
              <Card t={b} tone="light" delay={180} />
            </div>
            <Card t={d} tone="dark" grid delay={260} />
          </>
        ) : null}
        {rest.map((t, i) => <Card key={`${t.name}-${i}`} t={t} tone={tones[i % 3]} delay={i * 80} />)}
      </div>
      {ctaHref ? (
        <p className="mt-6 text-center text-sm text-muted">
          Já usou o site? <a href={ctaHref} className="font-extrabold text-brand underline">Deixe também o seu depoimento</a>.
        </p>
      ) : null}
    </section>
  );
}
