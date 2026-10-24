import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";

const stub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role', true), '') $$;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
grant usage on schema auth, public, storage to anon, authenticated, service_role;
`;

export async function createDb() {
  const db = new PGlite();
  await db.exec(stub);
  // Reproduz os privilégios padrão do Supabase, que as migrações então restringem.
  await db.exec(`
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);
  for (const f of ["0001_schema.sql", "0002_rls.sql", "0003_storage.sql", "0004_price_10.sql", "0005_testimonials.sql"]) {
    await db.exec(readFileSync(path.join(process.cwd(), "supabase/migrations", f), "utf8"));
  }
  return db;
}

export async function createUser(db: PGlite, email: string): Promise<string> {
  const r = await db.query<{ id: string }>("insert into auth.users (email) values ($1) returning id", [email]);
  return r.rows[0].id;
}

/** Executa como um usuário final (RLS aplicado). */
export async function asUser<T>(db: PGlite, uid: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false); select set_config('request.jwt.claim.role', 'authenticated', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); select set_config('request.jwt.claim.role', '', false);`); }
}
