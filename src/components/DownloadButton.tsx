"use client";

import { useState } from "react";
import { Button } from "./ui";

/** Pede uma URL assinada de 60 s ao servidor, que revalida sessão, dono, versão e pagamento. */
export function DownloadButton({ resumeId, version, label = "Baixar PDF", regenerate = false, variant = "primary" }: {
  resumeId: string; version?: number; label?: string; regenerate?: boolean; variant?: "primary" | "outline" | "light";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function go() {
    setBusy(true); setErr(null);
    try {
      const q = new URLSearchParams();
      if (version) q.set("version", String(version));
      if (regenerate) q.set("regenerate", "1");
      const res = await fetch(`/api/resumes/${resumeId}/download?${q}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Não foi possível baixar.");
      window.location.assign(json.url);
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <Button variant={variant} onClick={go} disabled={busy}>{busy ? "Preparando…" : label}</Button>
      {err ? <span role="alert" className="text-sm font-semibold text-red-700">{err}</span> : null}
    </span>
  );
}
