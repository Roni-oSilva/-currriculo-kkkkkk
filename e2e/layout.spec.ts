import { expect, test } from "@playwright/test";

const PUBLIC = ["/", "/login", "/cadastro", "/esqueci-senha", "/termos", "/privacidade", "/reembolso", "/configuracao-pendente"];

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
  for (const name of ["Termos de uso", "Política de privacidade", "Política de reembolso"]) await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/depoimento|clientes satisfeitos/i);
});

test("landing: exemplos reais dos 5 modelos carregam como imagem", async ({ page }) => {
  await page.goto("/");
  const imgs = page.locator("#modelos img");
  await expect(imgs).toHaveCount(5);
  for (const img of await imgs.all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 100), { timeout: 30_000 }).toBe(true);
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
  for (const p of ["/dashboard", "/admin", "/account", "/resume/00000000-0000-4000-8000-000000000000/edit"]) {
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

test("teclado: o link 'Pular para o conteúdo' é o primeiro foco", async ({ page, isMobile }) => {
  test.skip(isMobile, "navegação por teclado só em desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
});
