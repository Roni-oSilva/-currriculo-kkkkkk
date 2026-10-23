"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "saved" | "dirty" | "saving" | "offline" | "error";

/**
 * Salvamento automático com debounce, nova tentativa com recuo exponencial e tratamento
 * de conexão instável (volta a salvar assim que o navegador fica online).
 */
export function useAutosave<T>(url: string, payload: T, onSaved?: (r: { version: number }) => void) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const latest = useRef(payload);
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempts = useRef(0);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const first = useRef(true);

  const save = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) await inFlight.current;
    if (savedRevision.current === revision.current) return true;
    const rev = revision.current;
    setStatus("saving");
    const run = (async () => {
      try {
        const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(latest.current) });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        savedRevision.current = rev;
        attempts.current = 0;
        onSaved?.(json);
        setStatus(revision.current === rev ? "saved" : "dirty");
        return true;
      } catch {
        attempts.current += 1;
        setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        timer.current = setTimeout(() => void save(), Math.min(30_000, 1000 * 2 ** attempts.current));
        return false;
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    const ok = await run;
    if (ok && revision.current !== rev) return save();
    return ok;
  }, [url, onSaved]);

  useEffect(() => {
    latest.current = payload;
    if (first.current) { first.current = false; return; }
    revision.current += 1;
    setStatus((s) => (s === "saving" ? s : "dirty"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), 1200);
  }, [payload, save]);

  useEffect(() => {
    const online = () => void save();
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (savedRevision.current !== revision.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", beforeUnload);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [save]);

  /** Salva imediatamente (usar antes de navegar para a prévia). */
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    return save();
  }, [save]);

  return { status, flush };
}
