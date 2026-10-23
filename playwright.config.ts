import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // Em ambientes com Chromium pré-instalado, aponte PW_CHROMIUM_PATH para o executável.
  use: { baseURL: "http://localhost:3100", launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {} },
  webServer: { command: "npm run build && npx next start -p 3100", url: "http://localhost:3100", reuseExistingServer: true, timeout: 240_000 },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
});
