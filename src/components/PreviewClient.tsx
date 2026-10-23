"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, LinkButton, Notice } from "./ui";
import { AtsCard } from "./wizard/AtsCard";
import { DownloadButton } from "./DownloadButton";
import type { ResumeData, ResumeDesign } from "@/lib/resume/schema";
import type { ChargeView } from "@/lib/payments/service";

interface Props {
  resumeId: string;
  version: number;
  data: ResumeData;
  design: ResumeDesign;
  priceLabel: string;
  paymentsEnabled: boolean;
  alreadyPaid: boolean;
  repurchaseNotice: boolean;
}

export function PreviewClient({ resumeId, version, data, design, priceLabel, paymentsEnabled, alreadyPaid, repurchaseNotice }: Props) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [charge, setCharge] = useState<ChargeView | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [paid, setPaid] = useState(alreadyPaid);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const frame = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/preview`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao gerar a prévia.");
      setPages(json.pages);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, [resumeId]);
  useEffect(() => { void load(); }, [load]);

  // Dificulta cópia/impressão da prévia (não impede capturas de tela).
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const keys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["p", "s", "c", "u", "a"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const el = frame.current;
    el?.addEventListener("contextmenu", block);
    el?.addEventListener("selectstart", block);
    el?.addEventListener("dragstart", block);
    el?.addEventListener("copy", block);
    window.addEventListener("keydown", keys);
    return () => {
      el?.removeEventListener("contextmenu", block); el?.removeEventListener("selectstart", block);
      el?.removeEventListener("dragstart", block); el?.removeEventListener("copy", block);
      window.removeEventListener("keydown", keys);
    };
  }, [pages]);

  // Contagem regressiva e consulta de status (o servidor confere no provedor).
  useEffect(() => {
    if (!charge || charge.status !== "pending") return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${charge.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const { charge: c } = await res.json();
        setCharge(c);
        if (c.status === "approved") setPaid(true);
      } catch { /* conexão instável: tenta no próximo ciclo */ }
    }, 4000);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [charge]);

  async function unlock() {
    setCreating(true); setPayErr(null);
    try {
      const res = await fetch("/api/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resumeId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível iniciar o pagamento.");
      setCharge(json.charge);
      if (json.charge.status === "approved") setPaid(true);
    } catch (e) { setPayErr((e as Error).message); } finally { setCreating(false); }
  }

  const remaining = charge?.expiresAt ? Math.max(0, Math.floor((new Date(charge.expiresAt).getTime() - now) / 1000)) : null;
  const mmss = remaining === null ? "" : `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section aria-label="Prévia do currículo" className="space-y-3">
        <Card className="!p-3 sm:!p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold">Prévia gratuita</h1>
            <div className="flex flex-wrap gap-2">
              <LinkButton href={`/resume/${resumeId}/edit`} variant="outline" className="!min-h-11 text-sm">✏️ Continuar editando</LinkButton>
              <Button variant="outline" onClick={load} disabled={loading} className="!min-h-11 text-sm">{loading ? "Gerando…" : "↻ Gerar prévia novamente"}</Button>
            </div>
          </div>
          <p className="mb-3 text-sm text-muted">Mude o que quiser até achar que está bom: edite, gere a prévia de novo e confira a paginação. Só pague quando estiver satisfeito.</p>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div ref={frame} className="protected space-y-4" aria-busy={loading}>
            {loading && !pages ? <div className="grid aspect-[1/1.414] place-items-center rounded-xl bg-white font-bold text-muted">Gerando prévia…</div> : null}
            {pages?.map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-lg bg-white shadow-lg" style={{ opacity: loading ? 0.5 : 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Página ${i + 1} de ${pages.length} da prévia do currículo (com marca d’água)`} draggable={false} className="block h-auto w-full" />
                <span className="absolute bottom-2 right-3 rounded bg-black/60 px-2 py-0.5 text-xs font-bold text-white">Página {i + 1}/{pages.length}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">A prévia é uma imagem protegida com marca d’água. Ela dificulta copiar o conteúdo, mas não impede capturas de tela; o PDF limpo só é liberado após o pagamento.</p>
        </Card>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <AtsCard data={data} design={design} pageCount={pages?.length} />

        <Card className="space-y-3">
          {paid ? (
            <>
              <h2 className="text-xl font-extrabold">✅ Currículo liberado</h2>
              <p className="text-sm text-muted">Pagamento confirmado para a versão {version}. O PDF é gerado sem marca d’água, com texto selecionável.</p>
              <DownloadButton resumeId={resumeId} version={version} label="Baixar PDF" />
              <DownloadButton resumeId={resumeId} version={version} regenerate label="Gerar o arquivo novamente" variant="outline" />
              {repurchaseNotice ? <p className="text-xs text-muted">Se você alterar o conteúdo depois, será preciso uma nova compra para liberar a nova versão. A versão paga continua disponível no painel.</p> : null}
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold">Desbloquear PDF</h2>
              <p className="text-3xl font-extrabold text-brand">{priceLabel}</p>
              <p className="text-sm text-muted">Pagamento único via Pix por esta versão do currículo. O download é liberado automaticamente após a confirmação.</p>
              {!paymentsEnabled ? <Notice tone="warn">Pagamentos ainda não configurados neste ambiente (veja docs/PAYMENTS.md).</Notice> : null}
              {payErr ? <Notice tone="error">{payErr}</Notice> : null}

              {!charge || charge.status === "expired" || charge.status === "cancelled" ? (
                <>
                  {charge ? <Notice tone="warn">{charge.status === "expired" ? "O Pix expirou." : "A cobrança foi cancelada."} Gere um novo para tentar de novo.</Notice> : null}
                  <Button onClick={unlock} disabled={creating || !paymentsEnabled} className="w-full">{creating ? "Gerando Pix…" : charge ? "Gerar novo Pix" : "Desbloquear meu currículo"}</Button>
                </>
              ) : charge.status === "pending" ? (
                <div className="space-y-3" aria-live="polite">
                  {charge.qrCodeBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`data:image/png;base64,${charge.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto h-52 w-52 rounded-xl bg-white p-2" />
                  ) : null}
                  {charge.qrCode ? (
                    <>
                      <label htmlFor="pix-code" className="block text-sm font-bold">Pix copia e cola</label>
                      <textarea id="pix-code" readOnly value={charge.qrCode} rows={3} className="w-full rounded-xl border-2 border-zinc-300 bg-white p-2 text-xs" />
                      <Button variant="outline" className="w-full !min-h-11" onClick={async () => { await navigator.clipboard?.writeText(charge.qrCode!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? "Copiado!" : "Copiar código Pix"}</Button>
                    </>
                  ) : charge.ticketUrl ? <a className="font-bold text-brand underline" href={charge.ticketUrl} target="_blank" rel="noreferrer">Abrir instruções de pagamento</a> : null}
                  <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
                    <li>Abra o app do seu banco e escolha Pix.</li>
                    <li>Escaneie o QR Code ou cole o código.</li>
                    <li>Confirme: liberamos o download assim que o pagamento for aprovado.</li>
                  </ol>
                  <p className="text-sm font-bold">Aguardando pagamento… {mmss ? `expira em ${mmss}` : ""}</p>
                </div>
              ) : null}
            </>
          )}
        </Card>
      </aside>
    </div>
  );
}
