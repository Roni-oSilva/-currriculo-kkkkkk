"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "./ui";

export function NewResumeButton({ label = "+ Criar novo currículo" }: { label?: string }) {
  return <LinkButton href="/resume/new">{label}</LinkButton>;
}

export function DeleteResumeButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function del() {
    if (!window.confirm(`Excluir “${title}”? Esta ação não pode ser desfeita e apaga também os PDFs gerados.`)) return;
    setBusy(true); setErr(null);
    const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh(); else { setErr("Não foi possível excluir."); setBusy(false); }
  }
  return (
    <span className="inline-flex flex-col">
      <Button variant="ghost" onClick={del} disabled={busy} className="!min-h-11 !text-red-700 text-sm">{busy ? "Excluindo…" : "Excluir"}</Button>
      {err ? <span role="alert" className="text-sm text-red-700">{err}</span> : null}
    </span>
  );
}

export function LogoutButton({ action }: { action: () => Promise<void> }) {
  return <form action={action}><Button type="submit" variant="outline">Sair</Button></form>;
}
