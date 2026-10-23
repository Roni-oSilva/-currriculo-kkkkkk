/* Cliente Supabase falso, em memória, suficiente para exercitar as rotas de API. */
type Row = Record<string, unknown>;

export class FakeDb {
  tables: Record<string, Row[]> = {};
  storage: Record<string, Map<string, Uint8Array>> = {};
  signedCalls: { bucket: string; path: string; ttl: number }[] = [];
  /** Se definido, aplica "RLS": filtra linhas das tabelas listadas por este usuário. */
  constructor(public rlsUser: string | null = null, public rlsTables: Record<string, string> = {}, public shared?: FakeDb) {
    if (shared) { this.tables = shared.tables; this.storage = shared.storage; this.signedCalls = shared.signedCalls; }
  }
  table(name: string) { return (this.tables[name] ??= []); }

  from(name: string) { return new Query(this, name); }
  get storageApi() {
    return {
      from: (bucket: string) => ({
        upload: async (path: string, body: Uint8Array) => { (this.storage[bucket] ??= new Map()).set(path, body); return { data: {}, error: null }; },
        download: async (path: string) => { const b = this.storage[bucket]?.get(path); return b ? { data: new Blob([b as BlobPart]), error: null } : { data: null, error: { message: "not found" } }; },
        createSignedUrl: async (path: string, ttl: number) => { this.signedCalls.push({ bucket, path, ttl }); return { data: { signedUrl: `https://signed.example/${bucket}/${path}?ttl=${ttl}` }, error: null }; },
        remove: async () => ({ data: [], error: null }),
        list: async () => ({ data: [], error: null }),
      }),
    };
  }
  asClient(user: { id: string; email?: string } | null) {
    const self = this;
    return {
      auth: { getUser: async () => ({ data: { user: user ? { email: "u@example.com", ...user } : null } }) },
      from: (t: string) => new Query(self, t, user?.id ?? null),
      storage: self.storageApi,
    };
  }
}

class Query {
  private filters: ((r: Row) => boolean)[] = [];
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: Row | Row[] = {};
  private lim = Infinity;
  private ord: [string, boolean] | null = null;
  private wantSingle: null | "single" | "maybe" = null;
  private head = false;
  constructor(private db: FakeDb, private name: string, private rlsUser?: string | null) {
    if (rlsUser && db.rlsTables[name]) { const col = db.rlsTables[name]; this.filters.push((r) => r[col] === rlsUser); }
  }
  select(_c?: string, opts?: { head?: boolean }) { if (this.op === "select") this.op = "select"; this.head = Boolean(opts?.head); return this; }
  insert(p: Row | Row[]) { this.op = "insert"; this.payload = p; return this; }
  update(p: Row) { this.op = "update"; this.payload = p; return this; }
  upsert(p: Row) { this.op = "upsert"; this.payload = p; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  in(c: string, v: unknown[]) { this.filters.push((r) => v.includes(r[c])); return this; }
  gte(c: string, v: string) { this.filters.push((r) => String(r[c]) >= v); return this; }
  lt(c: string, v: string) { this.filters.push((r) => String(r[c]) < v); return this; }
  order(c: string, o?: { ascending?: boolean }) { this.ord = [c, o?.ascending !== false]; return this; }
  limit(n: number) { this.lim = n; return this; }
  single() { this.wantSingle = "single"; return this; }
  maybeSingle() { this.wantSingle = "maybe"; return this; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  then(res: (v: any) => any, rej?: (e: unknown) => any) { return Promise.resolve(this.exec()).then(res, rej); }

  private exec() {
    const rows = this.db.table(this.name);
    const match = () => rows.filter((r) => this.filters.every((f) => f(r)));
    let out: Row[] = [];
    if (this.op === "insert") {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const p of list) {
        const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...p };
        rows.push(row); out.push(row);
      }
    } else if (this.op === "update") {
      out = match(); out.forEach((r) => Object.assign(r, this.payload, { updated_at: new Date().toISOString() }));
    } else if (this.op === "upsert") {
      const p = this.payload as Row;
      const ex = rows.find((r) => r.resume_id === p.resume_id && r.version === p.version);
      if (ex) { Object.assign(ex, p); out = [ex]; } else { const row = { id: crypto.randomUUID(), ...p }; rows.push(row); out = [row]; }
    } else if (this.op === "delete") {
      out = match(); this.db.tables[this.name] = rows.filter((r) => !out.includes(r));
    } else out = match();
    if (this.ord) { const [c, asc] = this.ord; out = [...out].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1) * (asc ? 1 : -1)); }
    out = out.slice(0, this.lim);
    if (this.head) return { data: null, error: null, count: out.length };
    if (this.wantSingle === "single") return out[0] ? { data: out[0], error: null } : { data: null, error: { message: "no rows" } };
    if (this.wantSingle === "maybe") return { data: out[0] ?? null, error: null };
    return { data: out, error: null, count: out.length };
  }
}
