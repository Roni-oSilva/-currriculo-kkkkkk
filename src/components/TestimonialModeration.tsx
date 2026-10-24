"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function TestimonialModeration({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: "approve" | "reject") {
    setBusy(true);
    const res = await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    setBusy(false);
    if (res.ok) router.refresh();
  }
  return (
    <div className="flex gap-2">
      <Button onClick={() => act("approve")} disabled={busy} className="!min-h-10 text-sm">Aprovar e publicar</Button>
      <Button variant="ghost" onClick={() => act("reject")} disabled={busy} className="!min-h-10 !text-red-700 text-sm">Recusar</Button>
    </div>
  );
}
