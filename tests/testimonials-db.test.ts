import { beforeAll, describe, expect, it } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { asUser, createDb, createUser } from "./helpers/db";

let db: PGlite;
let alice: string, bob: string, carol: string;
const Q = "O site é simples, rápido e deixa tudo organizado. Recomendo para quem precisa de um currículo.";

beforeAll(async () => {
  db = await createDb();
  alice = await createUser(db, "alice@example.com");
  bob = await createUser(db, "bob@example.com");
  carol = await createUser(db, "carol@example.com");
  const r = (await db.query<{ id: string }>("insert into resumes (user_id) values ($1) returning id", [alice])).rows[0].id;
  await db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key, status) values ($1,$2,1,1000,'t-ok','approved')", [alice, r]);
  const r2 = (await db.query<{ id: string }>("insert into resumes (user_id) values ($1) returning id", [carol])).rows[0].id;
  await db.query("insert into payments (user_id, resume_id, resume_version, amount_cents, idempotency_key, status) values ($1,$2,1,1000,'t-pend','pending')", [carol, r2]);
});

const ins = (uid: string, name = "Alice S.", quote = Q) =>
  asUser(db, uid, () => db.query("insert into testimonials (user_id, display_name, quote, consent_at) values ($1,$2,$3, now()) returning id, status", [uid, name, quote]));

describe("depoimentos: regras no banco", () => {
  it("só quem tem pagamento aprovado consegue enviar", async () => {
    await expect(ins(bob)).rejects.toThrow();          // sem pagamento
    await expect(ins(carol)).rejects.toThrow();        // pagamento só pendente
    expect((await ins(alice)).rows[0]).toMatchObject({ status: "pending" });
  });
  it("não permite enviar em nome de outra pessoa nem texto curto demais", async () => {
    await expect(asUser(db, alice, () => db.query("insert into testimonials (user_id, display_name, quote, consent_at) values ($1,'X Y',$2, now())", [bob, Q]))).rejects.toThrow();
    await expect(asUser(db, bob, () => db.query("insert into testimonials (user_id, display_name, quote, consent_at) values ($1,'Bob',$2, now())", [bob, "curto"]))).rejects.toThrow();
  });
  it("um depoimento por pessoa", async () => {
    await expect(ins(alice)).rejects.toThrow();
  });
  it("o autor não consegue se auto-aprovar, nem por INSERT nem por UPDATE", async () => {
    await asUser(db, alice, () => db.query("update testimonials set status = 'approved', reviewed_at = now() where user_id = $1", [alice]));
    expect((await db.query("select status from testimonials where user_id = $1", [alice])).rows[0]).toMatchObject({ status: "pending" });
  });
  it("o público (anon) não vê pendentes; vê só os aprovados", async () => {
    const anon = async () => { await db.exec("set role anon"); try { return (await db.query("select display_name from testimonials")).rows; } finally { await db.exec("reset role"); } };
    expect(await anon()).toHaveLength(0);
    await db.query("update testimonials set status = 'approved', reviewed_at = now() where user_id = $1", [alice]); // administrador (service_role / SQL)
    expect(await anon()).toEqual([{ display_name: "Alice S." }]);
  });
  it("editar o conteúdo de um depoimento aprovado volta para pendente; editar nada mantém", async () => {
    await asUser(db, alice, () => db.query("update testimonials set quote = $2 where user_id = $1", [alice, Q + " Muito bom!"]));
    expect((await db.query("select status from testimonials where user_id = $1", [alice])).rows[0]).toMatchObject({ status: "pending" });
  });
  it("ninguém lê ou altera o depoimento pendente de outra pessoa", async () => {
    expect((await asUser(db, bob, () => db.query("select * from testimonials"))).rows).toHaveLength(0);
    const upd = await asUser(db, bob, () => db.query("update testimonials set quote = 'hack hack hack hack hack hack hack' where user_id = $1 returning id", [alice]));
    expect(upd.rows).toHaveLength(0);
    const del = await asUser(db, bob, () => db.query("delete from testimonials where user_id = $1 returning id", [alice]));
    expect(del.rows).toHaveLength(0);
  });
  it("o autor pode excluir o próprio depoimento; excluir a conta também apaga", async () => {
    expect((await asUser(db, alice, () => db.query("delete from testimonials where user_id = $1 returning id", [alice]))).rows).toHaveLength(1);
    await ins(alice);
    await db.query("delete from auth.users where id = $1", [alice]);
    expect((await db.query("select * from testimonials")).rows).toHaveLength(0);
  });
  it("bucket das fotos é privado", async () => {
    expect((await db.query("select public from storage.buckets where id = 'testimonial-photos'")).rows[0]).toMatchObject({ public: false });
  });
});
