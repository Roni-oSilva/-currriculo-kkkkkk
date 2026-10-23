"use client";

import { useActionState } from "react";
import { Field, Notice, inputCls, btn } from "./ui";
import type { FormState } from "@/app/auth-actions";

type FieldDef = { name: string; label: string; type: string; autoComplete: string; hint?: string };

export function AuthForm({ action, fields, submit, next }: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  fields: FieldDef[];
  submit: string;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {fields.map((f) => (
        <Field key={f.name} label={f.label} htmlFor={f.name} hint={f.hint} error={state.fieldErrors?.[f.name]}>
          <input id={f.name} name={f.name} type={f.type} autoComplete={f.autoComplete} required className={inputCls}
            aria-invalid={Boolean(state.fieldErrors?.[f.name])} />
        </Field>
      ))}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="ok">{state.ok}</Notice> : null}
      <button type="submit" disabled={pending} className={btn("primary", "w-full")}>{pending ? "Aguarde…" : submit}</button>
    </form>
  );
}
