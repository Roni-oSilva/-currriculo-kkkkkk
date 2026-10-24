import { expect, test } from "@playwright/test";

const PUBLIC = ["/", "/login", "/cadastro", "/esqueci-senha", "/termos", "/privacidade", "/configuracao-pendente"];

for (const path of PUBLIC) {
  test(`sem rolagem horizontal e com landmarks: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main#conteudo")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("landing: chamada principal, preço, FAQ e rodapé legal", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Seu próximo emprego começa com um");
  await expect(page.getByRole("link", { name: "Criar meu currículo" }).first()).toBeVisible();
  await expect(page.locator("#preco")).toContainText("R$");
  await expect(page.locator("#duvidas details")).not.toHaveCount(0);
  for (const name of ["Termos de uso", "Política de privacidade"]) await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.locator("#depoimentos")).toContainText("Quem já usou");
  // a página inicial não tem mais nenhuma menção à avaliação/nota
  await expect(page.locator("main")).not.toContainText(/avalia[cç][aã]o|nota de/i);
});

test("landing: seção de profissões no lugar da vitrine de modelos", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#profissoes")).toContainText("modelo de currículo ideal para a sua área");
  await expect(page.locator("#modelos")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Profissões" }).first()).toBeVisible();
});

test("depoimentos: 4 relatos com foto e sem rolagem horizontal", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#depoimentos article");
  await expect(cards).toHaveCount(4);
  for (const name of ["Camila A.", "Lucas R.", "João Pedro M.", "Mariana S."]) await expect(page.locator("#depoimentos")).toContainText(name);
  await page.locator("#depoimentos").scrollIntoViewIfNeeded();
  for (const img of await page.locator("#depoimentos img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 50), { timeout: 20_000 }).toBe(true);
  }
  await expect(page.getByRole("link", { name: "Deixe também o seu depoimento" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test("imagens de exemplo dos modelos são servidas como arquivos estáticos", async ({ request }) => {
  for (const id of ["classic", "modern", "minimal", "first-job", "creative"]) {
    const r = await request.get(`/examples/${id}.png`);
    expect(r.status()).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  }
});

test("botões e campos têm área de toque adequada (≥ 44px) nas telas de login", async ({ page }) => {
  await page.goto("/login");
  for (const el of await page.locator("input:visible, button[type=submit]").all()) {
    const box = await el.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
});

test("rotas privadas não abrem sem sessão", async ({ page }) => {
  for (const p of ["/dashboard", "/admin", "/account", "/resume/new", "/depoimento", "/admin/testimonials", "/resume/00000000-0000-4000-8000-000000000000/edit"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/configuracao-pendente|\/login/);
  }
});

test("APIs privadas respondem sem vazar dados quando não autenticado", async ({ request }) => {
  const r = await request.get("/api/resumes/00000000-0000-4000-8000-000000000000/download");
  expect([401, 503]).toContain(r.status());
  const p = await request.get("/api/resumes/00000000-0000-4000-8000-000000000000/preview");
  expect([401, 503]).toContain(p.status());
  const w = await request.post("/api/webhooks/mercadopago", { data: { type: "payment", data: { id: "1" } } });
  expect([401, 503]).toContain(w.status());
});

test("/api/health diagnostica o ambiente sem expor segredos", async ({ request }) => {
  const r = await request.get("/api/health");
  expect(r.status()).toBe(200);
  const j = await r.json();
  expect(j.pdf.ok).toBe(true);
  expect(j.imagem.ok).toBe(true);
  expect(JSON.stringify(j)).not.toMatch(/eyJ|sb_secret|APP_USR|sk-/);
  for (const v of Object.values(j.variaveis)) expect(typeof v).toBe("boolean");
});

test("teclado: o link 'Pular para o conteúdo' é o primeiro foco", async ({ page, isMobile }) => {
  test.skip(isMobile, "navegação por teclado só em desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
});
