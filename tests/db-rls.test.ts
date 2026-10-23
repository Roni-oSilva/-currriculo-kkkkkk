import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb, createUser } from "./helpers/db";

let db: PGlite;
let alice: string, bob: string, aliceResume: string;

beforeAll(async () => {
  db = await createDb();
  alice = await createUser(db, "alice@example.com");
  bob = await createUser(db, "bob@example.com");
  aliceResume = (await asUser(db, alice, () =>
    db.query<{ id: string }>("insert into resumes (user_id, title, data) values ($1, 'A', '{\"x\":1}') returning id", [alice]),
  )).rows[0].id;
});

describe("migrações e RLS", () => {
  it("cria o perfil automaticamente no cadastro", async () => {
    const r = await db.query("select email, role from profiles where id = $1", [alice]);
    expect(r.rows[0]).toMatchObject({ email: "alice@example.com", role: "user" });
  });

  it("isola currículos entre usuários (leitura, edição, exclusão)", async () => {
    const read = await asUser(db, bob, () => db.query("select * from resumes where id = $1", [aliceResume]));
    expect(read.rows).toHaveLength(0);
    const upd = await asUser(db, bob, () => db.query("update resumes set title = 'hack' where id = $1 returning id", [aliceResume]));
    expect(upd.rows).toHaveLength(0);
    const del = await asUser(db, bob, () => db.query("delete from resumes where id = $1 returning id", [aliceResume]));
    expect(del.rows).toHaveLength(0);
    expect((await db.query("select title from resumes where id = $1", [aliceResume])).rows[0]).toMatchObject({ title: "A" });
  });

  it("não permite criar currículo em nome de outro usuário", async () => {
    await expect(asUser(db, bob, () => db.query("insert into resumes (user_id, title) values ($1, 'x')", [alice]))).rejects.toThrow();
  });

  it("não permite transferir um currículo para outro usuário", async () => {
    await asUser(db, alice, () => db.query("update resumes set user_id = $1 where id = $2", [bob, aliceResume]).catch(() => null));
    expect((await db.query("select user_id from resumes where id = $1", [aliceResume])).rows[0]).toMatchObject({ user_id: alice });
  });

  it("usuário não consegue escrever em payments, resume_files, ai_generations ou logs", async () => {
    await expect(asUser(db, alice, () =>
      db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key, status) values ($1,$2,1,1000,'k1','approved')", [alice, aliceResume]))).rejects.toThrow();
    await expect(asUser(db, alice, () => db.query("insert into event_logs (type) values ('x')"))).rejects.toThrow();
    await expect(asUser(db, alice, () => db.query("insert into ai_generations (user_id, operation) values ($1, 'summary')", [alice]))).rejects.toThrow();
    await expect(asUser(db, alice, () => db.query("update app_settings set value = '1'::jsonb where key = 'price_cents'"))).rejects.toThrow();
  });

  it("usuário não consegue se promover a administrador", async () => {
    await expect(asUser(db, alice, () => db.query("update profiles set role = 'admin' where id = $1", [alice]))).rejects.toThrow(/papel/);
    expect((await db.query("select role from profiles where id = $1", [alice])).rows[0]).toMatchObject({ role: "user" });
  });

  it("ninguém além do dono lê pagamentos", async () => {
    await db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key) values ($1,$2,1,1000,'k-own')", [alice, aliceResume]);
    expect((await asUser(db, bob, () => db.query("select * from payments"))).rows).toHaveLength(0);
    expect((await asUser(db, alice, () => db.query("select * from payments"))).rows).toHaveLength(1);
  });

  it("restringe valor e moeda de pagamentos", async () => {
    await expect(db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key) values ($1,$2,1,0,'k-zero')", [alice, aliceResume])).rejects.toThrow();
    await expect(db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, currency, idempotency_key) values ($1,$2,1,1000,'USD','k-usd')", [alice, aliceResume])).rejects.toThrow();
  });

  it("garante unicidade do identificador do provedor (idempotência)", async () => {
    await db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key, provider_payment_id, status) values ($1,$2,1,1000,'k-a','PROV-1','cancelled')", [alice, aliceResume]);
    await expect(db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key, provider_payment_id, status) values ($1,$2,1,1000,'k-b','PROV-1','cancelled')", [alice, aliceResume])).rejects.toThrow();
  });

  it("permite no máximo uma cobrança pendente por currículo/versão", async () => {
    await expect(db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key) values ($1,$2,1,1000,'k-dup-pending')", [alice, aliceResume])).rejects.toThrow(/payments_one_pending_idx|unique|duplicate/i);
  });

  it("não permite voltar um pagamento aprovado para pendente nem alterar o valor", async () => {
    const r = await db.query<{ id: string }>("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key, status) values ($1,$2,1,1000,'k-appr','approved') returning id", [alice, aliceResume]);
    const id = r.rows[0].id;
    await expect(db.query("update payments set status = 'pending' where id = $1", [id])).rejects.toThrow(/Transição/);
    await expect(db.query("update payments set amount_cents = 1 where id = $1", [id])).rejects.toThrow(/imutáveis/);
    await db.query("update payments set status = 'refunded' where id = $1", [id]);
    await expect(db.query("update payments set status = 'approved' where id = $1", [id])).rejects.toThrow();
  });

  it("versão é controlada pelo banco: só sobe após conteúdo alterado com cobrança na versão atual", async () => {
    const fresh = (await asUser(db, bob, () => db.query<{ id: string }>("insert into resumes (user_id, data) values ($1, '{\"a\":1}') returning id", [bob]))).rows[0].id;
    // sem cobrança: editar não muda a versão
    await asUser(db, bob, () => db.query("update resumes set data = '{\"a\":2}' where id = $1", [fresh]));
    expect((await db.query("select version from resumes where id = $1", [fresh])).rows[0]).toMatchObject({ version: 1 });
    // com cobrança pendente na v1: editar sela v1 e cria v2
    await db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key) values ($1,$2,1,1000,'k-v1')", [bob, fresh]);
    await asUser(db, bob, () => db.query("update resumes set data = '{\"a\":3}' where id = $1", [fresh]));
    expect((await db.query("select version from resumes where id = $1", [fresh])).rows[0]).toMatchObject({ version: 2 });
    expect((await db.query("select data from resume_versions where resume_id = $1 and version = 1", [fresh])).rows[0]).toMatchObject({ data: { a: 2 } });
    // tentar forçar a versão manualmente não funciona
    await asUser(db, bob, () => db.query("update resumes set version = 1, data = '{\"a\":4}' where id = $1", [fresh]));
    expect((await db.query("select version from resumes where id = $1", [fresh])).rows[0]).toMatchObject({ version: 2 });
    // editar só o título não muda versão
    await asUser(db, bob, () => db.query("update resumes set title = 'novo' where id = $1", [fresh]));
    expect((await db.query("select version from resumes where id = $1", [fresh])).rows[0]).toMatchObject({ version: 2 });
  });

  it("snapshots de versões são visíveis só ao dono", async () => {
    expect((await asUser(db, alice, () => db.query("select * from resume_versions"))).rows).toHaveLength(0);
    expect((await asUser(db, bob, () => db.query("select * from resume_versions"))).rows.length).toBeGreaterThan(0);
  });

  it("excluir a conta apaga dados e anonimiza pagamentos", async () => {
    await db.query("delete from auth.users where id = $1", [alice]);
    expect((await db.query("select * from resumes where user_id = $1", [alice])).rows).toHaveLength(0);
    const p = await db.query("select user_id, resume_id from payments where idempotency_key = 'k-own'");
    expect(p.rows[0]).toMatchObject({ user_id: null, resume_id: null });
  });

  it("métricas administrativas só podem ser executadas por service_role", async () => {
    await expect(asUser(db, bob, () => db.query("select admin_metrics(now() - interval '1 day', now())"))).rejects.toThrow();
    const r = await db.query("select admin_metrics(now() - interval '1 day', now() + interval '1 day') as m");
    expect((r.rows[0] as { m: { users_total: number } }).m.users_total).toBeGreaterThan(0);
  });
});
